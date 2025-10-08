# Vanilla Front

An experimental, work-in-progress application created to serve as a template for other front-end applications, with a number of experimental features, that includes:

- User authentication/sign-in/identity, etc through Clerk
- Payments and subscriptions through Clerk/Stripe
- A chat interface for LLMs
- Client side STT with Whisper
- Client side TTS with Kitten-TTS

## Environment Setup

### Application Environment Variables

Copy `.env.example` to `.env` and fill in the required values:

```bash
cp .env.example .env
```

Required environment variables:
- `CLERK_SECRET_KEY`: Your Clerk secret key
- `OPENAI_API_KEY`: Your OpenAI API key for chat features

### AWS Infrastructure Environment Variables

For deploying to AWS S3 + CloudFront using `setups3.py`, set these environment variables:

- `AWS_DOMAIN_NAME`: Your custom domain name 
- `AWS_HOSTED_ZONE_ID`: Found in Route53 > Hosted Zones > yourdomain.com > Hosted Zone ID
- `AWS_SSL_CERTIFICATE_ARN`: Found in AWS Certificate Manager > Certificates > Certificate ARN

