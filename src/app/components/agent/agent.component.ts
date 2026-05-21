import { Component, AfterViewChecked, Input, OnInit, Output, inject, signal } from '@angular/core';
import { NgZone } from '@angular/core';
import { environment } from '../../../environments/environment';
import { CommonModule } from '@angular/common';
import { ChatStateService } from '../../services/chat-state.service';
import { LanguageService } from '../../services/language.service';

@Component({
  selector: 'app-agent',
  imports: [CommonModule,],
  templateUrl: './agent.component.html',
  styleUrl: './agent.component.css'
})
export class AgentComponent implements OnInit, AfterViewChecked {
  private isAgentListenerAdded = false;
  isChatbotContainerHidden = false;
  isMinimized$ = this.chatState.isMinimizeClicked$;
  agentLoadStatus = signal<'loading' | 'success' | 'error'>('loading');
  initialClick = false;

  public language = inject(LanguageService); 
  constructor(
      private ngZone: NgZone,
      private chatState: ChatStateService,
  ) {
  }
    ngOnInit(): void {

        // listen for maximize from footer
        this.chatState.isMinimizeClicked$.subscribe(value => {
          if (!value) {
            this.isChatbotContainerHidden = false;
          }
        });

        this.loadDidAgent();
        }

    loadDidAgent() {
  const container = document.getElementById('did-agent-container');
  if (container) container.innerHTML = '';

    const scriptId = 'did-agent-script';
    const existingScript = document.getElementById(scriptId);

  // If script already exists, just re-initialize the agent logic if needed
    if (existingScript) {
    console.log('Script already exists, agent should be preserved in DOM');
    return;
  }

  this.isAgentListenerAdded = false;
  let script = document.getElementById(scriptId) as HTMLScriptElement;

  script = document.createElement('script');
  script.id = 'did-agent-script';
  script.type = 'module';
  script.src = `https://agent.d-id.com/v2/index.js?t=${Date.now()}`; 
  
  script.setAttribute('data-mode', 'full');
  script.setAttribute('data-client-key', environment.DIDClientKeys);
  script.setAttribute('data-agent-id', this.language.getLanguage() === 'ar' ? environment.arabicAgent : environment.englishAgent);
  script.setAttribute('data-idle-timeout', '300');
  script.setAttribute('data-name', 'did-agent');
  script.setAttribute('data-monitor', 'true');
  script.setAttribute('data-target-id', 'did-agent-container'); 

  const style = document.createElement('style');
  style.innerHTML = `
    #did-agent-container, .didagent__embedded__container { min-height: 231px !important; height: 100% !important; }
    .didagent__main__wrapper { height: 450px !important; }
    /* Ensure the button text has enough room for Arabic */
    #did-agent-container button { min-width: 150px !important; } 
  `;
  document.head.appendChild(style);

  script.onload = () => {
    this.agentLoadStatus.set('success');
    console.log('✅ D-ID Script Loaded');
    this.attachAgentClickListener();
  };

    script.onerror = () => {
    this.agentLoadStatus.set('error');
    console.error('❌ D-ID Script failed to load');
  };

  // Set a timeout: if it's still "loading" after 10 seconds, show error
  setTimeout(() => {
    if (this.agentLoadStatus() === 'loading') {
      this.agentLoadStatus.set('error');
    }
  }, 10000);

  document.body.appendChild(script);
}

private attachAgentClickListener(): void {
  const container = document.getElementById('did-agent-container');
  if (container && !this.isAgentListenerAdded) {
    this.isAgentListenerAdded = true;
    container.addEventListener('click', (event: Event) => {
      const path = event.composedPath();
      const isChatClick = path.some((el) => {
        const element = el as HTMLElement;
        if (!element?.tagName) return false;
        const tag = element.tagName.toUpperCase();
        const className = typeof element.className === 'string' ? element.className.toLowerCase() : '';
        const id = typeof element.id === 'string' ? element.id.toLowerCase() : '';
        if (tag === 'INPUT' || tag === 'TEXTAREA') return true;
        if (element.isContentEditable) return true;
        if (className.includes('input') || className.includes('chat') || className.includes('textarea') || className.includes('message')) return true;
        if (id.includes('input') || id.includes('chat')) return true;
        return false;
      });
      this.ngZone.run(() => {
        setTimeout(() => {
          if (isChatClick) this.handleAgentChatClick();
        }, 0);
      });
    }, true);
  }
}

handleAgentChatClick() {  
  console.log('UI is being modified because the user interacted with the D-ID chat!');
    this.isChatbotContainerHidden = false; 
}

onMinimizeAvatarClick(): void {
  this.isChatbotContainerHidden = true;

  this.chatState.setMinimized(true);
}

private tryChangeButtonText(): boolean {
  const container = document.getElementById('did-agent-container');
  if (!container) return false;

  let foundAndChanged = false;

  // Use EXACT matches only — no .includes() to avoid breaking internal D-ID logic
  const textReplacements: Record<string, string> = {
    'start conversation': 'ابدأ المحادثة',
    'loading...': 'جاري التحميل...',
    'connecting...': 'جاري الاتصال...',
    'continue conversation...': 'متابعة المحادثة...',
    'starting...': 'جاري البدء...',
    'start chat': 'ابدأ المحادثة',
    'listening': 'جاري الاستماع...',
    'thinking': 'جاري التفكير...',
    'processing': 'جاري المعالجة...',
    'speaking': 'جاري الكلام...',
    'connecting': 'جاري الاتصال...',
    'connected': 'متصل',
    'chat': 'الدردشة',
    'end conversation': 'إنهاء المحادثة',
    'mute': 'كتم الصوت',
    'unmute': 'إلغاء كتم الصوت',
    'please wait until the response is complete': 'يرجى انتظار الرد...',
    'are you still here?': 'هل أنت ما زلت هنا؟',
    'reconnect': 'إعادة الاتصال',
    'chat history': 'سجل الدردشة',
    "the agent is temporarily unavailable. please try again later.": "الوكيل غير متاح مؤقتًا. يرجى المحاولة مرة أخرى لاحقًا.",
  };
  const allElements = [container, ...Array.from(container.querySelectorAll('*'))];

  for (const el of allElements) {
    const htmlEl = el as HTMLElement;

    if (htmlEl.shadowRoot) {
      const shadowElements = htmlEl.shadowRoot.querySelectorAll('*');

      shadowElements.forEach(item => {
        item.childNodes.forEach(node => {
          if (node.nodeType === 3) {
            const text = node.textContent?.trim().toLowerCase() || '';
            // ✅ EXACT match only — never use .includes() on D-ID nodes
            if (textReplacements[text]) {
              node.textContent = textReplacements[text];

              if (node.parentElement) {
                node.parentElement.style.direction = 'rtl';
                node.parentElement.style.fontFamily = 'inherit';
              }

              foundAndChanged = true;
            }
          }
        });
      });
    }
  }

  return foundAndChanged;
}

public ngAfterViewChecked(): void {
  const botBody = document.getElementById('content');

  if (!botBody) return;

  if(this.chatState.getLanguageValue() === 'ar')
    this.tryChangeButtonText();
}

}
