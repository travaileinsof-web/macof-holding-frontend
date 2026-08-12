import React, { useState, useEffect, useRef } from 'react';
import {
  Save,
  RefreshCw,
  Mail,
  Phone,
  Send,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  MapPin,
  Share2,
  Globe
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';

interface SettingsData {
  smtp_host: string;
  smtp_port: number;
  smtp_email: string;
  smtp_password: string;
  whatsapp_number: string;
  contact_email: string;
  contact_phone: string;
  contact_address: string;
  social_facebook: string;
  social_linkedin: string;
  social_instagram: string;
  social_twitter: string;
}

const maskedPassword = '\u2022\u2022\u2022\u2022\u2022\u2022\u2022\u2022';

export default function Settings() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingTest, setSendingTest] = useState<'email' | 'whatsapp' | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const [form, setForm] = useState<SettingsData>({
    smtp_host: '',
    smtp_port: 587,
    smtp_email: '',
    smtp_password: '',
    whatsapp_number: '',
    contact_email: '',
    contact_phone: '',
    contact_address: '',
    social_facebook: '',
    social_linkedin: '',
    social_instagram: '',
    social_twitter: '',
  });

  const originalPasswordRef = useRef('');

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchSettings = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get('/api/v1/admin/settings');
      if (res.data.success && res.data.data) {
        const map = res.data.data.map || {};
        const originalPwd = map.smtp_password || '';
        originalPasswordRef.current = originalPwd;
        setForm({
          smtp_host: map.smtp_host || '',
          smtp_port: parseInt(map.smtp_port, 10) || 587,
          smtp_email: map.smtp_email || '',
          smtp_password: originalPwd ? maskedPassword : '',
          whatsapp_number: map.whatsapp_number || '',
          contact_email: map.contact_email || '',
          contact_phone: map.contact_phone || '',
          contact_address: map.contact_address || '',
          social_facebook: map.social_facebook || '',
          social_linkedin: map.social_linkedin || '',
          social_instagram: map.social_instagram || '',
          social_twitter: map.social_twitter || '',
        });
        setPasswordChanged(false);
      }
    } catch (err) {
      console.error('Erreur fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const updateForm = (key: keyof SettingsData, value: string | number) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (key === 'smtp_password') {
      setPasswordChanged(true);
    }
  };

  const getPasswordValue = (): string => {
    if (!passwordChanged) return '';
    if (form.smtp_password === maskedPassword) return '';
    return form.smtp_password;
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const settings: Record<string, string> = {
        smtp_host: form.smtp_host,
        smtp_port: String(form.smtp_port),
        smtp_email: form.smtp_email,
        whatsapp_number: form.whatsapp_number,
        contact_email: form.contact_email,
        contact_phone: form.contact_phone,
        contact_address: form.contact_address,
        social_facebook: form.social_facebook,
        social_linkedin: form.social_linkedin,
        social_instagram: form.social_instagram,
        social_twitter: form.social_twitter,
      };
      
      const pwd = getPasswordValue();
      if (pwd) {
        settings.smtp_password = pwd;
      }

      await api.post('/api/v1/admin/settings/bulk', { settings });
      setNotification({ type: 'success', message: 'Parametres sauvegardes avec succes.' });
      fetchSettings(true); // silent refresh — no loading spinner
    } catch (err) {
      console.error('Erreur sauvegarde:', err);
      setNotification({ type: 'error', message: 'Erreur lors de la sauvegarde.' });
    } finally {
      setSaving(false);
    }
  };

  const handleTestEmail = async () => {
    setSendingTest('email');
    try {
      await api.post('/api/v1/admin/settings/test-email');
      setNotification({ type: 'success', message: 'Email de test envoye avec succes.' });
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Erreur lors de l\'envoi de l\'email de test.';
      setNotification({ type: 'error', message: msg });
    } finally {
      setSendingTest(null);
    }
  };

  const handleTestWhatsApp = () => {
    setSendingTest('whatsapp');
    const number = (form.whatsapp_number || '').replace(/\s/g, '');
    const message = encodeURIComponent('Test depuis le panel d\'administration MACOF.');
    const url = `https://wa.me/${number}?text=${message}`;
    window.open(url, '_blank');
    setSendingTest(null);
  };


  return (
    <AdminPage loading={loading} className="max-w-4xl space-y-6">
      {/* Notification */}
      {notification && (
        <div
          className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm ${
            notification.type === 'success'
              ? 'bg-green-500/10 border-green-500/30 text-green-400'
              : 'bg-red-500/10 border-red-500/30 text-red-400'
          }`}
        >
          {notification.type === 'success' ? (
            <CheckCircle className="h-4 w-4 flex-shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
          )}
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Parametres generaux</h2>
          <p className="text-slate-400 text-sm mt-1">Configuration des contacts, SMTP, et reseaux sociaux.</p>
        </div>
        
        {/* Save Button */}
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            handleSave();
          }}
          disabled={saving}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-2.5 rounded-lg text-sm font-medium transition-colors"
        >
          <span className="relative flex items-center justify-center h-4 w-4">
            <Save className={`h-4 w-4 absolute transition-opacity ${saving ? 'opacity-0' : 'opacity-100'}`} />
            <RefreshCw className={`h-4 w-4 absolute animate-spin transition-opacity ${saving ? 'opacity-100' : 'opacity-0'}`} />
          </span>
          {saving ? 'Sauvegarde...' : 'Sauvegarder'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Colonne 1: Infos publiques */}
        <div className="space-y-6">
          {/* Contacts Publics */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Contacts Publics</h3>
              </div>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email public</label>
                <input
                  type="email"
                  value={form.contact_email}
                  onChange={(e) => updateForm('contact_email', e.target.value)}
                  placeholder="info@macof-holding.com"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Telephone public</label>
                <input
                  type="text"
                  value={form.contact_phone}
                  onChange={(e) => updateForm('contact_phone', e.target.value)}
                  placeholder="+224 620 00 00 00"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Adresse complete</label>
                <textarea
                  rows={2}
                  value={form.contact_address}
                  onChange={(e) => updateForm('contact_address', e.target.value)}
                  placeholder="Kipe, Commune de Ratoma, Conakry, Guinee"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Numero WhatsApp (Bouton flottant)</label>
                <input
                  type="text"
                  value={form.whatsapp_number}
                  onChange={(e) => updateForm('whatsapp_number', e.target.value)}
                  placeholder="+224XXXXXXXX"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Reseaux Sociaux */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Reseaux Sociaux</h3>
              </div>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1">
                  <Globe className="h-4 w-4" /> LinkedIn
                </label>
                <input
                  type="url"
                  value={form.social_linkedin}
                  onChange={(e) => updateForm('social_linkedin', e.target.value)}
                  placeholder="https://linkedin.com/company/macof"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1">
                  <Globe className="h-4 w-4" /> Facebook
                </label>
                <input
                  type="url"
                  value={form.social_facebook}
                  onChange={(e) => updateForm('social_facebook', e.target.value)}
                  placeholder="https://facebook.com/macof"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1">
                  <Globe className="h-4 w-4" /> Instagram
                </label>
                <input
                  type="url"
                  value={form.social_instagram}
                  onChange={(e) => updateForm('social_instagram', e.target.value)}
                  placeholder="https://instagram.com/macof"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm font-medium text-slate-300 mb-1">
                  <Globe className="h-4 w-4" /> Twitter (X)
                </label>
                <input
                  type="url"
                  value={form.social_twitter}
                  onChange={(e) => updateForm('social_twitter', e.target.value)}
                  placeholder="https://twitter.com/macof"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Colonne 2: Infos techniques */}
        <div className="space-y-6">
          {/* SMTP Configuration */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Configuration SMTP (Envoi d'emails)</h3>
              </div>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Hote SMTP</label>
                <input
                  type="text"
                  value={form.smtp_host}
                  onChange={(e) => updateForm('smtp_host', e.target.value)}
                  placeholder="smtp.example.com"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Port SMTP</label>
                <input
                  type="number"
                  value={form.smtp_port}
                  onChange={(e) => updateForm('smtp_port', parseInt(e.target.value, 10) || 587)}
                  min={1}
                  max={65535}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Email expediteur (Identifiant)</label>
                <input
                  type="email"
                  value={form.smtp_email}
                  onChange={(e) => updateForm('smtp_email', e.target.value)}
                  placeholder="no-reply@macof-holding.com"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Mot de passe SMTP</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={form.smtp_password}
                    onChange={(e) => updateForm('smtp_password', e.target.value)}
                    placeholder="Laisser vide pour ne pas modifier"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 pr-10 text-sm text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {!passwordChanged && form.smtp_password && (
                  <p className="text-xs text-slate-500 mt-1">
                    Mot de passe masque. Modifiez le champ pour le mettre a jour.
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Test Section */}
          <div className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden">
            <div className="px-5 py-3 bg-slate-800/50 border-b border-slate-700">
              <div className="flex items-center gap-2">
                <Send className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-semibold text-slate-200">Tests systeme</h3>
              </div>
            </div>
            <div className="px-5 py-5 space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleTestEmail();
                  }}
                  disabled={sendingTest === 'email'}
                  className="flex-1 inline-flex justify-center items-center gap-2 bg-slate-700 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors border border-slate-600"
                >
                  {sendingTest === 'email' ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : (
                    <Mail className="h-4 w-4" />
                  )}
                  {sendingTest === 'email' ? 'Envoi...' : 'Tester SMTP'}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleTestWhatsApp();
                  }}
                  disabled={sendingTest === 'whatsapp' || !form.whatsapp_number}
                  className="flex-1 inline-flex justify-center items-center gap-2 bg-green-600/20 hover:bg-green-600/30 text-green-500 border border-green-500/30 disabled:opacity-50 disabled:cursor-not-allowed px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Phone className="h-4 w-4" />
                  Tester WhatsApp
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </AdminPage>
  );
}
