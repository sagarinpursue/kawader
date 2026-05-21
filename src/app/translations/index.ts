import { English } from './en';
import { Arabic } from './ar';

export const TranslationMap: Record<string, any> = {
    en: English,
    ar: Arabic
};

// This helps your code editor suggest the right keys
export type TranslationKey = keyof typeof English;