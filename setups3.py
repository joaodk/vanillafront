#!/usr/bin/env python

# purpose: create and setup a bucket for deploying a react app (static site)
# to s3/cloudfront
# 
#
import boto3
import os
import json
import sys
import typer
import time
from botocore.exceptions import ClientError

# Load environment variables
domain_name = os.getenv('AWS_DOMAIN_NAME')
hosted_zone_id = os.getenv('AWS_HOSTED_ZONE_ID')
ssl_certificate_arn = os.getenv('AWS_SSL_CERTIFICATE_ARN')
bucket_name = 'joaodk-vanillafront'

# Validate required environment variables
if not all([domain_name, hosted_zone_id, ssl_certificate_arn]):
    print("Error: Missing required environment variables")
    print("Please set AWS_DOMAIN_NAME, AWS_HOSTED_ZONE_ID, and AWS_SSL_CERTIFICATE_ARN")
    print("These should be defined in your .env.local file")
    sys.exit(1)

app = typer.Typer()


def get_distribution_id_by_domain(domain_name):
    """Get CloudFront distribution ID by domain name."""
    try:
        cloudfront_client = boto3.client("cloudfront")
        paginator = cloudfront_client.get_paginator('list_distributions')
        pages = paginator.paginate()
        for page in pages:
            for distribution in page['DistributionList']['Items']:
                if distribution['Aliases']['Quantity'] > 0 and domain_name in distribution['Aliases']['Items']:
                    return distribution['Id']
    except ClientError as e:
        print(f"Error getting distribution ID: {e}")
    return None


def create_cloudfront_distribution(bucket_name, domain_name, ssl_certificate_arn, region):
    """Create CloudFront distribution for the S3 bucket."""
    cloudfront_client = boto3.client("cloudfront")
    
    # Check if distribution already exists
    existing_distribution_id = get_distribution_id_by_domain(domain_name)
    if existing_distribution_id:
        print(f"CloudFront distribution already exists with ID: {existing_distribution_id}")
        return existing_distribution_id
    
    # S3 website endpoint format
    if region == "us-east-1":
        origin_domain = f"{bucket_name}.s3-website-us-east-1.amazonaws.com"
    else:
        origin_domain = f"{bucket_name}.s3-website-{region}.amazonaws.com"
    
    distribution_config = {
        'CallerReference': f"{bucket_name}-{int(time.time())}",
        'Aliases': {
            'Quantity': 1,
            'Items': [domain_name]
        },
        'DefaultRootObject': 'index.html',
        'Origins': {
            'Quantity': 1,
            'Items': [
                {
                    'Id': f"{bucket_name}-origin",
                    'DomainName': origin_domain,
                    'CustomOriginConfig': {
                        'HTTPPort': 80,
                        'HTTPSPort': 443,
                        'OriginProtocolPolicy': 'http-only'
                    }
                }
            ]
        },
        'DefaultCacheBehavior': {
            'TargetOriginId': f"{bucket_name}-origin",
            'ViewerProtocolPolicy': 'redirect-to-https',
            'MinTTL': 0,
            'ForwardedValues': {
                'QueryString': False,
                'Cookies': {'Forward': 'none'}
            },
            'TrustedSigners': {
                'Enabled': False,
                'Quantity': 0
            }
        },
        'Comment': f'CloudFront distribution for {domain_name}',
        'Enabled': True,
        'ViewerCertificate': {
            'ACMCertificateArn': ssl_certificate_arn,
            'SSLSupportMethod': 'sni-only',
            'MinimumProtocolVersion': 'TLSv1.2_2021'
        },
        'CustomErrorResponses': {
            'Quantity': 1,
            'Items': [
                {
                    'ErrorCode': 404,
                    'ResponsePagePath': '/index.html',
                    'ResponseCode': '200',
                    'ErrorCachingMinTTL': 300
                }
            ]
        }
    }
    
    try:
        response = cloudfront_client.create_distribution(DistributionConfig=distribution_config)
        distribution_id = response['Distribution']['Id']
        cloudfront_domain_name = response['Distribution']['DomainName']
        
        print(f"CloudFront distribution created successfully!")
        print(f"Distribution ID: {distribution_id}")
        print(f"CloudFront Domain: {cloudfront_domain_name}")
        
        return distribution_id, cloudfront_domain_name
    except ClientError as e:
        print(f"Error creating CloudFront distribution: {e}")
        raise


