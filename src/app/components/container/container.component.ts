import { Component, computed, inject, OnDestroy, OnInit } from '@angular/core';
import { ChatToggleComponent } from '../chat-toggle/chat-toggle.component';
import { ChatService } from '../../services/chat.service';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { ContentComponent } from '../content/content.component';
import { version } from '../../../../package.json';
import { MatCard } from '@angular/material/card';
import { AgentComponent } from '../agent/agent.component';
import { ArefBackgroundComponent } from '../aref-background/aref-background.component';
import { ChatStateService } from '../../services/chat-state.service';
import { LanguageService } from '../../services/language.service';

@Component({
    selector: 'app-container',
    standalone: true,
    imports: [ChatToggleComponent, HeaderComponent, FooterComponent, ContentComponent, MatCard, ArefBackgroundComponent, AgentComponent],
    templateUrl: './container.component.html',
    styleUrl: './container.component.css',
})
export class ContainerComponent implements OnInit, OnDestroy {
    private chatService = inject(ChatService);
    private chatState = inject(ChatStateService);
    private languageService = inject(LanguageService);

    isOpen = computed(() => this.chatService.getIsOpen());
    chatView = this.chatService['chatView']; 
    isMinimizeClicked = false;

    ngOnInit(): void {

        const params = new URLSearchParams(window.location.search);
        const lang = params.get('lang') || 'ar';

        this.chatState.setLanguage(lang);
        document.documentElement.setAttribute('lang', lang);
        this.languageService.setLanguage(lang);
        this.showAppInfo();
    }

    private showAppInfo() {
        console.group('Application Info');
        console.log('version:', version);
        console.groupEnd();
    }

    ngOnDestroy(): void {
        this.chatService.unsubscribeAll();
    }

    getHeight(): string {
    switch (this.chatView()) {
        case 'image':
            return '310px';
        case 'agent':
            return '382px';
        default:
            return '97%';
    }
}

    isMinimizeClickedChange(value: boolean) {
        console.log('value ---> ', value)
    this.isMinimizeClicked = value;
    }

}
