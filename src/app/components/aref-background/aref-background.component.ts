import { Component, inject } from '@angular/core';
import { ChatService } from '../../services/chat.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-aref-background',
  imports: [],
  templateUrl: './aref-background.component.html',
  styleUrl: './aref-background.component.css'
})
export class ArefBackgroundComponent {

      private chatService = inject(ChatService);
      public language = inject(LanguageService); 

    talkToAref() {
      this.chatService.setChatView('agent');
    }
}
