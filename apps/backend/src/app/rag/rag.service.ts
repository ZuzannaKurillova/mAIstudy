import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ChromaClient } from 'chromadb';
import { EmbeddingService } from './embedding.service';
import { PptxParserService } from './pptx-parser.service';

const RESET_DB = process.env.RESET_DB === 'true';

@Injectable()
export class RagService implements OnModuleInit {
  private readonly logger = new Logger(RagService.name);
  private chromaClient: ChromaClient;
  private collection: any;

  private readonly COLLECTION_NAME = 'vaii_presentations';
  private readonly TOP_K = 4;

  constructor(
    private configService: ConfigService,
    private embeddingService: EmbeddingService,
    private pptxParserService: PptxParserService
  ) {
    const chromaHost = this.configService.get<string>('CHROMA_HOST', 'localhost');
    const chromaPort = this.configService.get<number>('CHROMA_PORT', 8000);

    this.chromaClient = new ChromaClient({
      path: `http://${chromaHost}:${chromaPort}`,
    });
  }

  async onModuleInit() {
    await this.initializeCollection();
  }

  private async initializeCollection() {
    this.logger.log('Initializing ChromaDB collection...');

    if (RESET_DB) {
      await this.chromaClient.deleteCollection({
        name: this.COLLECTION_NAME,
      }).catch(() => {});
    }

    this.collection = await this.chromaClient.getOrCreateCollection({
      name: this.COLLECTION_NAME,
    });

    const count = await this.collection.count();
    this.logger.log(`Collection has ${count} documents`);

    if (RESET_DB || count === 0) {
      await this.ingestDocuments();
    }
  }

  private async ingestDocuments() {
    this.logger.log('Parsing PPTX...');
    const chunks = await this.pptxParserService.parsePptx();

    const texts = chunks.map(c => c.text);

    this.logger.log('Generating embeddings...');
    const embeddings = await this.embeddingService.embedBatch(texts);

    const ids = chunks.map((_, i) => `chunk_${i}`);
    const metadatas = chunks.map(c => c.metadata);

    this.logger.log('Saving to ChromaDB...');
    await this.collection.add({
      ids,
      embeddings,
      documents: texts,
      metadatas,
    });

    this.logger.log(`Ingested ${chunks.length} chunks`);
  }

  async retrieve(query: string): Promise<any[]> {
    this.logger.log(`Query: ${query}`);

    const queryEmbedding = await this.embeddingService.embedText(query);

    const results = await this.collection.query({
      queryEmbeddings: [queryEmbedding],
      nResults: this.TOP_K,
      include: ['documents', 'metadatas', 'distances'],
    });

    const documents = results.documents?.[0] || [];
    const metadatas = results.metadatas?.[0] || [];
    const distances = results.distances?.[0] || [];

    const enriched = documents.map((doc: string, i: number) => ({
      text: doc,
      source: metadatas[i]?.source,
      slideNumber: metadatas[i]?.slideNumber,
      score: distances[i],
    }));

    return enriched;
  }
}