import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { ChatMessage } from '../model/chat-message.model';
import { ChatResponse } from '../model/chat-response.model';

@Injectable({
  providedIn: 'root',
})
export class OllamaService {
  private model = environment.model;
  private chatApiUrl = environment.chatApiUrl;

  private http = inject(HttpClient);

  chat(messages: ChatMessage[]): Observable<string> {
    return this.http
      .post<ChatResponse>(this.chatApiUrl, {
        model: this.model,
        messages,
        stream: false,
      })
      .pipe(map((response) => response.message.content));
  }
}
