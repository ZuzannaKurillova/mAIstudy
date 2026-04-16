# mAIstudy

A study AI assistant application that combines local AI models (Ollama) with pptx presentation data using RAG (Retrieval-Augmented Generation) to provide intelligent, context-aware study responses.

## 🌟 Features

- **Local AI Processing**: Uses Ollama with the `llama3.2` model for chat generation
- **RAG Implementation**: Retrieval-Augmented Generation with ChromaDB for vector search
- **pptx Processing**: Automatically parses and indexes pptx presentation
- **Modern Stack**: Built with NestJS (backend) and Angular (frontend)
- **Monorepo Architecture**: Managed with Nx for efficient development

## 🏗️ Architecture

```
┌─────────────────┐
│  Angular App    │  (Port 4200)
│   (Frontend)    │
└────────┬────────┘
         │ HTTP
         ↓
┌─────────────────┐
│  NestJS API     │  (Port 3000)
│   (Backend)     │
└────┬────────┬───┘
     │        │
     │        └──────→ ┌──────────────┐
     │                 │   Ollama     │  (Port 11434)
     │                 │  llama3.2    │
     │                 └──────────────┘
     │
     └──────────────→ ┌──────────────┐
                      │  ChromaDB    │  (Port 8000)
                      │ Vector Store │
                      └──────────────┘
```

### Data Flow

1. User sends a query through the Angular frontend
2. Backend receives the request and uses RAG service to:
   - Generate embeddings for the query
   - Search ChromaDB for relevant context from brochures
   - Build an enriched prompt with retrieved context
3. Ollama processes the prompt and generates a response
4. Response is returned to the user

## 📋 Prerequisites

- **Node.js**: v20.16.0+ or v22.3.0+
- **Docker**: For running ChromaDB
- **Ollama**: For local AI model execution

## 🚀 Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Ollama

```bash
# Install Ollama (macOS)
brew install ollama

# Start Ollama service
brew services start ollama

# Download the llama3.2 model
ollama pull llama3.2
```

### 3. Start ChromaDB

```bash
docker compose up -d
```

This starts ChromaDB on port 8000 with persistent storage.

### 4. Configure Environment (Optional)

Edit `apps/backend/.env` to customize settings:

```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
CHROMA_HOST=localhost
CHROMA_PORT=8000
```

### 5. Start the Backend

```bash
nx serve backend
```

The backend will:
- Start on http://localhost:3000
- Connect to ChromaDB and Ollama
- Parse pptx presentations on first run (if present)
- Generate and store embeddings
- Be ready to handle chat requests

### 6. Start the Frontend

```bash
nx serve frontend
```

The frontend will be available at http://localhost:4200

## 🧪 Testing

### Test with Query that is in the course presentations

Open http://localhost:4200 and ask:
```
What are the disadvantages of the web applications?
```

**Expected**: The AI will provide answers based on the indexed presentation content, citing specific slides, giving the sources that student can further check when clicking them.

### Test with General Query that is not in the presentations

Ask:
```
What are the best places to visit in Paris?
```

**Expected**: The AI will provide a negative answer that this information hasn't been part of the presentations.

## 📁 Project Structure

```
mAIstudy/
├── apps/
│   ├── backend/              # NestJS API
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── chat/     # Chat endpoints and services
│   │   │   │   └── rag/      # RAG implementation
│   │   │   └── main.ts
│   │   └── .env              # Environment configuration
│   └── frontend/             # Angular application
│       ├── src/
│       │   ├── app/
│       │   │   └── chat/     # Chat UI components
│       │   └── main.ts
│       └── public/
├── docker-compose.yml        # ChromaDB configuration
├── nx.json                   # Nx workspace configuration
└── package.json              # Dependencies
```

### Key Backend Files

- **`apps/backend/src/app/chat/chat.controller.ts`**: REST API endpoints
- **`apps/backend/src/app/chat/chat.service.ts`**: Ollama integration
- **`apps/backend/src/app/rag/rag.service.ts`**: RAG orchestration logic
- **`apps/backend/src/app/rag/embedding.service.ts`**: Text embedding generation
- **`apps/backend/src/app/rag/pptx-parser.service.ts`**: pptx presentation parsing

### Key Frontend Files

- **`apps/frontend/src/app/chat/chat.component.ts`**: Chat UI component
- **`apps/frontend/src/app/chat/chat.service.ts`**: HTTP client for API calls

## 🛠️ Development

### Available Commands

```bash
# Serve backend
nx serve backend

# Serve frontend
nx serve frontend

# Build backend
nx build backend

# Build frontend
nx build frontend

# Run all tests
nx test

# Lint code
nx lint
```

### Adding pptx presentation

Place pptx files in the workspace root. The backend will automatically:
1. Detect and parse pptxs on startup
2. Extract text content
3. Generate embeddings
4. Store them in ChromaDB for retrieval

## 🏭 Production Build

```bash
# Build both applications
nx build backend
nx build frontend

# Output will be in:
# - dist/apps/backend/
# - dist/apps/frontend/
```

## 🔧 Troubleshooting

### ChromaDB Connection Issues

```bash
# Check if Docker is running
docker ps

# View ChromaDB logs
docker compose logs chromadb

# Restart ChromaDB
docker compose restart chromadb
```

### Ollama Issues

```bash
# Check if Ollama is running
ollama list

# Restart Ollama service
brew services restart ollama

# Verify model is downloaded
ollama pull llama3.2
```

### Backend Not Starting

- Ensure ChromaDB is running on port 8000
- Verify Ollama is accessible on port 11434
- Check `.env` file configuration
- Review backend logs for specific errors

### pptx Processing Errors

- Verify pptx files are readable and not corrupted
- Check file permissions
- Ensure sufficient disk space for embeddings storage

## 🤝 Technologies Used

### Backend
- **NestJS**: Progressive Node.js framework
- **ChromaDB**: Vector database for embeddings
- **Ollama**: Local AI model runtime
- **pptx-parse**: pptx text extraction

### Frontend
- **Angular 21**: Modern web framework
- **RxJS**: Reactive programming
- **TypeScript**: Type-safe development

### Infrastructure
- **Nx**: Monorepo build system
- **Docker**: Container runtime for ChromaDB
- **Webpack**: Module bundler

## 📚 Additional Documentation

For detailed setup instructions, see [`SETUP.md`](./SETUP.md)
