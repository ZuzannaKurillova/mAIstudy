import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { RagService } from '../rag/rag.service';

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private readonly ollamaUrl: string;
  private readonly modelName: string;

  constructor(
    private configService: ConfigService,
    private ragService: RagService
  ) {
    this.ollamaUrl = this.configService.get<string>(
      'OLLAMA_URL',
      'http://localhost:11434'
    );
    this.modelName = this.configService.get<string>(
      'OLLAMA_MODEL',
      'llama3.2'
    );
  }

  async chat(question: string): Promise<string> {
    try {
      this.logger.log(`Processing question: ${question}`);

      // 1. Retrieve relevant chunks
      const retrievedChunks = await this.ragService.retrieve(question);

      this.logger.log(`Retrieved ${retrievedChunks.length} chunks`);

      if (retrievedChunks.length > 0) {
        this.logger.log('All retrieved chunks:');
        retrievedChunks.forEach((chunk, idx) => {
          this.logger.log(
            `  [${idx}] Slide ${chunk.slideNumber}, score: ${chunk.score}, preview: ${chunk.text.substring(0, 80)}...`
          );
        });
        this.logger.log(
          `Using first chunk - source: ${retrievedChunks[0].source}, slide: ${retrievedChunks[0].slideNumber}`
        );
      }

      // 2. Build CONTEXT with source attribution
      const context = retrievedChunks
        .map(c =>
          `📄 ${c.source} — Slide ${c.slideNumber}\n${c.text}`
        )
        .join('\n\n');

      // 3. STRICT extractive prompt
      const prompt = `Si extrakčný systém pre študentov.

Tvoja úloha:
IMPORTANT: NEVYTVÁRAJ nové vety. Použi výhradne text z kontextu v presne takom znení, v akom je uvedený v prednáške. Doslova copy-paste.

Ak odpoveď nie je v kontexte, odpíš:
"Na základe prednášok neviem odpovedať."

--- KONTEXT ---
${context}
----------------

Otázka:
${question}

Odpoveď:
      `.trim();

      // 4. Call Ollama
      this.logger.log('Generating response with Ollama...');

      const response = await fetch(
        `${this.ollamaUrl}/api/generate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: this.modelName,
            prompt,
            stream: false,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Ollama API error: ${response.statusText}`);
      }

      const data = await response.json();
      let answer = data.response.trim();

      this.logger.log('Response generated successfully');
      this.logger.log(`LLM Response: ${answer}`);

      // 5. Prepend slide titles and append sources
      if (retrievedChunks.length > 0 && !answer.includes('neviem odpovedať')) {
        // Get unique slide titles from retrieved chunks
        const slideTitles = [...new Set(retrievedChunks.map(chunk => chunk.slideTitle).filter(Boolean))];
        
        // Prepend the first slide title to the answer
        if (slideTitles.length > 0) {
          answer = `${slideTitles[0]}\n${answer}`;
        }
        // Group chunks by source file
        const groupedBySource: Record<string, number[]> = retrievedChunks.reduce((acc, chunk) => {
          if (!acc[chunk.source]) {
            acc[chunk.source] = [];
          }
          acc[chunk.source].push(chunk.slideNumber);
          return acc;
        }, {} as Record<string, number[]>);

        answer += '\n\n---\n**Zdroje:**\n';
        
        Object.entries(groupedBySource).forEach(([source, slideNumbers]) => {
          // Extract just the filename from the source path (e.g., "VAII/1.pptx" -> "1.pptx")
          const fileName = source.split('/').pop();
          const fileUrl = `http://localhost:3000/files/${fileName}`;
          
          // Sort and format slide numbers
          const sortedSlides = [...new Set(slideNumbers)].sort((a: number, b: number) => a - b);
          const slideList = sortedSlides.join(', ');
          
          answer += `\n[${source}](${fileUrl}) - s. ${slideList}`;
        });
      }

      return answer;
    } catch (error) {
      this.logger.error('Error in chat service:', error);
      throw error;
    }
  }
}