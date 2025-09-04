# Development Environment Setup

This project includes an easy way to switch between development and production API endpoints during development.

## Available Commands

### NPM Scripts:
- `npm run dev` - Start development server with **DEV** API endpoints
- `npm run dev:prod-api` - Start development server with **PROD** API endpoints

### Makefile Targets:
- `make run` - Start development server with **DEV** API endpoints  
- `make run-prod-api` - Start development server with **PROD** API endpoints

## API Endpoints Used:

### Development Environment (`npm run dev` or `make run`):
- **CHAT_API:** `http://joaodk-devbox.tail0c7363.ts.net:8008/chat`
- **ANALYZE_API:** `http://joaodk-devbox.tail0c7363.ts.net:8008/analyze`

### Production API Testing (`npm run dev:prod-api` or `make run-prod-api`):
- **CHAT_API:** `https://g2ihdgat3d.execute-api.us-east-1.amazonaws.com/api/chat`
- **ANALYZE_API:** `https://g2ihdgat3d.execute-api.us-east-1.amazonaws.com/api/analyze`

## How It Works

The setup uses the `VITE_ENVIRONMENT` environment variable to override the automatic environment detection in `app/lib/constants.ts`. When you run the prod-api commands, it sets `VITE_ENVIRONMENT=PROD` which forces the application to use production API endpoints even during development.

## Use Cases

- **Regular Development:** Use `make run` for normal development with local/dev APIs
- **Production Testing:** Use `make run-prod-api` to test against production APIs during development
- **API Integration Testing:** Verify your frontend works correctly with production backend
- **Debugging Production Issues:** Test production API behavior in a development environment
