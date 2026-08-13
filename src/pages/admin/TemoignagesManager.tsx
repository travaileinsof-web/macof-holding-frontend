import { useState, useEffect, useCallback, useRef } from 'react';
import {
  MessageSquareQuote,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle,
  Image as ImageIcon,
  Upload,
} from 'lucide-react';
import { api } from '../../lib/api';
import { getImageUrl } from '../../lib/utils';
import { AdminPage } from '../../components/ui/AdminPage';
import { ConfirmDialog } from '../../components/ui/ConfirmDialog';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Temoignage {
  id: string; // for internal tracking in state
  nom: string;
  poste: string;
  entreprise: string;
  message: string;
  avatar_url: string;
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function TemoignagesManager() {
  const [temoignages, setTemoignages] = useState<Temoignage[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [deleteTargetName, setDeleteTargetName] = useState('');

  // Snapshot de référence (sans les id internes) pour détecter les changements réels
  const initialDataRef = useRef<string>('[]');
  const [isDirty, setIsDirty] = useState(false);

  // ─── Fetch Data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/v1/pages/home');
      if (res.data.success && res.data.data?.temoignages) {
        try {
          const parsed = JSON.parse(res.data.data.temoignages);
          const parsedArray = Array.isArray(parsed) ? parsed : [];
          const withIds = parsedArray.map((t: any) => ({ ...t, id: Math.random().toString(36).substring(7) }));
          setTemoignages(withIds);
          // On garde une empreinte des données telles que reçues du serveur (sans id local)
          initialDataRef.current = JSON.stringify(parsedArray);
          setIsDirty(false);
        } catch {
          setTemoignages([]);
          initialDataRef.current = '[]';
          setIsDirty(false);
        }
      } else {
        setTemoignages([]);
        initialDataRef.current = '[]';
        setIsDirty(false);
      }
    } catch (err) {
      console.error('Erreur fetch temoignages:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Recalcule isDirty à chaque changement de la liste (ajout, suppression, édition, upload)
  useEffect(() => {
    const stripped = temoignages.map(({ id, ...rest }) => rest);
    setIsDirty(JSON.stringify(stripped) !== initialDataRef.current);
  }, [temoignages]);

  // ─── Handlers ───────────────────────────────────────────────────────────────

  const handleAddTemoignage = () => {
    setTemoignages((prev) => [
      { id: Math.random().toString(36).substring(7), nom: '', poste: '', entreprise: '', message: '', avatar_url: '' },
      ...prev
    ]);
  };

  const handleRemoveTemoignage = (id: string) => {
    const tem = temoignages.find(t => t.id === id);
    if (!tem) return;
    setDeleteTargetId(id);
    setDeleteTargetName(tem.nom || 'Sans nom');
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = () => {
    if (deleteTargetId !== null) {
      setTemoignages((prev) => prev.filter((t) => t.id !== deleteTargetId));
      setDeleteConfirmOpen(false);
    }
  };

  const handleChange = (id: string, field: keyof Temoignage, value: string) => {
    setTemoignages((prev) => prev.map((t) => t.id === id ? { ...t, [field]: value } : t));
  };

  const handleFileUpload = async (id: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    
    try {
      const uploadRes = await api.post('/api/v1/admin/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      if (uploadRes.data.success) {
        handleChange(id, 'avatar_url', uploadRes.data.data.filename);
      } else {
        alert('Erreur lors du téléchargement de l\'image.');
      }
    } catch (error) {
      console.error('Upload error:', error);
      alert('Erreur serveur lors du téléchargement.');
    }
  };

  const handleSave = async () => {
    if (!isDirty || saving) return; // garde-fou supplémentaire : pas de requête sans modification

    setSaving(true);
    try {
      // Remove 'id' field before saving to DB
      const dataToSave = temoignages.map(({ id, ...rest }) => rest);
      
      await api.post('/api/v1/admin/pages/bulk', {
        page_slug: 'home',
        contents: [
          { section_key: 'temoignages', content_value: JSON.stringify(dataToSave), content_type: 'json' }
        ],
      });

      // Nouveau point de référence : le bouton redevient désactivé jusqu'à la prochaine modif
      initialDataRef.current = JSON.stringify(dataToSave);
      setIsDirty(false);

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erreur save temoignages:', err);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  // ─── Render ─────────────────────────────────────────────────────────────────


  return (
    <AdminPage loading={loading}>
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-200 flex items-center gap-2">
            <MessageSquareQuote className="h-6 w-6 text-[#cda434]" />
            Témoignages Clients
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            Gérez les avis et témoignages affichés sur la page d'accueil (B2B).
          </p>
        </div>
        <div className="flex items-center gap-4">
          {saved && (
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-400/10 px-4 py-2 rounded-lg border border-green-400/20">
              <CheckCircle className="h-4 w-4" />
              Sauvegardé !
            </div>
          )}
          <button
            onClick={handleAddTemoignage}
            className="inline-flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold px-4 py-2.5 rounded-lg text-sm border border-slate-700 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Nouveau témoignage
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            title={!isDirty ? 'Aucune modification à sauvegarder' : undefined}
            className="inline-flex items-center gap-2 bg-[#cda434] hover:bg-[#cda434]/80 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#cda434] text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
          >
            <span className="relative flex items-center justify-center h-4 w-4">
              <Save className={`h-4 w-4 absolute transition-opacity ${saving ? 'opacity-0' : 'opacity-100'}`} />
              <RefreshCw className={`h-4 w-4 absolute animate-spin transition-opacity ${saving ? 'opacity-100' : 'opacity-0'}`} />
            </span>
            {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </button>
        </div>
      </div>

      {/* List */}
      <div className="grid grid-cols-1 gap-6">
        {temoignages.length === 0 ? (
          <div className="text-center py-12 bg-[#1e293b] border border-slate-700 rounded-lg">
            <MessageSquareQuote className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-slate-300 font-medium mb-1">Aucun témoignage</h3>
            <p className="text-slate-500 text-sm mb-4">Ajoutez votre premier témoignage client.</p>
            <button
              onClick={handleAddTemoignage}
              className="inline-flex items-center gap-2 text-[#cda434] hover:text-white border border-[#cda434] hover:bg-[#cda434] px-4 py-2 rounded-lg text-sm transition-colors"
            >
              <Plus className="h-4 w-4" />
              Ajouter un témoignage
            </button>
          </div>
        ) : (
          temoignages.map((tem) => (
            <div key={tem.id} className="bg-[#1e293b] border border-slate-700 rounded-xl overflow-hidden group">
              <div className="p-6">
                <div className="flex flex-col md:flex-row gap-8">
                  {/* Avatar Upload */}
                  <div className="flex-shrink-0 w-32">
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-2">Avatar</label>
                    <div className="relative aspect-square rounded-full border-2 border-dashed border-slate-600 overflow-hidden bg-slate-800 hover:border-[#cda434] transition-colors group/avatar cursor-pointer">
                      {tem.avatar_url ? (
                        <img 
                          src={getImageUrl(tem.avatar_url)} 
                          alt={tem.nom} 
                          className="w-full h-full object-cover" 
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          <ImageIcon className="h-8 w-8" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex flex-col items-center justify-center">
                        <Upload className="h-5 w-5 text-white mb-1" />
                        <span className="text-[10px] text-white font-medium uppercase tracking-wider">Modifier</span>
                      </div>
                      <input 
                        type="file" 
                        accept="image/*"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileUpload(tem.id, e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="flex-1 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Nom</label>
                        <input
                          type="text"
                          value={tem.nom}
                          onChange={(e) => handleChange(tem.id, 'nom', e.target.value)}
                          placeholder="Ex: Ousmane Sylla"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#cda434]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Poste</label>
                        <input
                          type="text"
                          value={tem.poste}
                          onChange={(e) => handleChange(tem.id, 'poste', e.target.value)}
                          placeholder="Ex: Directeur Général"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#cda434]"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Entreprise</label>
                        <input
                          type="text"
                          value={tem.entreprise}
                          onChange={(e) => handleChange(tem.id, 'entreprise', e.target.value)}
                          placeholder="Ex: GUICOPRES"
                          className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-2.5 text-sm text-white focus:outline-none focus:border-[#cda434]"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Message / Avis</label>
                      <textarea
                        rows={3}
                        value={tem.message}
                        onChange={(e) => handleChange(tem.id, 'message', e.target.value)}
                        placeholder="Ex: Une collaboration exceptionnelle, l'expertise de MACOF a été déterminante..."
                        className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 text-sm text-white focus:outline-none focus:border-[#cda434]"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex-shrink-0 flex items-start justify-end">
                    <button
                      onClick={() => handleRemoveTemoignage(tem.id)}
                      className="text-slate-500 hover:text-red-400 p-2 rounded-lg hover:bg-red-400/10 transition-colors"
                      title="Supprimer ce témoignage"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        isOpen={deleteConfirmOpen}
        title="Supprimer le témoignage ?"
        message={`Êtes-vous sûr de vouloir supprimer le témoignage de "${deleteTargetName}" ? Cette action est irréversible.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isDangerous={true}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </div>
    </AdminPage>
  );
}