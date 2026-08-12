import React, { useState, useEffect, useRef } from 'react';
import {
  Plus,
  Trash2,
  X,
  Upload,
  RefreshCw,
  Edit2,
  Image as ImageIcon,
} from 'lucide-react';
import { AdminPage } from '../../components/ui/AdminPage';
import { api } from '../../lib/api';
import { getImageUrl } from '../../lib/utils';

interface Filiale {
  id: number;
  nom: string;
  slug: string;
}

interface Realisation {
  id: string; // Unique ID for React keys
  title: string;
  desc: string;
  image: string;
}

export default function RealisationsManager() {
  const [filiales, setFiliales] = useState<Filiale[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('');
  
  const [realisations, setRealisations] = useState<Realisation[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  
  const [formTitle, setFormTitle] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch filiales on mount
  useEffect(() => {
    const fetchFiliales = async () => {
      try {
        const res = await api.get('/api/v1/admin/filiales');
        if (res.data.success) {
          setFiliales(res.data.data || []);
          if (res.data.data?.length > 0) {
            setSelectedSlug(res.data.data[0].slug);
          }
        }
      } catch (err) {
        console.error('Erreur fetch filiales:', err);
      }
    };
    fetchFiliales();
  }, []);

  // Fetch realisations when selected slug changes
  useEffect(() => {
    if (!selectedSlug) return;
    const fetchRealisations = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/api/v1/admin/pages/${selectedSlug}`);
        if (res.data.success && res.data.data?.contents) {
          const contents = res.data.data.contents;
          const realisationsSection = contents.find((c: any) => c.section_key === 'realisations');
          if (realisationsSection && realisationsSection.content_value) {
            try {
              const parsed = JSON.parse(realisationsSection.content_value);
              setRealisations(Array.isArray(parsed) ? parsed : []);
            } catch (e) {
              console.error('Erreur parsing JSON realisations:', e);
              setRealisations([]);
            }
          } else {
            setRealisations([]);
          }
        } else {
          setRealisations([]);
        }
      } catch (err) {
        console.error('Erreur fetch realisations:', err);
        setRealisations([]);
      } finally {
        setLoading(false);
      }
    };
    fetchRealisations();
  }, [selectedSlug]);

  const saveToBackend = async (newRealisations: Realisation[]) => {
    if (!selectedSlug) return;
    try {
      const formData = new FormData();
      formData.append('key', 'realisations');
      formData.append('value', JSON.stringify(newRealisations));
      
      await api.post(`/api/v1/admin/pages/${selectedSlug}`, formData);
    } catch (err) {
      console.error('Erreur sauvegarde realisations:', err);
      throw err;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setFormImageUrl(''); // Reset URL if a file is chosen
    }
  };

  const openCreateModal = () => {
    setEditId(null);
    setFormTitle('');
    setFormDesc('');
    setFormImageUrl('');
    setFormFile(null);
    setPreviewUrl(null);
    setModalOpen(true);
  };

  const openEditModal = (r: Realisation) => {
    setEditId(r.id);
    setFormTitle(r.title);
    setFormDesc(r.desc);
    setFormImageUrl(r.image);
    setFormFile(null);
    setPreviewUrl(r.image);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setFormFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSaveItem = async () => {
    if (!formTitle) return;
    setUploading(true);
    try {
      let finalImageUrl = formImageUrl;

      // Upload file if selected
      if (formFile) {
        const formData = new FormData();
        formData.append('file', formFile);
        formData.append('folder', 'realisations');
        const uploadRes = await api.post('/api/v1/admin/upload', formData);
        if (uploadRes.data.success) {
          finalImageUrl = uploadRes.data.data.url;
        } else {
          throw new Error("Erreur lors de l'upload");
        }
      }

      if (!finalImageUrl) {
        alert('Veuillez fournir une image (fichier ou URL).');
        setUploading(false);
        return;
      }

      let updatedArray = [...realisations];

      if (editId) {
        updatedArray = updatedArray.map(r => 
          r.id === editId 
            ? { ...r, title: formTitle, desc: formDesc, image: finalImageUrl }
            : r
        );
      } else {
        const newItem: Realisation = {
          id: Date.now().toString(),
          title: formTitle,
          desc: formDesc,
          image: finalImageUrl
        };
        updatedArray.push(newItem);
      }

      await saveToBackend(updatedArray);
      setRealisations(updatedArray);
      closeModal();
    } catch (err) {
      console.error('Erreur save item:', err);
      alert("Erreur lors de l'enregistrement.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cette r\u00e9alisation ?')) return;
    setSaving(true);
    try {
      const updatedArray = realisations.filter(r => r.id !== id);
      await saveToBackend(updatedArray);
      setRealisations(updatedArray);
    } catch (err) {
      console.error('Erreur suppression:', err);
      alert("Erreur lors de la suppression.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <AdminPage loading={loading} className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">R\u00e9alisations par Filiale</h2>
          <p className="text-slate-400 text-sm mt-1">G\u00e9rez les projets sp\u00e9cifiques affich\u00e9s sur les pages des filiales.</p>
        </div>
        <button
          onClick={openCreateModal}
          disabled={!selectedSlug}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter une r\u00e9alisation
        </button>
      </div>

      {/* Filter / Filiale Selection */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#1e293b] p-4 rounded-lg border border-slate-700">
        <div>
          <label className="block text-sm font-medium text-slate-300 mb-1">S\u00e9lectionner une filiale</label>
          <select
            value={selectedSlug}
            onChange={(e) => setSelectedSlug(e.target.value)}
            className="w-full sm:w-64 bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
          >
            {filiales.map((f) => (
              <option key={f.id} value={f.slug}>
                {f.nom}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {realisations.map((r) => (
            <div
              key={r.id}
              className="group bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors flex flex-col"
            >
              <div className="relative aspect-video bg-slate-800 overflow-hidden">
                <img
                  src={getImageUrl(r.image)}
                  alt={r.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute top-2 right-2 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => openEditModal(r)}
                    className="bg-slate-900/80 hover:bg-slate-900 text-amber-500 p-1.5 rounded-lg transition-colors backdrop-blur-sm"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(r.id)}
                    className="bg-red-600/90 hover:bg-red-500 text-white p-1.5 rounded-lg transition-colors backdrop-blur-sm"
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4 flex-1 flex flex-col">
                <h3 className="text-sm font-semibold text-slate-200 mb-1">{r.title}</h3>
                <p className="text-xs text-slate-400 line-clamp-3">{r.desc}</p>
              </div>
            </div>
          ))}
          {realisations.length === 0 && (
            <div className="col-span-full text-center py-12 text-slate-500 bg-[#1e293b] border border-slate-700 rounded-lg">
              <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Aucune r\u00e9alisation pour cette filiale.</p>
            </div>
          )}
        </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-200">
                {editId ? 'Modifier la r\u00e9alisation' : 'Ajouter une r\u00e9alisation'}
              </h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Titre *</label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description courte</label>
                <textarea
                  value={formDesc}
                  onChange={(e) => setFormDesc(e.target.value)}
                  rows={3}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">URL de l'image (Optionnel)</label>
                <input
                  type="text"
                  value={formImageUrl}
                  onChange={(e) => {
                    setFormImageUrl(e.target.value);
                    if (e.target.value) {
                      setPreviewUrl(e.target.value);
                      setFormFile(null);
                    }
                  }}
                  placeholder="https://..."
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>
              
              <div className="text-center text-xs text-slate-500 font-medium">OU</div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Uploader une image</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-600 file:text-white hover:file:bg-amber-500"
                />
                {previewUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-slate-700 bg-slate-900">
                    <img 
                      src={getImageUrl(previewUrl)} 
                      alt="Preview" 
                      className="w-full h-48 object-contain" 
                    />
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-3 px-6 py-4 border-t border-slate-700">
              <button
                onClick={closeModal}
                className="px-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleSaveItem}
                disabled={!formTitle || uploading}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {uploading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
