# Whisper Model Local Setup

## Problem
The Whisper model was failing to load in production with the error:
```
Error loading Whisper model: SyntaxError: Unexpected token '<', "<!DOCTYPE "... is not valid JSON
```

This happened because `@xenova/transformers` was trying to download the model from HuggingFace during runtime, but in production the downloads were failing and returning HTML error pages instead of model files.

## Solution
We implemented a local model pre-download system that:

1. **Downloads models at build time** instead of runtime
2. **Serves models locally** from `public/model/whisper-tiny/`
3. **Prevents network dependency** in production

## Files Modified

### 1. `scripts/download-models.js`
- Downloads all required Whisper model files from HuggingFace
- Handles redirects properly
- Creates the correct directory structure
- Files downloaded:
  - `config.json`
  - `tokenizer.json`
  - `tokenizer_config.json` 
  - `generation_config.json`
  - `onnx/encoder_model_quantized.onnx`
  - `onnx/decoder_model_merged_quantized.onnx`

### 2. `package.json`
- Added `download-models` script
- Integrated model download into build process
- Added `postinstall` hook for automatic setup

### 3. `app/features/transcription/providers/TranscriptionProvider.tsx`
- Changed from `'Xenova/whisper-tiny'` to `'/model/whisper-tiny'`
- Configured transformers to use local models only:
  ```typescript
  env.allowLocalModels = true;
  env.allowRemoteModels = false;
  env.cacheDir = './public/model';
  ```

### 4. `.gitignore`
- Added `/public/model/whisper-tiny/` to exclude downloaded model files from git

## Usage

### Development
```bash
# Models are automatically downloaded on npm install
npm install
npm run dev
```

### Production Build
```bash
# Models are downloaded as part of the build process
npm run build
```

### Manual Model Download
```bash
# If you need to manually download/update models
npm run download-models
```

## Model Structure
```
public/model/whisper-tiny/
├── config.json                           # Model configuration
├── generation_config.json                # Generation parameters  
├── tokenizer.json                        # Main tokenizer
├── tokenizer_config.json                 # Tokenizer settings
└── onnx/
    ├── encoder_model_quantized.onnx      # Encoder model (~16MB)
    ├── decoder_model_merged_quantized.onnx # Decoder model (~24MB)
```

## Benefits
- ✅ **Reliable Production Loading**: No network dependency during model loading
- ✅ **Faster Initialization**: Models load from local disk instead of downloading
- ✅ **Consistent Behavior**: Same model files in dev and production
- ✅ **Offline Capability**: Works without internet access once models are downloaded

## Troubleshooting

### Models Not Found Error
If you get errors about missing models:
```bash
rm -rf public/model/whisper-tiny
npm run download-models
```

### Build Failures
If the download fails during build, check your network connection and try:
```bash
npm run download-models
```

### Production Deployment
Make sure your deployment process includes:
1. Running `npm run download-models` or `npm run build`
2. Serving static files from `public/model/` directory
3. Proper MIME types for `.onnx` files (if needed)

## Model Size Impact
- Total download: ~40MB
- This increases your build output but eliminates runtime download issues
- Models are served as static assets, cached by browsers
