import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  RefreshCw,
  Save,
  ImageIcon,
  FileText,
  FileCode,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';

interface PageSection {
  key: string;
  type: 'text' | 'html' | 'image' | 'json';
  value: string;
  image_url?: string;
}

interface PageData {
  slug: string;
  titre: string;
  sections: PageSection[];
}

const pages: Array<{ label: string; slug: string }> = [
  { label: 'Accueil', slug: 'home' },
  { label: 'À propos', slug: 'about' },
  { label: 'Immobilier', slug: 'immobilier' },
  { label: 'Restauration', slug: 'restauration' },
  { label: 'Transit', slug: 'transit' },
  { label: 'Mining', slug: 'mining' },
  { label: 'Fishing', slug: 'fishing' },
  { label: 'Print', slug: 'print' },
  { label: 'Contact', slug: 'contact' },
];

function toReadableLabel(key: string): string {
  return key
    .replace(/_/g, ' ')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

const typeIcons: Record<string, React.ReactNode> = {
  text: <FileText className="h-3.5 w-3.5" />,
  html: <FileCode className="h-3.5 w-3.5" />,
  image: <ImageIcon className="h-3.5 w-3.5" />,
  json: <FileText className="h-3.5 w-3.5" />,
};

const typeLabels: Record<string, string> = {
  text: 'Texte',
  html: 'HTML',
  image: 'Image',
  json: 'JSON',
};

export default function PagesEditor() {
  const [selectedPage, setSelectedPage] = useState(pages[0].slug);
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  
  const imageInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const previewUrlsRef = useRef<string[]>([]);

  // Nettoyage des URL de prévisualisation locales d'images
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // Timer de notification
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const fetchPage = useCallback(async (slug: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await api.get(`/api/v1/admin/pages/${slug}`);
      if (res.data?.success) {
        setPageData(res.data.data || null);
      } else {
        setPageData(null);
      }
    } catch (err: unknown) {
      const error = err as { response?: { status?: number } };
      if (error.response?.status === 404) {
        setPageData(null);
      } else {
        console.error('Erreur fetch page:', err);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let canceled = false;

    const load = async () => {
      if (!canceled) {
        await fetchPage(selectedPage);
      }
    };

    load();

    return () => {
      canceled = true;
    };
  }, [selectedPage, fetchPage]);

  const updateSectionValue = (key: string, value: string) => {
    if (!pageData) return;
    setPageData({
      ...pageData,
      sections: pageData.sections?.map((s) => (s.key === key ? { ...s, value } : s)),
    });
  };

  const saveSection = async (key: string, imageFile?: File) => {
    if (!pageData) return;
    setSavingKey(key);

    try {
      const section = pageData.sections?.find((s) => s.key === key);
      if (!section) return;

      // Validation JSON
      if (section.type === 'json' && section.value) {
        try {
          JSON.parse(section.value);
        } catch {
          setNotification({ type: 'error', message: `Format JSON invalide dans "${toReadableLabel(key)}".` });
          setSavingKey(null);
          return;
        }
      }

      const formData = new FormData();
      formData.append('key', key);
      formData.append('value', section.value || '');
      if (imageFile) {
        formData.append('image', imageFile);
      }

      const res = await api.post(`/api/v1/admin/pages/${selectedPage}`, formData);
      
      if (res.data?.success && res.data.data) {
        const updated = res.data.data;
        // Mise à jour ciblée du state avec l'URL finale renvoyée par le backend (Vercel Blob / Storage local)
        setPageData((prev) => {
          if (!prev) return null;
          return {
            ...prev,
            sections: prev.sections.map((s) =>
              s.key === key
                ? {
                    ...s,
                    value: updated.value,
                    image_url: updated.image_url || s.image_url,
                  }
                : s
            ),
          };
        });
      }

      setNotification({ type: 'success', message: `Section "${toReadableLabel(key)}" sauvegardée.` });
    } catch (err: any) {
      console.error('Erreur sauvegarde:', err);
      const msg = err.response?.data?.message || `Erreur lors de la sauvegarde.`;
      setNotification({ type: 'error', message: msg });
    } finally {
      setSavingKey(null);
    }
  };

  const handleImageUpload = (key: string, file: File) => {
    if (!pageData) return;
    
    // Aperçu local temporaire
    const url = URL.createObjectURL(file);
    previewUrlsRef.current.push(url);

    setPageData({
      ...pageData,
      sections: pageData.sections?.map((s) =>
        s.key === key ? { ...s, image_url: url } : s
      ),
    });
    
    // Téléversement direct
    saveSection(key, file);
  };

  const isJsonValid = (str: string) => {
    if (!str) return true;
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const renderSectionInput = (section: PageSection) => {
    switch (section.type) {
      case 'text':
        return (
          <input
            type="text"
            value={section.value || ''}
            onChange={(e) => updateSectionValue(section.key, e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
        );
      case 'html':
        return (
          <div>
            <p className="text-xs text-slate-500 mb-1">Supporte les balises HTML</p>
            <textarea
              value={section.value || ''}
              onChange={(e) => updateSectionValue(section.key, e.target.value)}
              rows={6}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors font-mono resize-y"
            />
          </div>
        );
      case 'image':
        return (
          <div className="space-y-3">
            {section.image_url && (
              <div className="rounded-lg overflow-hidden border border-slate-700 max-w-md">
                <img
                  src={section.image_url}
                  alt={section.key}
                  className="max-h-48 object-cover w-full"
                />
              </div>
            )}
            <input
              ref={(el) => {
                imageInputRefs.current[section.key] = el;
              }}
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  handleImageUpload(section.key, file);
                  e.target.value = '';
                }
              }}
              className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-600 file:text-white hover:file:bg-amber-500 cursor-pointer"
            />
          </div>
        );
      case 'json': {
        const valid = isJsonValid(section.value);
        return (
          <div>
            <div className="flex justify-between items-center mb-1">
              <p className="text-xs text-slate-500">Format JSON valide (tableau ou objet)</p>
              {!valid && (
                <span className="text-xs text-red-400 font-medium">JSON invalide</span>
              )}
            </div>
            <textarea
              value={section.value || ''}
              onChange={(e) => updateSectionValue(section.key, e.target.value)}
              rows={6}
              className={`w-full bg-slate-800 border ${
                valid ? 'border-slate-600 focus:border-amber-500' : 'border-red-500 focus:border-red-400'
              } rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none transition-colors font-mono resize-y`}
            />
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <AdminPage className="flex gap-6 min-h-[calc(100vh-7rem)]">
      {/* Page Sidebar */}
      <div className="w-64 flex-shrink-0">
        <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">Pages</h3>
        <div className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden">
          <nav className="divide-y divide-slate-700">
            {pages.map((p) => (
              <button
                key={p.slug}
                onClick={() => setSelectedPage(p.slug)}
                className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                  selectedPage === p.slug
                    ? 'bg-[#cda434]/10 text-[#cda434] font-medium'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                {p.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="flex-1 space-y-6">
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
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-200">
              {pages.find((p) => p.slug === selectedPage)?.label || selectedPage}
            </h2>
            <p className="text-slate-400 text-sm mt-1">Éditez les sections de la page.</p>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              fetchPage(selectedPage);
            }}
            className="text-slate-400 hover:text-slate-200 transition-colors p-2 rounded-lg hover:bg-slate-800"
            title="Rafraîchir"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Sections */}
        {loading && !pageData ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 text-[#cda434] animate-spin" />
          </div>
        ) : !pageData?.sections || pageData.sections.length === 0 ? (
          <div className="text-center py-12 text-slate-500 bg-[#1e293b] border border-slate-700 rounded-lg">
            <p>Aucune section disponible pour cette page.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pageData.sections.map((section) => (
              <div
                key={section.key}
                className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden"
              >
                <div className="flex items-center justify-between px-5 py-3 bg-slate-800/50 border-b border-slate-700">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-400">{typeIcons[section.type]}</span>
                    <h3 className="text-sm font-medium text-slate-200">
                      {toReadableLabel(section.key)}
                    </h3>
                    <span className="text-xs bg-slate-700 text-slate-400 rounded-full px-2 py-0.5">
                      {typeLabels[section.type] || section.type}
                    </span>
                  </div>
                  {section.type !== 'image' && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault();
                        saveSection(section.key);
                      }}
                      disabled={savingKey === section.key}
                      className="inline-flex items-center gap-1.5 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                      {savingKey === section.key ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Save className="h-3.5 w-3.5" />
                      )}
                      {savingKey === section.key ? 'Sauvegarde...' : 'Sauvegarder'}
                    </button>
                  )}
                  {section.type === 'image' && savingKey === section.key && (
                    <span className="inline-flex items-center gap-1 text-xs text-amber-400">
                      <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Transfert...
                    </span>
                  )}
                </div>
                <div className="p-5">
                  {renderSectionInput(section)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPage>
  );
}