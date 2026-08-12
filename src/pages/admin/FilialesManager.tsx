import React, { useState, useRef } from 'react';
import {
  Search,
  Plus,
  Trash2,
  X,
  Upload,
  RefreshCw,
  Edit2,
  Building2,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface Filiale {
  id: number;
  nom: string;
  slug: string;
  secteur: string;
  description: string;
  image_url: string;
  details_json?: { items?: string[] } | string[] | null;
  email: string;
  telephone: string;
  adresse: string;
  site_web: string;
  statut: string;
  created_at: string;
}

const emptyForm = {
  nom: '',
  slug: '',
  secteur: '',
  description: '',
  details: '',
  email: '',
  telephone: '',
  adresse: '',
  site_web: '',
  statut: 'actif',
};

type FormDataState = typeof emptyForm;

function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function FilialesManager() {
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormDataState>(emptyForm);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  const { data: filiales = [], isLoading: loading } = useQuery<Filiale[]>({
    queryKey: ['filiales'],
    queryFn: async () => {
      const res = await api.get('/api/v1/admin/filiales');
      return res.data.success ? res.data.data : [];
    },
  });

  const closeModal = () => {
    setModalOpen(false);
    setImagePreview(null);
    setImageFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const saveMutation = useMutation({
    mutationFn: async (formData: FormData) => {
      if (editId) {
        return api.put(`/api/v1/admin/filiales/${editId}`, formData);
      }
      return api.post('/api/v1/admin/filiales', formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filiales'] });
      closeModal();
    },
    onError: (err) => {
      console.error('Erreur sauvegarde:', err);
      alert('Erreur lors de la sauvegarde de la filiale.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => api.delete(`/api/v1/admin/filiales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['filiales'] });
    },
    onError: (err: any) => {
      console.error('Erreur suppression:', err);
      alert(err?.response?.data?.message || 'Erreur lors de la suppression.');
    },
  });

  const filteredFiliales = filiales.filter((f) => {
    return (
      !search ||
      (f.nom || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.slug || '').toLowerCase().includes(search.toLowerCase()) ||
      (f.secteur || '').toLowerCase().includes(search.toLowerCase())
    );
  });

  const updateForm = (key: keyof FormDataState, value: string) => {
    setForm((prev) => {
      const updated = { ...prev, [key]: value };
      if (key === 'nom' && !editId) {
        updated.slug = generateSlug(value);
      }
      return updated;
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const openCreateModal = () => {
    setEditId(null);
    setForm(emptyForm);
    setImagePreview(null);
    setImageFile(null);
    setModalOpen(true);
  };

  const openEditModal = (filiale: Filiale) => {
    setEditId(filiale.id);
    // Normalize details_json ({items:[...]} | string[] | null) → newline string
    let detailsStr = '';
    const dj = filiale.details_json;
    if (dj) {
      let arr: string[] = [];
      if (Array.isArray(dj)) arr = dj;
      else if (Array.isArray((dj as any).items)) arr = (dj as any).items;
      detailsStr = arr.join('\n');
    }
    setForm({
      nom: filiale.nom,
      slug: filiale.slug,
      secteur: filiale.secteur || '',
      description: filiale.description || '',
      details: detailsStr,
      email: filiale.email || '',
      telephone: filiale.telephone || '',
      adresse: filiale.adresse || '',
      site_web: filiale.site_web || '',
      statut: filiale.statut || 'actif',
    });
    setImagePreview(filiale.image_url || null);
    setImageFile(null);
    setModalOpen(true);
  };

  const handleSave = () => {
    if (!form.nom) return;

    const formData = new FormData();
    formData.append('nom', form.nom);
    formData.append('slug', form.slug);
    formData.append('secteur', form.secteur);
    formData.append('description', form.description);
    formData.append('details', form.details);
    formData.append('email', form.email);
    formData.append('telephone', form.telephone);
    formData.append('adresse', form.adresse);
    formData.append('site_web', form.site_web);
    formData.append('statut', form.statut);

    if (imageFile) {
      formData.append('image', imageFile);
    }

    saveMutation.mutate(formData);
  };

  const handleDelete = (id: number) => {
    if (!confirm('Archiver cette filiale ? Elle ne sera plus visible mais pourra être restaurée en base si besoin.')) return;
    deleteMutation.mutate(id);
  };

  const statutBadge = (statut: string) => {
    const styles: Record<string, string> = {
      actif: 'bg-green-500/20 text-green-400 border-green-500/30',
      active: 'bg-green-500/20 text-green-400 border-green-500/30',
      inactif: 'bg-red-500/20 text-red-400 border-red-500/30',
      inactive: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    const labels: Record<string, string> = {
      actif: 'Active',
      active: 'Active',
      inactif: 'Inactive',
      inactive: 'Inactive',
    };
    return (
      <span
        className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${
          styles[statut] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
        }`}
      >
        {labels[statut] || statut}
      </span>
    );
  };

  return (
    <AdminPage loading={loading}>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-200">Filiales</h2>
            <p className="text-slate-400 text-sm mt-1">Gerez les filiales du groupe MACOF.</p>
          </div>
          <button
            onClick={openCreateModal}
            className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            <Plus className="h-4 w-4" />
            Ajouter une filiale
          </button>
        </div>

        {/* Search */}
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, slug ou secteur..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>

        {/* Table */}
        <div className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase text-slate-400 bg-slate-800/50">
                <tr>
                  <th className="px-6 py-3">Nom</th>
                  <th className="px-6 py-3">Slug</th>
                  <th className="px-6 py-3">Secteur</th>
                  <th className="px-6 py-3">Statut</th>
                  <th className="px-6 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700">
                {filteredFiliales.map((f) => (
                  <tr key={f.id} className="hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4 text-slate-200 font-medium">{f.nom}</td>
                    <td className="px-6 py-4 text-slate-400 font-mono text-xs">{f.slug}</td>
                    <td className="px-6 py-4 text-slate-400">{f.secteur || '-'}</td>
                    <td className="px-6 py-4">{statutBadge(f.statut)}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(f)}
                          className="text-amber-500 hover:text-amber-400 transition-colors"
                        >
                          <Edit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(f.id)}
                          className="text-red-400 hover:text-red-300 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredFiliales.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                      <Building2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>Aucune filiale trouvee.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Create/Edit Modal */}
        {modalOpen &&
          createPortal(
            <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
              <div className="bg-[#1e293b] border border-slate-700 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
                  <h3 className="text-lg font-semibold text-slate-200">
                    {editId ? 'Modifier la filiale' : 'Ajouter une filiale'}
                  </h3>
                  <button onClick={closeModal} className="text-slate-400 hover:text-white">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="px-6 py-5 space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Nom *</label>
                      <input
                        type="text"
                        value={form.nom}
                        onChange={(e) => updateForm('nom', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Slug</label>
                      <input
                        type="text"
                        value={form.slug}
                        onChange={(e) => updateForm('slug', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Secteur</label>
                    <input
                      type="text"
                      value={form.secteur}
                      onChange={(e) => updateForm('secteur', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Description</label>
                    <textarea
                      value={form.description}
                      onChange={(e) => updateForm('description', e.target.value)}
                      rows={3}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">
                      Details (un par ligne)
                    </label>
                    <textarea
                      value={form.details}
                      onChange={(e) => updateForm('details', e.target.value)}
                      rows={4}
                      placeholder="Detail 1&#10;Detail 2&#10;Detail 3"
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors resize-none placeholder-slate-600"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
                      <input
                        type="email"
                        value={form.email}
                        onChange={(e) => updateForm('email', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Telephone</label>
                      <input
                        type="tel"
                        value={form.telephone}
                        onChange={(e) => updateForm('telephone', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Adresse</label>
                      <input
                        type="text"
                        value={form.adresse}
                        onChange={(e) => updateForm('adresse', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-300 mb-1">Site web</label>
                      <input
                        type="url"
                        value={form.site_web}
                        onChange={(e) => updateForm('site_web', e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Statut</label>
                    <select
                      value={form.statut}
                      onChange={(e) => updateForm('statut', e.target.value)}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
                    >
                      <option value="actif">Active</option>
                      <option value="inactif">Inactive</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-300 mb-1">Image</label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-400 file:mr-4 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-600 file:text-white hover:file:bg-amber-500"
                    />
                    {imagePreview && (
                      <div className="mt-3 rounded-lg overflow-hidden border border-slate-700">
                        <img src={imagePreview} alt="Preview" className="w-full h-40 object-cover" />
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
                    onClick={handleSave}
                    disabled={!form.nom || saveMutation.isPending}
                    className="inline-flex items-center gap-2 bg-amber-600 hover:bg-amber-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                  >
                    {saveMutation.isPending ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {saveMutation.isPending ? 'Sauvegarde...' : editId ? 'Modifier' : 'Enregistrer'}
                  </button>
                </div>
              </div>
            </div>,
            document.body,
          )}
      </div>
    </AdminPage>
  );
}