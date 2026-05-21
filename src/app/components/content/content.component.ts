import { AfterViewInit, Component, computed, ElementRef, EventEmitter, inject, Input, Output } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ChatService } from '../../services/chat.service';
import { MessageComponent } from '../message/message.component';
import { WebSocketService } from '../../services/ws.service';
import { environment } from '../../../environments/environment';
import { MatCard, MatCardContent } from '@angular/material/card';
import { AgentComponent } from '../agent/agent.component';
import { ChatStateService } from '../../services/chat-state.service';
import { CommonModule } from '@angular/common';
import { LanguageService } from '../../services/language.service';

@Component({
    selector: 'app-content',
    standalone: true,
    imports: [MessageComponent, AgentComponent, MatProgressSpinnerModule, MatCard, MatCardContent, CommonModule],
    templateUrl: './content.component.html',
    styleUrl: './content.component.css',
})
export class ContentComponent implements AfterViewInit {
    private chatService = inject(ChatService);
    private wsService = inject(WebSocketService);
    private chatState = inject(ChatStateService);
    chatView = this.chatService['chatView']; 
    public language = inject(LanguageService);

    chatMessages = computed(() => this.chatService.getChatMessages());
    chatContainer = inject(ElementRef<HTMLElement>);
    isMinimizeClicked$ = this.chatState.isMinimizeClicked$;
    userInput = this.chatService.userInput;
    readonly sessionLoading = this.chatService.sessionLoading;
    readonly questions = this.chatService.questions;

    ngAfterViewInit(): void {
        this.chatService.setContainerRef(this.chatContainer);
        this.chatService.scrollToBottom();
    }

    onQuestionClick(question: string) {
        this.userInput.set(question);
        this.chatService.sendMessage();
    }

    isSendingBlocked() {
        return (
            this.sessionLoading() ||
            (environment.featureFlags.webSocket &&
                this.wsService.status() !== 'online' &&
                this.wsService.status() !== 'offline')
        );
    }

    greetingMessage = computed(() => ({
        id: 'greeting',
        text: this.language.words().welcome_message,
        sender: 'bot',
        status: 'received',
        time: new Date(),
    }));       
}
