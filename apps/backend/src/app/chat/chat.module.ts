import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { RagService } from '../rag/rag.service';
import { EmbeddingService } from '../rag/embedding.service';
import { PptxParserService } from '../rag/pptx-parser.service';

@Module({
  controllers: [ChatController],
  providers: [ChatService, RagService, EmbeddingService, PptxParserService],
})
export class ChatModule {}
