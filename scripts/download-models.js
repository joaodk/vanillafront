#!/usr/bin/env node

import fs from 'fs';
import https from 'https';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MODEL_DIR = path.join(__dirname, '..', 'public', 'model', 'whisper-tiny');
const HUGGINGFACE_BASE = 'https://huggingface.co/Xenova/whisper-tiny/resolve/main';

// Files needed for whisper-tiny model
const MODEL_FILES = [
  'config.json',
  'tokenizer.json', 
  'tokenizer_config.json',
  'generation_config.json',
  'preprocessor_config.json',
  'onnx/encoder_model_quantized.onnx',
  'onnx/decoder_model_merged_quantized.onnx'
];

function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`Created directory: ${dirPath}`);
  }
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    console.log(`Downloading: ${url}`);
    
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        response.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log(`✓ Downloaded: ${path.basename(filepath)}`);
          resolve();
        });
      } else if (response.statusCode >= 300 && response.statusCode < 400) {
        // Handle redirects (301, 302, 307, 308, etc.)
        let redirectUrl = response.headers.location;
        
        // Handle relative redirects
        if (redirectUrl.startsWith('/')) {
          const urlObj = new URL(url);
          redirectUrl = `${urlObj.protocol}//${urlObj.host}${redirectUrl}`;
        }
        
        downloadFile(redirectUrl, filepath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`Failed to download ${url}: ${response.statusCode}`));
      }
    }).on('error', (err) => {
      fs.unlink(filepath, () => {}); // Delete the file on error
      reject(err);
    });
  });
}

async function downloadModels() {
  try {
    console.log('Setting up Whisper model directories...');
    
    // Ensure base directories exist
    ensureDirectoryExists(MODEL_DIR);
    ensureDirectoryExists(path.join(MODEL_DIR, 'onnx'));
    
    console.log('Downloading Whisper model files...');
    
    for (const file of MODEL_FILES) {
      const url = `${HUGGINGFACE_BASE}/${file}`;
      const filepath = path.join(MODEL_DIR, file);
      
      // Skip if file already exists
      if (fs.existsSync(filepath)) {
        console.log(`⏭ Skipping (already exists): ${file}`);
        continue;
      }
      
      try {
        await downloadFile(url, filepath);
      } catch (error) {
        console.error(`✗ Failed to download ${file}:`, error.message);
        process.exit(1);
      }
    }
    
    console.log('\n✅ All Whisper model files downloaded successfully!');
    console.log(`Model directory: ${MODEL_DIR}`);
    
  } catch (error) {
    console.error('Error downloading models:', error);
    process.exit(1);
  }
}

// Run the download
downloadModels();
