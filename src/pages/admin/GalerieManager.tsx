import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Search,
  Plus,
  Trash2,
  X,
  Upload,
  RefreshCw,
  Image as ImageIcon,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';

interface GalerieItem {
  id: number;
  titre: string;
  filiale: number | null;
  filiale_nom?: string | null;
  description_courte?: string;
  description?: string;
  image_path: string;
  image_url?: string;
  created_at: string;
}

interface FilialeOption {
  id: number;
  nom: string;
}

export default function GalerieManager() {
  const [images, setImages] = useState<GalerieItem[]>([]);
  const [filiales, setFiliales] = useState<FilialeOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filialeFilter, setFilialeFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  const [formTitre, setFormTitre] = useState('');
  const [formFiliale, setFormFiliale] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formTypeProjet, setFormTypeProjet] = useState('autre');
  const [formLieu, setFormLieu] = useState('');
  const [formFile, setFormFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    try {
      const [galerieRes, filialesRes] = await Promise.all([
        api.get('/api/v1/admin/galerie'),
        api.get('/api/v1/admin/filiales'),
      ]);
      if (galerieRes.data.success) {
        const gData = galerieRes.data.data;
        setImages(Array.isArray(gData) ? gData : (gData.items || []));
      }
      if (filialesRes.data.success) {
        const fData = filialesRes.data.data;
        setFiliales(Array.isArray(fData) ? fData : (fData.items || []));
      }
    } catch (err) {
      console.error('Erreur fetch galerie:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const filteredImages = images.filter((img) => {
    const filialeLabel = img.filiale_nom || img.filiale || '';
    const matchSearch =
      !search ||
      (img.titre || '').toLowerCase().includes(search.toLowerCase()) ||
      String(filialeLabel).toLowerCase().includes(search.toLowerCase());
    const matchFiliale = !filialeFilter || String(filialeLabel) === filialeFilter;
    return matchSearch && matchFiliale;
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormFile(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const openModal = () => {
    setFormTitre('');
    setFormFiliale(filiales[0]?.nom || '');
    setFormDescription('');
    setFormTypeProjet('autre');
    setFormLieu('');
    setFormFile(null);
    setPreviewUrl(null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setPreviewUrl(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleUpload = async () => {
    if (!formTitre || !formFile) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('titre', formTitre);
      formData.append('filiale', formFiliale);
      formData.append('description', formDescription);
      formData.append('type_projet', formTypeProjet);
      formData.append('lieu', formLieu);
      formData.append('image', formFile);

      await api.post('/api/v1/admin/galerie', formData);
      closeModal();
      fetchData();
    } catch (err) {
      console.error('Erreur upload:', err);
      alert('Erreur lors de l\'upload de l\'image.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette image ?')) return;
    try {
      await api.delete(`/api/v1/admin/galerie/${id}`);
      fetchData();
    } catch (err: any) {
      console.error('Erreur suppression:', err);
      alert(err?.response?.data?.message || 'Erreur lors de la suppression.');
    }
  };


  return (
    <AdminPage loading={loading}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Galerie</h2>
          <p className="text-slate-400 text-sm mt-1">Gerez les images de la galerie.</p>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Ajouter une image
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par titre ou filiale..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <select
          value={filialeFilter}
          onChange={(e) => setFilialeFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
        >
          <option value="">Toutes les filiales</option>
          {filiales.map((f) => (
            <option key={f.id} value={f.nom}>
              {f.nom}
            </option>
          ))}
        </select>
      </div>

      {/* Image Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredImages.map((img) => (
          <div
            key={img.id}
            className="group bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden hover:border-slate-600 transition-colors"
          >
            <div className="relative aspect-video bg-slate-800 overflow-hidden">
              <img
                src={img.image_path || img.image_url}
                alt={img.titre}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button
                onClick={() => handleDelete(img.id)}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="p-3">
              <h3 className="text-sm font-medium text-slate-200 truncate">{img.titre}</h3>
              <span className="inline-block mt-1 text-xs bg-[#cda434]/10 text-[#cda434] rounded-full px-2 py-0.5">
                {img.filiale_nom || img.filiale || '—'}
              </span>
            </div>
          </div>
        ))}
        {filteredImages.length === 0 && (
          <div className="col-span-full text-center py-12 text-slate-500">
            <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Aucune image trouvee.</p>
          </div>
        )}
      </div>

      {/* Add Image Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-200">Ajouter une image</h3>
              <button onClick={closeModal} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Titre *</label>
                <input
                  type="text"
                  value={formTitre}
                  onChange={(e) => setFormTitre(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Filiale</label>
                <select
                  value={formFiliale}
                  onChange={(e) => setFormFiliale(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                >
                  {filiales.map((f) => (
                    <option key={f.id} value={f.nom}>
                      {f.nom}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Catégorie de projet</label>
                <select
                  value={formTypeProjet}
                  onChange={(e) => setFormTypeProjet(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                >
                  <option value="residentiel">Résidentiel</option>
                  <option value="commercial">Commercial</option>
                  <option value="infrastructure">Infrastructure</option>
                  <option value="evenement">Événement</option>
                  <option value="production">Production</option>
                  <option value="logistique">Logistique</option>
                  <option value="autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Lieu</label>
                <input
                  type="text"
                  value={formLieu}
                  onChange={(e) => setFormLieu(e.target.value)}
                  placeholder="Ex: Conakry, Guinée"
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Description courte</label>
                <textarea
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Image *</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-600 file:text-white hover:file:bg-amber-500"
                />
                {previewUrl && (
                  <div className="mt-3 rounded-lg overflow-hidden border border-slate-700">
                    <img src={previewUrl} alt="Preview" className="w-full h-48 object-cover" />
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
                onClick={handleUpload}
                disabled={!formTitre || !formFile || uploading}
                className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              >
                {uploading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="h-4 w-4" />
                )}
                {uploading ? 'Envoi...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminPage>
  );
}
