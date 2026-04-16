# mAItravel2 - Setup Instructions

## Overview
A study AI assistant combining Ollama (local AI) with powerpoint presentation of a lecture data via RAG (Retrieval-Augmented Generation).

**Note:** Uses hash-based embeddings for vector search and Ollama's `llama3.2` model for chat generation.

## Prerequisites
- Node.js (v20.16.0+ or v22.3.0+)
- Docker (for ChromaDB)
- Ollama (for local AI model)

## Setup Steps

### 1. Install and Start Ollama
```bash
# Install Ollama
brew install ollama

# Start Ollama service
brew services start ollama

# Download llama3.2 model
ollama pull llama3.2
```

### 2. Configure Environment Variables (Optional)
Edit `apps/backend/.env` to customize Ollama settings:
```
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

### 3. Start ChromaDB
```bash
docker compose up -d
```

This will start ChromaDB on port 8000.

### 4. Start Backend (NestJS)
```bash
nx serve backend
```

The backend will:
- Start on http://localhost:3000
- Connect to ChromaDB
- Parse pptx presentation on first run
- Generate embeddings and store them in ChromaDB
- Be ready to handle chat requests

### 5. Start Frontend (Angular)
```bash
nx serve frontend
```

The frontend will start on http://localhost:4200

## Testing

### Slovakia Query Test
Open http://localhost:4200 and ask:
> "What are the best places to visit in Slovakia?"

Expected: Answer citing specific details from the brochures (towns, landmarks, etc.)

### Non-Slovakia Query Test
Ask:
> "What are the best places to visit in Paris?"

Expected: Standard Gemini answer without Slovakia brochure content

## Architecture

```
Browser (Angular) → POST /api/chat
    ↓
NestJS ChatController
    ↓
RagService.retrieve() → ChromaDB (similarity search)
    ↓
Build enriched prompt with context
    ↓
Gemini generateContent
    ↓
Response → Browser
```

## Key Files

### Backend
- `apps/backend/src/app/chat/chat.controller.ts` - REST endpoint
- `apps/backend/src/app/chat/chat.service.ts` - Gemini integration
- `apps/backend/src/app/rag/rag.service.ts` - RAG orchestration
- `apps/backend/src/app/rag/embedding.service.ts` - Text embeddings
- `apps/backend/src/app/rag/pptx-parser.service.ts` - pptx parsing

### Frontend
- `apps/frontend/src/app/chat/chat.component.ts` - Chat UI
- `apps/frontend/src/app/chat/chat.service.ts` - HTTP client

## Build for Production

```bash
# Build backend
nx build backend

# Build frontend
nx build frontend
```

## Troubleshooting

### ChromaDB Connection Issues
- Ensure Docker is running: `docker ps`
- Check ChromaDB logs: `docker compose logs chromadb`

### Gemini API Errors
- Verify API key is set correctly in `.env`
- Check API quota/limits in Google Cloud Console
