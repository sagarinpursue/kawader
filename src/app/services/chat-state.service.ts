import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class ChatStateService {

  // holds minimize/maximize state
  private isMinimizeClickedSubject = new BehaviorSubject<boolean>(false);
  
  private languageSubject = new BehaviorSubject<string>('ar'); // default Arabic
  language$ = this.languageSubject.asObservable();

  // observable for listening
  isMinimizeClicked$ = this.isMinimizeClickedSubject.asObservable();

  // setter method (cleaner than calling next everywhere)
  setMinimized(value: boolean) {
    this.isMinimizeClickedSubject.next(value);
  }

  setLanguage(lang: string) {
    this.languageSubject.next(lang);
  }

  getLanguageValue(): string {
    return this.languageSubject.value;
  }

}