import { createI18n } from 'vue-i18n';
import deBase from './de.json';
import enBase from './en.json';
import deCountries from './countries.de.json';
import enCountries from './countries.en.json';

const de = {
  ...deBase,
  countries: deCountries,
};

const en = {
  ...enBase,
  countries: enCountries,
};

type MessageSchema = typeof de;

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