def check_and_update_route53(domain_name, cloudfront_domain_name, hosted_zone_id):
    """Create or update Route53 A record to point to CloudFront distribution."""
    route53_client = boto3.client("route53")
    
    try:
        # Check if record already exists
        response = route53_client.list_resource_record_sets(
            HostedZoneId=hosted_zone_id,
            StartRecordName=domain_name,
            StartRecordType="A",
            MaxItems="1"
        )
        
        record_sets = response["ResourceRecordSets"]
        action = "UPSERT"  # Create or update
        
        if record_sets and record_sets[0]["Name"].rstrip('.') == domain_name and record_sets[0]["Type"] == "A":
            print(f"Updating existing Route53 A record for {domain_name}")
        else:
            print(f"Creating new Route53 A record for {domain_name}")
        
        change_batch = {
            "Changes": [
                {
                    "Action": action,
                    "ResourceRecordSet": {
                        "Name": domain_name,
                        "Type": "A",
                        "AliasTarget": {
                            "DNSName": cloudfront_domain_name,
                            "EvaluateTargetHealth": False,
                            "HostedZoneId": "Z2FDTNDATAQYW2"  # CloudFront hosted zone ID
                        }
                    }
                }
            ]
        }
        
        response = route53_client.change_resource_record_sets(
            HostedZoneId=hosted_zone_id,
            ChangeBatch=change_batch
        )
        
        print(f"Route53 record updated successfully for {domain_name}")
        print(f"Change ID: {response['ChangeInfo']['Id']}")
        
    except ClientError as e:
        print(f"Error updating Route53 record: {e}")
        raise


def create_cloudfront_invalidation(domain_name):
    """Create CloudFront invalidation to clear cache."""
    try:
        cloudfront_client = boto3.client("cloudfront")
        distribution_id = get_distribution_id_by_domain(domain_name)
        
        if not distribution_id:
            print(f"No CloudFront distribution found for {domain_name}")
            return
        
        response = cloudfront_client.create_invalidation(
            DistributionId=distribution_id,
            InvalidationBatch={
                'Paths': {
                    'Quantity': 1,
                    'Items': ['/*']
                },
                'CallerReference': f"invalidation-{int(time.time())}"
            }
        )
        
        invalidation_id = response['Invalidation']['Id']
        print(f"CloudFront invalidation created: {invalidation_id}")
        print("Cache will be cleared in a few minutes...")
        
    except ClientError as e:
        print(f"Error creating CloudFront invalidation: {e}")


