import { useState, useEffect } from 'react';
import { api } from '../lib/api';

export interface PublicSettings {
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_facebook: string;
  social_linkedin: string;
  social_instagram: string;
  social_twitter: string;
  whatsapp_number: string;
}

const defaultSettings: PublicSettings = {
  contact_email: 'macofholding2018@gmail.com',
  contact_phone: '+224 625 74 46 26',
  contact_address: 'Manquepa, en face de Banc Bleu, Kaloum, Conakry, République de Guinée',
  social_facebook: '',
  social_linkedin: '',
  social_instagram: '',
  social_twitter: '',
  whatsapp_number: '',
};

export function useSettings() {
  const [settings, setSettings] = useState<PublicSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await api.get('/api/v1/settings');
        if (res.data.success && res.data.data?.map) {
          const map = res.data.data.map;
          setSettings({
            contact_email: map.contact_email || defaultSettings.contact_email,
            contact_phone: map.contact_phone || defaultSettings.contact_phone,
            contact_address: map.contact_address || defaultSettings.contact_address,
            social_facebook: map.social_facebook || defaultSettings.social_facebook,
            social_linkedin: map.social_linkedin || defaultSettings.social_linkedin,
            social_instagram: map.social_instagram || defaultSettings.social_instagram,
            social_twitter: map.social_twitter || defaultSettings.social_twitter,
            whatsapp_number: map.whatsapp_number || defaultSettings.whatsapp_number,
          });
        }
      } catch (err) {
        console.error('Failed to load settings', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSettings();
  }, []);

  return { settings, loading };
}
