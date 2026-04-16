import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import ur from './locales/ur.json';

export type Locale = 'en' | 'ur';
export type LocaleLabel = { code: Locale; label: string };

export const LOCALES: LocaleLabel[] = [
  { code: 'en', label: 'English' },
  { code: 'ur', label: 'اردو' },
];

export const RTL_LOCALES: Locale[] = ['ur'];

const savedLocale = (localStorage.getItem('locale') as Locale) ?? 'en';

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ur: { translation: ur },
  },
  lng: savedLocale,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
});

export default i18n;
