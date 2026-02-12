import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      // Common
      "loading": "Loading...",
      "save": "Save",
      "cancel": "Cancel",
      "submit": "Submit",
      "edit": "Edit",
      "delete": "Delete",
      "view": "View",
      
      // ESG specific
      "environmental": "Environmental",
      "social": "Social", 
      "governance": "Governance",
      "emissions": "Emissions",
      "energy": "Energy",
      "water": "Water",
      "waste": "Waste",
      "employees": "Employees",
      "safety": "Safety",
      "diversity": "Diversity",
      "board": "Board",
      "ethics": "Ethics",
      "compliance": "Compliance"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en',
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;