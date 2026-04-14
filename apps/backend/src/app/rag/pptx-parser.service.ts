import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface TextChunk {
  text: string;
  metadata: {
    source: string;
    chunkIndex: number;
    slideNumber: number;
  };
}

@Injectable()
export class PptxParserService {
  private readonly logger = new Logger(PptxParserService.name);

  async parsePptx(): Promise<TextChunk[]> {
    const workspaceRoot = process.cwd();
    const pptxFiles = ['VAII/1.pptx'];

    const allChunks: TextChunk[] = [];

    for (const pptxFile of pptxFiles) {
      const pptxPath = path.join(workspaceRoot, pptxFile);
      this.logger.log(`Parsing PPTX: ${pptxPath}`);

      const slides = await this.extractSlides(pptxPath);
      const chunks = this.createChunksFromSlides(slides, pptxFile);

      allChunks.push(...chunks);
      this.logger.log(`Extracted ${chunks.length} slide chunks from ${pptxFile}`);
    }

    return allChunks;
  }

  private async extractSlides(pptxPath: string): Promise<{ text: string; slideNumber: number }[]> {
    const tempDir = path.join('/tmp', `pptx_${Date.now()}`);

    try {
      await execAsync(`mkdir -p "${tempDir}"`);
      await execAsync(`unzip -q "${pptxPath}" -d "${tempDir}"`);

      const slidesDir = path.join(tempDir, 'ppt', 'slides');

      if (!fs.existsSync(slidesDir)) {
        this.logger.warn('No slides directory found');
        return [];
      }

      const slideFiles = fs.readdirSync(slidesDir)
        .filter(file => file.startsWith('slide') && file.endsWith('.xml'))
        .sort();

      const slides = [];

      for (let i = 0; i < slideFiles.length; i++) {
        const slideFile = slideFiles[i];
        const slidePath = path.join(slidesDir, slideFile);
        const xmlContent = fs.readFileSync(slidePath, 'utf-8');

        // Extract the actual slide number from the filename (e.g., slide10.xml -> 10)
        const slideNumberMatch = slideFile.match(/slide(\d+)\.xml/);
        const actualSlideNumber = slideNumberMatch ? parseInt(slideNumberMatch[1], 10) : i + 1;

        const textMatches = xmlContent.match(/<a:t>([^<]+)<\/a:t>/g) || [];

        const texts = textMatches.map(match =>
          match.replace(/<\/?a:t>/g, '').trim()
        ).filter(Boolean);

        if (texts.length > 0) {
          const slideText = texts.join('\n• ');

          slides.push({
            text: slideText,
            slideNumber: actualSlideNumber,
          });
        }
      }

      await execAsync(`rm -rf "${tempDir}"`);

      return slides;
    } catch (error) {
      await execAsync(`rm -rf "${tempDir}"`).catch(() => { /* empty */ });
      throw error;
    }
  }

  private createChunksFromSlides(
    slides: { text: string; slideNumber: number }[],
    source: string
  ): TextChunk[] {
    return slides.map((slide, idx) => ({
      text: `Slide ${slide.slideNumber}:\n${slide.text}`,
      metadata: {
        source,
        chunkIndex: idx,
        slideNumber: slide.slideNumber,
      },
    }));
  }
}