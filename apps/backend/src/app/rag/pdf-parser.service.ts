import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const { PDFParse } = require('pdf-parse');

export interface TextChunk {
  text: string;
  metadata: {
    source: string;
    chunkIndex: number;
  };
}

@Injectable()
export class PdfParserService {
  private readonly logger = new Logger(PdfParserService.name);
  private readonly CHUNK_SIZE = 500;
  private readonly CHUNK_OVERLAP = 150;

  async parsePdfs(): Promise<TextChunk[]> {
    const workspaceRoot = process.cwd();
    const pdfFiles = [
      'Slovakia_near%20and%20full%20of%20surprises%20%282%29.pdf',
      'brochure_en_slovakia.pdf',
    ];

    const allChunks: TextChunk[] = [];

    for (const pdfFile of pdfFiles) {
      const pdfPath = path.join(workspaceRoot, pdfFile);
      this.logger.log(`Parsing PDF: ${pdfPath}`);

      try {
        const parser = new PDFParse({ url: pdfPath });
        await parser.load();
        const result = await parser.getText();
        const text = result.text;

        const chunks = this.chunkText(text, pdfFile);
        allChunks.push(...chunks);
        this.logger.log(`Extracted ${chunks.length} chunks from ${pdfFile}`);
      } catch (error) {
        this.logger.error(`Error parsing ${pdfFile}:`, error);
        throw error;
      }
    }

    return allChunks;
  }

  private chunkText(text: string, source: string): TextChunk[] {
    const words = text.split(/\s+/);
    const chunks: TextChunk[] = [];
    let chunkIndex = 0;

    for (let i = 0; i < words.length; i += this.CHUNK_SIZE - this.CHUNK_OVERLAP) {
      const chunkWords = words.slice(i, i + this.CHUNK_SIZE);
      const chunkText = chunkWords.join(' ').trim();

      if (chunkText.length > 0) {
        chunks.push({
          text: chunkText,
          metadata: {
            source,
            chunkIndex: chunkIndex++,
          },
        });
      }
    }

    return chunks;
  }
}
