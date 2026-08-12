import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Search, RefreshCw, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';

interface Lead {
  id: number;
  nom_complet: string;
  email: string;
  telephone: string;
  filiale: string;
  type_demande: string;
  objet: string;
  message: string;
  reference: string;
  statut: string;
  created_at: string;
}

const ITEMS_PER_PAGE = 10;

const statutOptions = [
  { value: '', label: 'Tous les statuts' },
  { value: 'nouveau', label: 'Nouveau' },
  { value: 'en_cours', label: 'En cours' },
  { value: 'traite', label: 'Traite' },
  { value: 'archive', label: 'Archive' },
];

export default function Leads() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statutFilter, setStatutFilter] = useState('');
  const [filialeFilter, setFilialeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [showDetails, setShowDetails] = useState<Lead | null>(null);

  const { data: leads = [], isLoading: loading, error, refetch: fetchLeads } = useQuery({
    queryKey: ['adminLeads'],
    queryFn: async () => {
      const response = await api.get('/api/v1/admin/demandes?limit=100');
      if (response.data.success) {
        const data = response.data.data;
        return Array.isArray(data) ? data : (data.items || []);
      }
      return [];
    },
    
  });

  // Extract unique filiales from data
  const filiales = Array.from(new Set(leads.map((l) => l.filiale))).filter(Boolean).sort();

  // Filter leads
  const filteredLeads = leads.filter((lead) => {
    const query = search.toLowerCase();
    const matchSearch =
      !search ||
      (lead.nom_complet || '').toLowerCase().includes(query) ||
      (lead.email || '').toLowerCase().includes(query) ||
      (lead.reference && lead.reference.toLowerCase().includes(query));
    const matchStatut = !statutFilter || lead.statut === statutFilter;
    const matchFiliale = !filialeFilter || lead.filiale === filialeFilter;
    return matchSearch && matchStatut && matchFiliale;
  });

  // Pagination
  const totalPages = Math.max(1, Math.ceil(filteredLeads.length / ITEMS_PER_PAGE));
  const paginatedLeads = filteredLeads.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statutFilter, filialeFilter]);

  const updateStatus = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/api/v1/admin/demandes/${id}`, { statut: newStatus });
      queryClient.invalidateQueries({ queryKey: ['adminLeads'] });
    } catch (err) {
      console.error('Erreur mise a jour:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const statutBadge = (statut: string) => {
    const map: Record<string, string> = {
      nouveau: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      en_cours: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      traite: 'bg-green-500/20 text-green-400 border-green-500/30',
      archive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
    };
    return map[statut] || 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  };

  const statutLabel = (statut: string) => {
    const map: Record<string, string> = {
      nouveau: 'Nouveau',
      en_cours: 'En cours',
      traite: 'Traite',
      archive: 'Archive',
    };
    return map[statut] || statut;
  };


  return (
    <AdminPage loading={loading} className="space-y-6">
      {error && (
        <div className="bg-red-900/20 border border-red-500/50 p-4 rounded-lg mb-6">
          <p className="text-red-400">Erreur de chargement des demandes.</p>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-200">Demandes Recues</h2>
          <p className="text-slate-400 text-sm mt-1">
            {filteredLeads.length} demande{filteredLeads.length > 1 ? 's' : ''} trouvee{filteredLeads.length > 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={fetchLeads}
          className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Rafraichir
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher par nom, email ou reference..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-800 border border-slate-600 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <select
          value={statutFilter}
          onChange={(e) => setStatutFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
        >
          {statutOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={filialeFilter}
          onChange={(e) => setFilialeFilter(e.target.value)}
          className="bg-slate-800 border border-slate-600 rounded-lg px-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
        >
          <option value="">Toutes les filiales</option>
          {filiales.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400 bg-slate-800/50">
              <tr>
                <th className="px-6 py-3">Reference</th>
                <th className="px-6 py-3">Filiale</th>
                <th className="px-6 py-3">Client</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {paginatedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-700/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-[#cda434] text-xs">
                    {lead.reference || `#${lead.id}`}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{lead.filiale}</td>
                  <td className="px-6 py-4">
                    <div className="text-slate-200 font-medium">{lead.nom_complet}</div>
                    <div className="text-xs text-slate-500">{lead.email}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-400 capitalize">{lead.type_demande}</td>
                  <td className="px-6 py-4">
                    {updatingId === lead.id ? (
                      <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                    ) : (
                      <select
                        value={lead.statut}
                        onChange={(e) => updateStatus(lead.id, e.target.value)}
                        className={`px-2 py-1 text-xs rounded-full border cursor-pointer bg-transparent ${statutBadge(lead.statut)}`}
                      >
                        <option value="nouveau">Nouveau</option>
                        <option value="en_cours">En cours</option>
                        <option value="traite">Traite</option>
                        <option value="archive">Archive</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-500">{formatDate(lead.created_at)}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => setShowDetails(lead)}
                      className="text-amber-500 hover:text-amber-400 text-xs font-medium transition-colors"
                    >
                      Details
                    </button>
                  </td>
                </tr>
              ))}
              {paginatedLeads.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500">
                    <Mail className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucune demande trouvee.</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 border-t border-slate-700">
            <p className="text-sm text-slate-400">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600 rounded-lg transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
                Precedent
              </button>
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-slate-400 hover:text-slate-200 disabled:opacity-50 disabled:cursor-not-allowed border border-slate-600 rounded-lg transition-colors"
              >
                Suivant
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showDetails && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-[#1e293b] border border-slate-700 rounded-lg w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
              <h3 className="text-lg font-semibold text-slate-200">
                Details de la demande
              </h3>
              <button
                onClick={() => setShowDetails(null)}
                className="text-slate-400 hover:text-white"
              >
                X
              </button>
            </div>
            <div className="px-6 py-5 space-y-3">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-500">Reference:</span>
                  <p className="text-[#cda434] font-mono">{showDetails.reference || `#${showDetails.id}`}</p>
                </div>
                <div>
                  <span className="text-slate-500">Statut:</span>
                  <p>
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border ${statutBadge(
                        showDetails.statut
                      )}`}
                    >
                      {statutLabel(showDetails.statut)}
                    </span>
                  </p>
                </div>
                <div>
                  <span className="text-slate-500">Nom:</span>
                  <p className="text-slate-200">{showDetails.nom_complet}</p>
                </div>
                <div>
                  <span className="text-slate-500">Email:</span>
                  <p className="text-slate-200">{showDetails.email}</p>
                </div>
                <div>
                  <span className="text-slate-500">Telephone:</span>
                  <p className="text-slate-200">{showDetails.telephone || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500">Filiale:</span>
                  <p className="text-slate-200">{showDetails.filiale}</p>
                </div>
                <div>
                  <span className="text-slate-500">Type:</span>
                  <p className="text-slate-200 capitalize">{showDetails.type_demande}</p>
                </div>
                <div>
                  <span className="text-slate-500">Date:</span>
                  <p className="text-slate-200">{formatDate(showDetails.created_at)}</p>
                </div>
              </div>
              {showDetails.objet && (
                <div>
                  <span className="text-slate-500 text-sm">Objet:</span>
                  <p className="text-slate-200 text-sm mt-0.5">{showDetails.objet}</p>
                </div>
              )}
              {showDetails.message && (
                <div>
                  <span className="text-slate-500 text-sm">Message:</span>
                  <p className="text-slate-200 text-sm mt-0.5 whitespace-pre-wrap">{showDetails.message}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end px-6 py-4 border-t border-slate-700">
              <button
                onClick={() => setShowDetails(null)}
                className="px-4 py-2 text-sm bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg transition-colors"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminPage>
  );
}