@app.command()
def create(
    bucket_name: str = typer.Option(bucket_name, help="S3 bucket name"),
    region: str = typer.Option("us-east-1", help="AWS region"),
):
    """Create S3 bucket, CloudFront distribution, and Route53 record for static website hosting."""
    print(f"Creating S3 bucket: {bucket_name} in region: {region}")
    s3_client = boto3.client("s3", region_name=region)
    
    try:
        # Create S3 bucket
        if region == "us-east-1":
            s3_client.create_bucket(Bucket=bucket_name)
        else:
            s3_client.create_bucket(
                Bucket=bucket_name,
                CreateBucketConfiguration={"LocationConstraint": region}
            )
        print(f"S3 bucket {bucket_name} created successfully")
    except ClientError as e:
        if e.response['Error']['Code'] == 'BucketAlreadyOwnedByYou':
            print(f"Bucket {bucket_name} already exists and is owned by you")
        elif e.response['Error']['Code'] == 'BucketAlreadyExists':
            print(f"Error: Bucket {bucket_name} already exists and is owned by someone else")
            return
        else:
            print(f"Error creating bucket: {e}")
            return

    # Configure bucket for static website hosting
    print("Configuring bucket for static website hosting")
    try:
        s3_client.put_bucket_website(
            Bucket=bucket_name,
            WebsiteConfiguration={
                "IndexDocument": {"Suffix": "index.html"},
                "ErrorDocument": {"Key": "error.html"}
            }
        )
        print("Static website hosting configured successfully")
    except ClientError as e:
        print(f"Error configuring website: {e}")
        return

    # Disable Block Public Access settings
    print("Disabling Block Public Access settings...")
    try:
        s3_client.put_public_access_block(
            Bucket=bucket_name,
            PublicAccessBlockConfiguration={
                'BlockPublicAcls': False,
                'IgnorePublicAcls': False,
                'BlockPublicPolicy': False,
                'RestrictPublicBuckets': False
            }
        )
        print("Block Public Access settings disabled")
    except ClientError as e:
        print(f"Error disabling Block Public Access: {e}")
        return

    # Set bucket policy for public read access
    print("Setting bucket policy for public read access...")
    try:
        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "PublicReadGetObject",
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "s3:GetObject",
                    "Resource": f"arn:aws:s3:::{bucket_name}/*"
                }
            ]
        }
        s3_client.put_bucket_policy(
            Bucket=bucket_name,
            Policy=json.dumps(bucket_policy)
        )
        print("Bucket policy set for public read access")
    except ClientError as e:
        print(f"Error setting bucket policy: {e}")
        return

    # Create CloudFront distribution
    print("Creating CloudFront distribution...")
    try:
        distribution_id, cloudfront_domain_name = create_cloudfront_distribution(
            bucket_name, domain_name, ssl_certificate_arn, region
        )
        print(f"CloudFront distribution created with ID: {distribution_id}")

        # Update Route53 record
        check_and_update_route53(domain_name, cloudfront_domain_name, hosted_zone_id)
        
        print(f"\nSetup complete! Your site will be available at:")
        print(f"  - https://{domain_name}")
        print(f"  - https://{cloudfront_domain_name}")
        print(f"\nNote: CloudFront deployment may take 10-15 minutes to complete.")
        
    except Exception as e:
        print(f"Error creating CloudFront distribution: {e}")
        return

    print("Create operation completed successfully!")


@app.command()
def deploy(
    bucket_name: str = typer.Option(bucket_name, help="S3 bucket name"),
    region: str = typer.Option("us-east-1", help="AWS region"),
):
    """Deploy build files to S3 bucket."""
    print("Copying build output to the bucket")
    s3_client = boto3.client("s3", region_name=region)
    
    try:
        # Ensure the 'build/client' directory exists (SPA mode)
        if not os.path.exists("build/client"):
            print("Error: The 'build/client' directory does not exist. Please run 'npm run build' first.")
            return

        uploaded_files = 0
        for root, _, files in os.walk("build/client"):
            for file in files:
                file_path = os.path.join(root, file)
                relative_path = os.path.relpath(file_path, "build/client")
                s3_key = relative_path.replace("\\", "/")  # Fix for Windows paths
                
                # Set content type based on file extension
                content_type = "text/html"
                if file.endswith('.css'):
                    content_type = "text/css"
                elif file.endswith('.js'):
                    content_type = "application/javascript"
                elif file.endswith('.json'):
                    content_type = "application/json"
                elif file.endswith('.png'):
                    content_type = "image/png"
                elif file.endswith('.jpg') or file.endswith('.jpeg'):
                    content_type = "image/jpeg"
                elif file.endswith('.svg'):
                    content_type = "image/svg+xml"
                elif file.endswith('.ico'):
                    content_type = "image/x-icon"
                
                s3_client.upload_file(
                    file_path, 
                    bucket_name, 
                    s3_key,
                    ExtraArgs={'ContentType': content_type}
                )
                print(f"Uploaded: {file_path} to s3://{bucket_name}/{s3_key}")
                uploaded_files += 1
        
        print(f"\nDeployment complete! {uploaded_files} files uploaded.")
        
        # Create CloudFront invalidation to clear cache
        print("skipping CloudFront invalidation...")
        #print("Creating CloudFront invalidation to clear cache...")
        #create_cloudfront_invalidation(domain_name)
        
        print(f"Your site should be available at: https://{domain_name}")
        
    except ClientError as e:
        print(f"Error deploying files: {e}")
        return
    except Exception as e:
        print(f"Error deploying files: {e}")
        return

    print("Deploy operation completed successfully!")


