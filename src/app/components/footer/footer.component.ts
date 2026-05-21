import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatMiniFabButton } from '@angular/material/button';
import { MatIcon } from '@angular/material/icon';
import { MatToolbar } from '@angular/material/toolbar';
import { ChatService } from '../../services/chat.service';
import { WebSocketService } from '../../services/ws.service';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { ChatStateService } from '../../services/chat-state.service';
import { LanguageService } from '../../services/language.service';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [FormsModule, MatIcon, MatToolbar, MatMiniFabButton, CommonModule,],
    templateUrl: './footer.component.html',
    styleUrl: './footer.component.css',
})
export class FooterComponent {
    private chatService = inject(ChatService);
    private wsService = inject(WebSocketService);
    private chatState = inject(ChatStateService);
    public language = inject(LanguageService);

    userInput = this.chatService.userInput;
    chatView = this.chatService.getChatView();
    language$ = this.chatState.language$;
    isMinimizeClicked$ = this.chatState.isMinimizeClicked$;
    
    onClick() {
        if (!this.isSendingBlocked()) {
            this.chatService.sendMessage();
        }
    }

    maximizeAvatar() {
        console.log('chatView --- ', this.chatView)
        this.chatService.setChatView('agent');
    }

    onEnter() {
        if (!this.isSendingBlocked()) {
            this.chatService.sendMessage();
        }
    }

    isPending() {
        return this.chatService.isPending();
    }

    isSendingBlocked() {
        return this.isPending() || (environment.featureFlags.webSocket && this.wsService.status() !== 'online');
    }

   onMaximizeAvatarClick(): void {
      this.chatService.setChatView('content');
   }

    onMaximizeClick() {
    this.chatState.setMinimized(false);
    }
}
