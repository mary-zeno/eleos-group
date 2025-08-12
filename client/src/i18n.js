// src/i18n.js
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import en from './locales/en/translation.json';
import am from './locales/am/translation.json';
import fr from './locales/fr/translation.json';
import om from './locales/om/translation.json';
import sw from './locales/sw/translation.json';
import ti from './locales/ti/translation.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    resources: {
      en: { translation: en },
      am: { translation: am },
      fr: { translation: fr },
      om: { translation: om },
      sw: { translation: sw },
      ti: { translation: ti }
    },
    interpolation: {
      escapeValue: false,
    }
  });

export default i18n;