@app.command()
def invalidate(
    bucket_name: str = typer.Option(bucket_name, help="S3 bucket name"),
    region: str = typer.Option("us-east-1", help="AWS region"),
):
    """Create CloudFront invalidation to clear cache."""
    print("Creating CloudFront invalidation...")
    create_cloudfront_invalidation(domain_name)
    print("Invalidation operation completed successfully!")


@app.command()
def destroy(
    bucket_name: str = typer.Option(bucket_name, help="S3 bucket name"),
    region: str = typer.Option("us-east-1", help="AWS region"),
):
    """Destroy all AWS resources (CloudFront distribution, Route53 record, and S3 bucket)."""
    print(f"Destroying resources for {domain_name}...")
    
    try:
        # Delete CloudFront distribution first
        cloudfront_client = boto3.client("cloudfront")
        distribution_id = get_distribution_id_by_domain(domain_name)
        
        if distribution_id:
            print(f"Found CloudFront distribution: {distribution_id}")
            try:
                # Get current distribution config
                distribution_response = cloudfront_client.get_distribution(Id=distribution_id)
                distribution_config = distribution_response['Distribution']['DistributionConfig']
                etag = distribution_response['ETag']
                
                # Disable the distribution
                if distribution_config['Enabled']:
                    print("Disabling CloudFront distribution...")
                    distribution_config['Enabled'] = False
                    cloudfront_client.update_distribution(
                        Id=distribution_id, 
                        DistributionConfig=distribution_config, 
                        IfMatch=etag
                    )
                    
                    # Wait for distribution to be disabled
                    print("Waiting for distribution to be disabled (this may take several minutes)...")
                    waiter = cloudfront_client.get_waiter('distribution_deployed')
                    waiter.wait(Id=distribution_id, WaiterConfig={'Delay': 30, 'MaxAttempts': 60})
                
                # Get updated ETag after disable
                distribution_response = cloudfront_client.get_distribution(Id=distribution_id)
                etag = distribution_response['ETag']
                
                # Delete the distribution
                cloudfront_client.delete_distribution(Id=distribution_id, IfMatch=etag)
                print(f"CloudFront distribution {distribution_id} deleted")
                
            except ClientError as e:
                print(f"Error deleting CloudFront distribution: {e}")
        else:
            print(f"No CloudFront distribution found for domain {domain_name}")

        # Delete Route53 record
        route53_client = boto3.client("route53")
        try:
            response = route53_client.list_resource_record_sets(
                HostedZoneId=hosted_zone_id,
                StartRecordName=domain_name,
                StartRecordType="A",
                MaxItems="1"
            )

            record_sets = response["ResourceRecordSets"]

            if record_sets and record_sets[0]["Name"].rstrip('.') == domain_name and record_sets[0]["Type"] == "A":
                route53_client.change_resource_record_sets(
                    HostedZoneId=hosted_zone_id,
                    ChangeBatch={
                        "Changes": [
                            {
                                "Action": "DELETE",
                                "ResourceRecordSet": record_sets[0]
                            }
                        ]
                    }
                )
                print(f"Route53 record for {domain_name} deleted")
            else:
                print(f"No Route53 A record found for {domain_name}")
        except ClientError as e:
            print(f"Error deleting Route53 record: {e}")

        # Delete S3 bucket contents and bucket
        print(f"Deleting S3 bucket: {bucket_name}")
        s3_client = boto3.client("s3", region_name=region)
        try:
            # Delete all objects in the bucket
            s3 = boto3.resource('s3', region_name=region)
            bucket = s3.Bucket(bucket_name)
            bucket.objects.all().delete()
            bucket.object_versions.all().delete()  # Delete versions if versioning is enabled

            # Delete the bucket
            s3_client.delete_bucket(Bucket=bucket_name)
            print(f"S3 bucket {bucket_name} deleted")
        except ClientError as e:
            if e.response['Error']['Code'] == 'NoSuchBucket':
                print(f"S3 bucket {bucket_name} does not exist")
            else:
                print(f"Error deleting S3 bucket: {e}")

        print("Destroy operation completed!")

    except Exception as e:
        print(f"Error during destroy operation: {e}")
        return

    print("Destroy operation completed successfully!")


if __name__ == "__main__":
    app()
