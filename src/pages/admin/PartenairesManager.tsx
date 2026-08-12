import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus,
  Trash2,
  CheckCircle,
  Upload,
  Users,
  X,
  Link as LinkIcon,
  RefreshCw,
} from 'lucide-react';
import { api } from '../../lib/api';
import { getImageUrl } from '../../lib/utils';
import { AdminPage } from '../../components/ui/AdminPage';

interface Partenaire {
  nom: string;
  logo_url: string;
}

export default function PartenairesManager() {
  const [partenaires, setPartenaires] = useState<Partenaire[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formNom, setFormNom] = useState('');
  const [formLogoUrl, setFormLogoUrl] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [useUrlInput, setUseUrlInput] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/pages/home');
      if (res.data?.success && res.data?.data?.partenaires) {
        try {
          const parsed = typeof res.data.data.partenaires === 'string'
            ? JSON.parse(res.data.data.partenaires)
            : res.data.data.partenaires;
          setPartenaires(Array.isArray(parsed) ? parsed : []);
        } catch {
          setPartenaires([]);
        }
      } else {
        setPartenaires([]);
      }
    } catch (err) {
      console.error('Erreur fetch partenaires:', err);
      setPartenaires([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Nettoyage de l'objet URL pour éviter les fuites mémoire
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSave = async (list: Partenaire[]) => {
    setSaving(true);
    try {
      await api.post('/api/v1/admin/pages/bulk', {
        page_slug: 'home',
        contents: [
          {
            section_key: 'partenaires',
            content_value: JSON.stringify(list),
            content_type: 'json',
          },
        ],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
      return true;
    } catch (err) {
      console.error('Erreur save partenaires:', err);
      alert('Erreur lors de la sauvegarde.');
      return false;
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (index: number) => {
    if (!confirm('Supprimer ce partenaire ?')) return;
    const updated = partenaires.filter((_, i) => i !== index);
    const success = await handleSave(updated);
    if (success) {
      setPartenaires(updated);
    }
  };

  const openModal = () => {
    setFormNom('');
    setFormLogoUrl('');
    setFormFile(null);
    setPreviewUrl(null);
    setUseUrlInput(false);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrl && previewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(previewUrl);
      }
      setFormFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleAdd = async () => {
    if (!formNom.trim()) return;
    setUploading(true);
    try {
      let logoUrl = formLogoUrl.trim();

      if (formFile && !useUrlInput) {
        const formData = new FormData();
        formData.append('image', formFile);
        formData.append('titre', formNom);
        formData.append('filiale', '');
        const uploadRes = await api.post('/api/v1/admin/galerie', formData);
        if (uploadRes.data?.success) {
          logoUrl = uploadRes.data.data?.image_path || '';
        }
      }

      if (!logoUrl) {
        alert('Veuillez uploader un logo ou fournir une URL.');
        setUploading(false);
        return;
      }

      const updated = [...partenaires, { nom: formNom.trim(), logo_url: logoUrl }];
      const success = await handleSave(updated);
      if (success) {
        setPartenaires(updated);
        closeModal();
      }
    } catch (err) {
      console.error('Erreur ajout partenaire:', err);
      alert("Erreur lors de l'ajout.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <AdminPage loading={loading}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
              <Users className="h-6 w-6 text-[#cda434]" />
              Partenaires
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Gérez les logos des partenaires affichés en bande défilante sur la page d'accueil.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-400/10 px-4 py-2 rounded-lg border border-green-400/20">
                <CheckCircle className="h-4 w-4" />
                Sauvegardé !
              </div>
            )}
            <button
              onClick={openModal}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter un partenaire
            </button>
          </div>
        </div>

        {/* Info banner */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-sm text-blue-300 flex gap-3">
          <div className="shrink-0 mt-0.5">ℹ</div>
          <div>
            Les logos que vous ajoutez ici apparaissent automatiquement dans la section <strong>"Nos Partenaires"</strong> sur la page d'accueil du site public, sous forme de bande défilante animée.
          </div>
        </div>

        {/* Partners Grid */}
        {partenaires.length === 0 ? (
          <div className="bg-[#1e293b] border border-slate-700 rounded-lg p-16 text-center">
            <Users className="h-12 w-12 mx-auto mb-4 text-slate-600" />
            <p className="text-slate-400 mb-2">Aucun partenaire ajouté</p>
            <p className="text-slate-500 text-sm">Cliquez sur "Ajouter un partenaire" pour commencer.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {partenaires.map((p, i) => (
              <div
                key={`${p.nom}-${i}`}
                className="group bg-[#1e293b] border border-slate-700 rounded-lg p-4 flex flex-col items-center gap-3 hover:border-slate-600 transition-colors relative"
              >
                <button
                  onClick={() => handleDelete(i)}
                  disabled={saving}
                  className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-0"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
                <div className="h-16 w-full flex items-center justify-center overflow-hidden">
                  <img
                    src={getImageUrl(p.logo_url)}
                    alt={p.nom}
                    className="max-h-full max-w-full object-contain"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect fill="%23334155" width="100" height="100"/><text x="50" y="55" text-anchor="middle" fill="%2394a3b8" font-size="12">Logo</text></svg>';
                    }}
                  />
                </div>
                <p className="text-slate-300 text-xs text-center font-medium truncate w-full">{p.nom}</p>
              </div>
            ))}
          </div>
        )}

        {/* Live Preview */}
        {partenaires.length > 0 && (
          <div className="bg-[#1e293b] border border-slate-700 rounded-lg p-6">
            <h4 className="text-slate-400 text-xs uppercase tracking-widest mb-4">Aperçu — Bande défilante (site public)</h4>
            <div className="overflow-hidden relative bg-white/5 rounded py-4">
              <div className="flex gap-12 items-center px-8 animate-none">
                {[...partenaires, ...partenaires].map((p, i) => (
                  <div key={`prev-${p.nom}-${i}`} className="shrink-0 flex items-center gap-3 opacity-70">
                    <img
                      src={getImageUrl(p.logo_url)}
                      alt={p.nom}
                      className="h-8 object-contain grayscale"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className="text-slate-400 text-sm whitespace-nowrap">{p.nom}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Add Modal */}
        {modalOpen && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-lg w-full max-w-md">
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                <h3 className="text-lg font-semibold text-slate-200">Ajouter un partenaire</h3>
                <button onClick={closeModal} className="text-slate-400 hover:text-white">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-1">Nom du partenaire *</label>
                  <input
                    type="text"
                    value={formNom}
                    onChange={(e) => setFormNom(e.target.value)}
                    placeholder="Ex: Rio Tinto"
                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                  />
                </div>

                <div>
                  <div className="flex gap-3 mb-3">
                    <button
                      type="button"
                      onClick={() => setUseUrlInput(false)}
                      className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                        !useUrlInput
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      <Upload className="h-4 w-4 inline mr-1.5" />
                      Uploader le logo
                    </button>
                    <button
                      type="button"
                      onClick={() => setUseUrlInput(true)}
                      className={`flex-1 py-2 text-sm rounded-lg border transition-colors ${
                        useUrlInput
                          ? 'border-amber-500 bg-amber-500/10 text-amber-400'
                          : 'border-slate-600 text-slate-400 hover:border-slate-400'
                      }`}
                    >
                      <LinkIcon className="h-4 w-4 inline mr-1.5" />
                      URL externe
                    </button>
                  </div>

                  {useUrlInput ? (
                    <input
                      type="url"
                      value={formLogoUrl}
                      onChange={(e) => setFormLogoUrl(e.target.value)}
                      placeholder="https://example.com/logo.png"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500"
                    />
                  ) : (
                    <div>
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-600 file:text-white hover:file:bg-amber-500"
                      />
                      {previewUrl && (
                        <div className="mt-3 flex items-center justify-center h-20 bg-white/5 rounded-lg border border-slate-700">
                          <img src={previewUrl} alt="Aperçu" className="max-h-full max-w-full object-contain" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
                <button onClick={closeModal} className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200">
                  Annuler
                </button>
                <button
                  onClick={handleAdd}
                  disabled={!formNom.trim() || (!formFile && !formLogoUrl.trim()) || uploading}
                  className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  {uploading ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {uploading ? 'Ajout en cours...' : 'Ajouter'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminPage>
  );
}