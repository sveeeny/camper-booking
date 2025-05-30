import { createI18n } from 'vue-i18n';
import de from './de.json';
import en from './en.json';

type MessageSchema = typeof de;

// 🌐 Gespeicherte Sprache laden (oder 'de')
const savedLocale = localStorage.getItem('locale') as 'de' | 'en' | null;
const defaultLocale: 'de' | 'en' = savedLocale || 'de';

export const i18n = createI18n<[MessageSchema], 'de' | 'en'>({
  legacy: false,
  locale: defaultLocale,
  fallbackLocale: 'en',
  messages: {
    de,
    en,
  },
});

export default i18n;
