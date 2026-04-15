import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface ChatResponse {
  answer: string;
}

@Injectable({
  providedIn: 'root',
})
export class ChatService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/api/chat';

  sendMessage(question: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(this.apiUrl, { question });
  }
}
