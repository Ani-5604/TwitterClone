import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import language files from the `src/locales` folder
import en from '../public/locales/en.json';
import es from '../public/locales/es.json';
import hi from '../public/locales/hi.json';
import pt from '../public/locales/pt.json';
import zh from '../public/locales/zh.json';
import fr from '../public/locales/fr.json';

i18n
  .use(initReactI18next) // Connects i18next to React
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      hi: { translation: hi },
      pt: { translation: pt },
      zh: { translation: zh },
      fr: { translation: fr },
    },
    lng: 'en', // Default language
    fallbackLng: 'en', // Fallback language if the selected one is unavailable
    interpolation: {
      escapeValue: false, // React handles escaping by default
    },
  });

export default i18n;
