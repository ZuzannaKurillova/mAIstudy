import { Component, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';

interface Message {
  text: string;
  isUser: boolean;
  isLoading?: boolean;
}

@Component({
  selector: 'app-chat',
  imports: [CommonModule, FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
})
export class ChatComponent {
  messages: Message[] = [];
  userInput = '';
  isProcessing = false;

  constructor(
    private chatService: ChatService,
    private cdr: ChangeDetectorRef
  ) {}

  sendMessage(): void {
    if (!this.userInput.trim() || this.isProcessing) {
      return;
    }

    const userMessage = this.userInput.trim();
    this.messages.push({ text: userMessage, isUser: true });
    this.userInput = '';
    this.isProcessing = true;

    this.messages.push({ text: '', isUser: false, isLoading: true });

    this.chatService.sendMessage(userMessage).subscribe({
      next: (response) => {
        console.log('Received response:', response);
        this.messages[this.messages.length - 1] = {
          text: response.answer,
          isUser: false,
          isLoading: false,
        };
        this.isProcessing = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
      error: (error) => {
        console.error('Error sending message:', error);
        this.messages[this.messages.length - 1] = {
          text: 'Error: Unable to get response. Please try again.',
          isUser: false,
          isLoading: false,
        };
        this.isProcessing = false;
        this.cdr.detectChanges();
        this.scrollToBottom();
      },
    });

    this.scrollToBottom();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      this.sendMessage();
    }
  }

  private scrollToBottom(): void {
    setTimeout(() => {
      const messageArea = document.querySelector('.message-area');
      if (messageArea) {
        messageArea.scrollTop = messageArea.scrollHeight;
      }
    }, 100);
  }
}
