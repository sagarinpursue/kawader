import { Injectable, signal, computed } from '@angular/core';
import { TranslationMap, TranslationKey } from '../translations';

@Injectable({
  providedIn: 'root'
})
export class LanguageService {
  private currentLanguageCode = signal<string>('ar');

  // Returns the active dictionary (English or Arabic object)
  // We use "labels" or "strings" as a clear name
  words = computed(() => TranslationMap[this.currentLanguageCode()]);

  setLanguage(code: string) {
    if (TranslationMap[code]) {
      this.currentLanguageCode.set(code);
    }
  }

  getLanguage(): string {
    return this.currentLanguageCode();
  }

  // A helper to get a single word
  getWord(key: TranslationKey): string {
    return this.words()[key] || key;
  }
}