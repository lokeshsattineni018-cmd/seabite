import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "nav": {
        "home": "Home",
        "products": "Products",
        "about": "About",
        "contact": "Contact",
        "search": "Search for fresh catch...",
        "account": "Account"
      },
      "hero": {
        "title": "Freshness Delivered to Your Door",
        "subtitle": "Premium seafood sourced directly from the docks of Andhra Pradesh.",
        "cta": "Shop Now",
        "slide1": {
          "tag": "Fresh Catch Daily",
          "title": ["Ocean-Fresh", "Seafood", "Delivered."],
          "desc": "Premium fish, prawns & crabs — sourced daily from the coast, cold-chain delivered straight to your kitchen.",
          "cta": "Shop Now"
        },
        "slide2": {
          "tag": "Seasonal Special",
          "title": ["Jumbo", "Tiger Prawns", "Wild Caught."],
          "desc": "Extra large, succulent prawns harvested from the pristine waters of the Bay of Bengal.",
          "cta": "Grab Special Offer"
        },
        "slide3": {
          "tag": "Limited Stock",
          "title": ["Mud Crabs", "Live &", "Meaty."],
          "desc": "Fresh live mud crabs delivered in specialized packaging to ensure they reach you in peak condition.",
          "cta": "View Crabs"
        }
      }
    }
  },
  te: {
    translation: {
      "nav": {
        "home": "హోమ్",
        "products": "ఉత్పత్తులు",
        "about": "మా గురించి",
        "contact": "సంప్రదించండి",
        "search": "తాజా చేపల కోసం వెతకండి...",
        "account": "ఖాతా"
      },
      "hero": {
        "title": "తాజా చేపలు మీ ఇంటి వద్దకే",
        "subtitle": "ఆంధ్రప్రదేశ్ రేవుల నుండి నేరుగా సేకరించిన నాణ్యమైన సముద్ర ఆహారం.",
        "cta": "ఇప్పుడే కొనండి",
        "slide1": {
          "tag": "ప్రతిరోజూ తాజా వేట",
          "title": ["సముద్రపు తాజా", "సముద్ర ఆహారం", "మీ ఇంటికే."],
          "desc": "నాణ్యమైన చేపలు, రొయ్యలు & పీతలు — ప్రతిరోజూ సముద్ర తీరం నుండి సేకరించబడతాయి.",
          "cta": "ఇప్పుడే కొనండి"
        },
        "slide2": {
          "tag": "సీజనల్ స్పెషల్",
          "title": ["జంబో", "టైగర్ రొయ్యలు", "సహజ సిద్ధమైనవి."],
          "desc": "బంగాళాఖాతం యొక్క స్వచ్ఛమైన నీటి నుండి సేకరించిన భారీ, రుచికరమైన రొయ్యలు.",
          "cta": "ప్రత్యేక ఆఫర్ పొందండి"
        },
        "slide3": {
          "tag": "పరిమిత స్టాక్",
          "title": ["ముద్ర పీతలు", "లైవ్ &", "మాంసలమైనవి."],
          "desc": "తాజా సజీవ ముద్ర పీతలు మీ వద్దకు అత్యంత నాణ్యంగా చేర్చబడతాయి.",
          "cta": "పీతలను చూడండి"
        }
      }
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: localStorage.getItem("language") || "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
