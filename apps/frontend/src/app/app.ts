import { Component } from '@angular/core';
import { ChatComponent } from './chat/chat.component';

@Component({
  imports: [ChatComponent],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  protected title = 'mAItravel';
}
