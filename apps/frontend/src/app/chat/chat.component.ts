import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';

interface Message {
  text: string;
  html?: string;
  isUser: boolean;
  isLoading?: boolean;
}

@Component({
  selector: 'app-chat',
  imports: [FormsModule],
  templateUrl: './chat.component.html',
  styleUrls: ['./chat.component.css'],
  standalone: true,
})
export class ChatComponent {
  private chatService = inject(ChatService);
  private cdr = inject(ChangeDetectorRef);

  messages: Message[] = [];
  userInput = '';
  isProcessing = false;

  convertMarkdownToHtml(text: string): string {
    // Convert markdown links [text](url) to HTML <a> tags
    let html = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    // Convert **bold** to <strong>
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    // Convert newlines to <br>
    html = html.replace(/\n/g, '<br>');
    return html;
  }

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
          html: this.convertMarkdownToHtml(response.answer),
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
