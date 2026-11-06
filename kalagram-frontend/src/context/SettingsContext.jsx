import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { publicApi } from '../services/api.js';

// Used until the API answers, and if it can't: phone and WhatsApp must keep working either way.
const FALLBACK = {
  phone: '+91 9011059088',
  whatsapp: '919011059088',
  email: 'hello@kalagram.org',
  address: 'Kalagram, Pune, Maharashtra',
  mapsQuery: 'Pune, Maharashtra',
  facebookUrl: '',
  instagramUrl: '',
  youtubeUrl: '',
  heroTitle: 'Mud House Building Workshops',
  heroSubtitle: 'Learn the traditional art of building healthy, beautiful and sustainable homes with earth.',
  aboutPreview:
    "Kalagram is a learning platform dedicated to reviving India's natural building traditions. Through hands-on workshops, we share the knowledge of mud house construction, local materials and sustainable living.",
  ctaTitle: 'Build with Earth. Learn from Tradition.',
  ctaText: 'Join our hands-on workshops and discover the beauty of natural construction.',
  stat1Value: '20+',
  stat1Label: 'Mud House Projects',
  stat2Value: '50+',
  stat2Label: 'Workshop Batches',
  stat3Value: '500+',
  stat3Label: 'Learners & Visitors',
  stat4Value: '100%',
  stat4Label: 'Natural & Local Materials',
};

const SettingsContext = createContext(FALLBACK);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(FALLBACK);

  useEffect(() => {
    let active = true;
    publicApi.settings().then((data) => active && setSettings({ ...FALLBACK, ...data })).catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo(() => ({ ...settings, updateLocal: (next) => setSettings((s) => ({ ...s, ...next })) }), [settings]);
  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export const useSettings = () => useContext(SettingsContext);
