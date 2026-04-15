import { Component, ChangeDetectorRef, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ChatService } from './chat.service';
import { SlideComponent } from './slide/slide.component';

interface Message {
  text: string;
  html?: string;
  title?: string;
  content?: string;
  sources?: string;
  isUser: boolean;
  isLoading?: boolean;
}

@Component({
  selector: 'app-chat',
  imports: [FormsModule, SlideComponent],
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

  processResponse(text: string): { title: string; content: string; sources: string } {
    // Split content and sources
    const parts = text.split('---');
    const mainContent = parts[0].trim();
    const sources = parts.length > 1 ? parts[1].trim() : '';
    
    // Extract first line as title
    const contentLines = mainContent.split('\n');
    const title = contentLines[0].trim();
    const restOfContent = contentLines.slice(1).join('\n').trim();
    
    // Convert markdown in remaining content
    let contentHtml = restOfContent.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
    contentHtml = contentHtml.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Convert bullet points to proper list items
    const lines = contentHtml.split('\n');
    let formattedContent = '';
    let inList = false;
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('•') || trimmed.startsWith('-')) {
        if (!inList) {
          formattedContent += '<ul>';
          inList = true;
        }
        formattedContent += `<li>${trimmed.substring(1).trim()}</li>`;
      } else if (trimmed) {
        if (inList) {
          formattedContent += '</ul>';
          inList = false;
        }
        formattedContent += `<p>${trimmed}</p>`;
      }
    }
    if (inList) formattedContent += '</ul>';
    
    // Convert sources section
    let sourcesHtml = '';
    if (sources) {
      sourcesHtml = sources.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>');
      sourcesHtml = sourcesHtml.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      sourcesHtml = sourcesHtml.replace(/\n/g, '<br>');
    }
    
    return { title, content: formattedContent, sources: sourcesHtml };
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
        const processed = this.processResponse(response.answer);
        this.messages[this.messages.length - 1] = {
          text: response.answer,
          title: processed.title,
          content: processed.content,
          sources: processed.sources,
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
