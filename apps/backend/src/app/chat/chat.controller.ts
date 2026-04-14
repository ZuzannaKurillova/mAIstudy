import { Controller, Post, Body, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';

export class ChatDto {
  question: string;
}

export class ChatResponseDto {
  answer: string;
}

@Controller('chat')
export class ChatController {
  private readonly logger = new Logger(ChatController.name);

  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() chatDto: ChatDto): Promise<ChatResponseDto> {
    this.logger.log(`Received chat request: ${chatDto.question}`);
    const answer = await this.chatService.chat(chatDto.question);
    return { answer };
  }
}
