import React, { useState, useEffect, useCallback } from 'react';
import {
  BarChart3,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  CheckCircle,
  Edit2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Stat {
  value: string;
  label: string;
}

interface FilialeApiData {
  id: number;
  nom: string;
  slug?: string;
  stat_1_value?: string;
  stat_1_label?: string;
  stat_2_value?: string;
  stat_2_label?: string;
}

interface FilialeStats {
  id: number;
  nom: string;
  slug: string;
  stat_1_value: string;
  stat_1_label: string;
  stat_2_value: string;
  stat_2_label: string;
}

// ─── StatRow component ────────────────────────────────────────────────────────

function StatRow({ stat, index, onChange, onDelete }: {
  stat: Stat;
  index: number;
  onChange: (index: number, field: 'value' | 'label', val: string) => void;
  onDelete: (index: number) => void;
}) {
  return (
    <div className="flex items-center gap-3 p-3 bg-slate-800/50 border border-slate-700 rounded-lg group">
      <div className="flex-1 grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-widest mb-1 block">Valeur</label>
          <input
            type="text"
            value={stat.value}
            onChange={(e) => onChange(index, 'value', e.target.value)}
            placeholder="Ex: 350+"
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>
        <div>
          <label className="text-xs text-slate-500 uppercase tracking-widest mb-1 block">Libellé</label>
          <input
            type="text"
            value={stat.label}
            onChange={(e) => onChange(index, 'label', e.target.value)}
            placeholder="Ex: Collaborateurs"
            className="w-full bg-slate-900 border border-slate-600 rounded px-3 py-1.5 text-sm text-white focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>
      <button
        type="button"
        onClick={() => onDelete(index)}
        className="text-red-400 hover:text-red-300 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity"
        title="Supprimer la statistique"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export default function StatsManager() {
  const [activeTab, setActiveTab] = useState<'global' | 'filiales'>('global');
  const [stats, setStats] = useState<Stat[]>([]);
  const [filiales, setFiliales] = useState<FilialeStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | number | null>(null);
  const [saved, setSaved] = useState(false);
  const [expandedFiliale, setExpandedFiliale] = useState<number | null>(null);

  // ─── Fetch Data ─────────────────────────────────────────────────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch home stats
      const homeRes = await api.get('/api/v1/pages/home');
      if (homeRes.data?.success && homeRes.data.data?.stats) {
        try {
          const parsed = typeof homeRes.data.data.stats === 'string' 
            ? JSON.parse(homeRes.data.data.stats) 
            : homeRes.data.data.stats;
          setStats(Array.isArray(parsed) ? parsed : []);
        } catch {
          setStats([
            { value: '2018', label: 'Année de création' },
            { value: '6', label: 'Filiales' },
            { value: '50+', label: 'Projets réalisés' },
            { value: '350+', label: 'Collaborateurs' },
          ]);
        }
      } else {
        setStats([
          { value: '2018', label: 'Année de création' },
          { value: '6', label: 'Filiales' },
          { value: '50+', label: 'Projets réalisés' },
          { value: '350+', label: 'Collaborateurs' },
        ]);
      }

      // Fetch filiales
      const filialesRes = await api.get('/api/v1/admin/filiales');
      if (filialesRes.data?.success) {
        const raw: FilialeApiData[] = Array.isArray(filialesRes.data.data)
          ? filialesRes.data.data
          : filialesRes.data.data?.items || [];

        setFiliales(
          raw.map((f) => ({
            id: f.id,
            nom: f.nom,
            slug: f.slug || '',
            stat_1_value: f.stat_1_value || '',
            stat_1_label: f.stat_1_label || '',
            stat_2_value: f.stat_2_value || '',
            stat_2_label: f.stat_2_label || '',
          }))
        );
      }
    } catch (err) {
      console.error('Erreur fetch stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Global Stats Handlers ──────────────────────────────────────────────────

  const handleStatChange = (index: number, field: 'value' | 'label', val: string) => {
    setStats((prev) => prev.map((s, i) => (i === index ? { ...s, [field]: val } : s)));
  };

  const handleAddStat = () => {
    setStats((prev) => [...prev, { value: '', label: '' }]);
  };

  const handleDeleteStat = (index: number) => {
    setStats((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveGlobalStats = async () => {
    setSavingId('global');
    try {
      await api.post('/api/v1/admin/pages/bulk', {
        page_slug: 'home',
        contents: [{ section_key: 'stats', content_value: JSON.stringify(stats), content_type: 'json' }],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erreur save stats:', err);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSavingId(null);
    }
  };

  // ─── Filiale Stats Handlers ─────────────────────────────────────────────────

  const handleFilialeStatChange = (id: number, field: keyof FilialeStats, val: string) => {
    setFiliales((prev) => prev.map((f) => (f.id === id ? { ...f, [field]: val } : f)));
  };

  const handleSaveFilialeStats = async (filiale: FilialeStats) => {
    setSavingId(filiale.id);
    try {
      await api.post('/api/v1/admin/pages/bulk', {
        page_slug: filiale.slug || filiale.nom.toLowerCase().replace(/\s+/g, '-'),
        contents: [
          { section_key: 'stat_1_value', content_value: filiale.stat_1_value, content_type: 'text' },
          { section_key: 'stat_1_label', content_value: filiale.stat_1_label, content_type: 'text' },
          { section_key: 'stat_2_value', content_value: filiale.stat_2_value, content_type: 'text' },
          { section_key: 'stat_2_label', content_value: filiale.stat_2_label, content_type: 'text' },
        ],
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      console.error('Erreur save filiale stats:', err);
      alert('Erreur lors de la sauvegarde.');
    } finally {
      setSavingId(null);
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
              <BarChart3 className="h-6 w-6 text-[#cda434]" />
              Chiffres &amp; Statistiques
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Modifiez tous les chiffres clés et statistiques affichés sur le site public.
            </p>
          </div>
          {saved && (
            <div className="flex items-center gap-2 text-green-400 text-sm font-medium bg-green-400/10 px-4 py-2 rounded-lg border border-green-400/20">
              <CheckCircle className="h-4 w-4" />
              Sauvegardé avec succès !
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700">
          {[
            { key: 'global', label: "Page d'Accueil" },
            { key: 'filiales', label: 'Par Filiale' },
          ].map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as 'global' | 'filiales')}
              className={`px-5 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.key
                  ? 'border-[#cda434] text-[#cda434]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab: Global (Home) Stats */}
        {activeTab === 'global' && (
          <div className="space-y-4">
            <div className="bg-[#1e293b] border border-slate-700 rounded-lg p-6">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-slate-200 font-semibold">Chiffres Clés — Page d'Accueil</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    Ces statistiques s'affichent dans la section "Chiffres Clés" de la page d'accueil.
                  </p>
                </div>
              </div>

              <div className="mt-6 space-y-3">
                {stats.map((stat, i) => (
                  <StatRow
                    key={`stat-${i}`}
                    stat={stat}
                    index={i}
                    onChange={handleStatChange}
                    onDelete={handleDeleteStat}
                  />
                ))}
              </div>

              <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-700">
                <button
                  type="button"
                  onClick={handleAddStat}
                  className="inline-flex items-center gap-2 text-sm text-slate-400 hover:text-white border border-slate-600 hover:border-slate-400 px-3 py-2 rounded-lg transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  Ajouter un chiffre
                </button>
                <button
                  type="button"
                  onClick={handleSaveGlobalStats}
                  disabled={savingId === 'global'}
                  className="inline-flex items-center gap-2 bg-[#cda434] hover:bg-[#cda434]/80 disabled:opacity-50 text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                >
                  <span className="relative flex items-center justify-center h-4 w-4">
                    <Save className={`h-4 w-4 absolute transition-opacity ${savingId === 'global' ? 'opacity-0' : 'opacity-100'}`} />
                    <RefreshCw className={`h-4 w-4 absolute animate-spin transition-opacity ${savingId === 'global' ? 'opacity-100' : 'opacity-0'}`} />
                  </span>
                  {savingId === 'global' ? 'Sauvegarde...' : 'Sauvegarder'}
                </button>
              </div>
            </div>

            {/* Preview */}
            <div className="bg-[#1e293b] border border-slate-700 rounded-lg p-6">
              <h4 className="text-slate-300 font-medium mb-4 text-sm uppercase tracking-widest">Aperçu (rendu sur le site)</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center bg-white rounded-lg p-8">
                {stats.map((s, i) => (
                  <div key={`preview-${i}`}>
                    <div className="text-4xl font-serif text-[#0A4287] mb-2">{s.value || '—'}</div>
                    <div className="text-xs font-sans tracking-widest text-[#b8142b] uppercase">{s.label || '—'}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab: Per Filiale Stats */}
        {activeTab === 'filiales' && (
          <div className="space-y-3">
            <p className="text-slate-400 text-sm">
              Modifiez les deux statistiques affichées sur chaque page de filiale.
            </p>
            {filiales.map((f) => (
              <div key={f.id} className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden">
                <button
                  type="button"
                  onClick={() => setExpandedFiliale(expandedFiliale === f.id ? null : f.id)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-700/30 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-[#cda434]/20 flex items-center justify-center text-[#cda434] text-sm font-bold">
                      {f.nom.charAt(0)}
                    </div>
                    <div>
                      <span className="text-slate-200 font-medium">{f.nom}</span>
                      {(f.stat_1_value || f.stat_2_value) && (
                        <span className="ml-3 text-xs text-slate-500">
                          {f.stat_1_value && `${f.stat_1_value} · ${f.stat_1_label}`}
                          {f.stat_1_value && f.stat_2_value && ' — '}
                          {f.stat_2_value && `${f.stat_2_value} · ${f.stat_2_label}`}
                        </span>
                      )}
                    </div>
                  </div>
                  {expandedFiliale === f.id ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                </button>

                {expandedFiliale === f.id && (
                  <div className="px-5 pb-5 border-t border-slate-700 pt-5 space-y-4">
                    <p className="text-slate-400 text-sm">
                      Ces chiffres s'affichent en bas de la section "Vision" de la page <strong className="text-slate-300">{f.nom}</strong>.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Stat 1 */}
                      <div className="space-y-3">
                        <h4 className="text-slate-300 text-sm font-medium flex items-center gap-2"><Edit2 className="h-3.5 w-3.5" /> Statistique 1</h4>
                        <div>
                          <label className="text-xs text-slate-500 uppercase tracking-widest mb-1 block">Valeur</label>
                          <input
                            type="text"
                            value={f.stat_1_value}
                            onChange={(e) => handleFilialeStatChange(f.id, 'stat_1_value', e.target.value)}
                            placeholder="Ex: 3"
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 uppercase tracking-widest mb-1 block">Libellé</label>
                          <input
                            type="text"
                            value={f.stat_1_label}
                            onChange={(e) => handleFilialeStatChange(f.id, 'stat_1_label', e.target.value)}
                            placeholder="Ex: Segments Stratégiques"
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>

                      {/* Stat 2 */}
                      <div className="space-y-3">
                        <h4 className="text-slate-300 text-sm font-medium flex items-center gap-2"><Edit2 className="h-3.5 w-3.5" /> Statistique 2</h4>
                        <div>
                          <label className="text-xs text-slate-500 uppercase tracking-widest mb-1 block">Valeur</label>
                          <input
                            type="text"
                            value={f.stat_2_value}
                            onChange={(e) => handleFilialeStatChange(f.id, 'stat_2_value', e.target.value)}
                            placeholder="Ex: SEBA"
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                        <div>
                          <label className="text-xs text-slate-500 uppercase tracking-widest mb-1 block">Libellé</label>
                          <input
                            type="text"
                            value={f.stat_2_label}
                            onChange={(e) => handleFilialeStatChange(f.id, 'stat_2_label', e.target.value)}
                            placeholder="Ex: Marque Phare"
                            className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="bg-slate-900 rounded-lg p-6 border border-slate-700">
                      <p className="text-xs text-slate-500 uppercase tracking-widest mb-4">Aperçu</p>
                      <div className="grid grid-cols-2 gap-8 text-center">
                        <div>
                          <div className="text-4xl font-serif text-white mb-1">{f.stat_1_value || '—'}</div>
                          <div className="text-xs text-blue-300 uppercase tracking-widest">{f.stat_1_label || '—'}</div>
                        </div>
                        <div>
                          <div className="text-4xl font-serif text-white mb-1">{f.stat_2_value || '—'}</div>
                          <div className="text-xs text-blue-300 uppercase tracking-widest">{f.stat_2_label || '—'}</div>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={() => handleSaveFilialeStats(f)}
                        disabled={savingId === f.id}
                        className="inline-flex items-center gap-2 bg-[#cda434] hover:bg-[#cda434]/80 disabled:opacity-50 text-black font-semibold px-5 py-2.5 rounded-lg text-sm transition-colors"
                      >
                        <span className="relative flex items-center justify-center h-4 w-4">
                          <Save className={`h-4 w-4 absolute transition-opacity ${savingId === f.id ? 'opacity-0' : 'opacity-100'}`} />
                          <RefreshCw className={`h-4 w-4 absolute animate-spin transition-opacity ${savingId === f.id ? 'opacity-100' : 'opacity-0'}`} />
                        </span>
                        {savingId === f.id ? 'Sauvegarde...' : `Sauvegarder ${f.nom}`}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminPage>
  );
}