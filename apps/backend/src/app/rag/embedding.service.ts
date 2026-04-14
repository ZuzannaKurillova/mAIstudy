import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class EmbeddingService {
  private readonly OLLAMA_URL = 'http://localhost:11434/api/embed';
  private readonly MODEL = 'bge-m3';

  async embedText(text: string): Promise<number[]> {
    const response = await axios.post(this.OLLAMA_URL, {
      model: this.MODEL,
      input: text,
    });

    return response.data.embeddings[0];
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const response = await axios.post(this.OLLAMA_URL, {
      model: this.MODEL,
      input: texts,
    });

    return response.data.embeddings;
  }
}