import React, { useState, useEffect, useCallback } from 'react';
import { Mail, CheckCircle, AlertCircle, Building2, RefreshCw } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { AdminPage } from '../../components/ui/AdminPage';

interface Demande {
  id: number;
  reference: string;
  nom_complet: string;
  email: string;
  telephone: string;
  filiale: string;
  type_demande: string;
  statut: string;
  created_at: string;
}

interface Filiale {
  id: number;
  nom: string;
  statut: string;
}

interface KpiData {
  total: number;
  traite: number;
  nouveau: number;
  filialesActives: number;
}

function StatutBadge({ statut, onClick }: { statut: string; onClick?: () => void }) {
  const styles: Record<string, string> = {
    nouveau: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    en_cours: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    traite: 'bg-green-500/20 text-green-400 border-green-500/30',
    archive: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  };

  const labels: Record<string, string> = {
    nouveau: 'Nouveau',
    en_cours: 'En cours',
    traite: 'Traite',
    archive: 'Archive',
  };

  return (
    <span
      onClick={onClick}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium border cursor-pointer hover:opacity-80 transition-opacity ${
        styles[statut] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'
      }`}
    >
      {labels[statut] || statut}
    </span>
  );
}

export default function Dashboard() {
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<number | null>(null);

  const { data, isLoading: loading } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const [demandesRes, filialesRes, statsRes] = await Promise.all([
        api.get('/api/v1/admin/demandes?limit=100'),
        api.get('/api/v1/admin/filiales'),
        api.get('/api/v1/admin/stats'),
      ]);
      return { demandesRes, filialesRes, statsRes };
    },
    
  });

  const demandes = data?.demandesRes?.data?.success
    ? (Array.isArray(data.demandesRes.data.data) ? data.demandesRes.data.data : (data.demandesRes.data.data.items || []))
    : [];
  const filiales = data?.filialesRes?.data?.success ? data.filialesRes.data.data || [] : [];
  const stats = data?.statsRes?.data?.success ? data.statsRes.data.data : null;

  const kpi = {
    total: stats?.total_demandes ?? demandes.length,
    traite: demandes.filter((d: Demande) => d.statut === 'traite').length,
    nouveau: stats?.nouvelles_demandes ?? demandes.filter((d: Demande) => d.statut === 'nouveau').length,
    filialesActives: filiales.filter((f: Filiale) => f.statut === 'actif').length,
  };

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    setUpdatingId(id);
    try {
      await api.patch(`/api/v1/admin/demandes/${id}`, { statut: newStatus });
      queryClient.invalidateQueries({ queryKey: ['dashboardData'] });
    } catch (err) {
      console.error('Erreur mise a jour statut:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const cycleStatus = (demande: Demande) => {
    const order = ['nouveau', 'en_cours', 'traite', 'archive'];
    const idx = order.indexOf(demande.statut);
    const next = order[(idx + 1) % order.length];
    handleStatusUpdate(demande.id, next);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const recentDemandes = [...demandes]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10);


  const kpiCards = [
    {
      label: 'Total demandes',
      value: kpi.total,
      icon: Mail,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Traitees',
      value: kpi.traite,
      icon: CheckCircle,
      color: 'text-green-400',
      bg: 'bg-green-500/10',
    },
    {
      label: 'Nouvelles',
      value: kpi.nouveau,
      icon: AlertCircle,
      color: 'text-yellow-400',
      bg: 'bg-yellow-500/10',
    },
    {
      label: 'Filiales actives',
      value: kpi.filialesActives,
      icon: Building2,
      color: 'text-[#cda434]',
      bg: 'bg-[#cda434]/10',
    },
  ];

  return (
    <AdminPage loading={loading} className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-[#1e293b] border border-slate-700 rounded-lg p-5 flex items-center gap-4"
            >
              <div className={`${card.bg} p-3 rounded-lg`}>
                <Icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-slate-400">{card.label}</p>
                <p className="text-2xl font-bold text-slate-200">{card.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Demandes */}
      <div className="bg-[#1e293b] border border-slate-700 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-700 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-200">Demandes recentes</h2>
          <button
            onClick={() => queryClient.invalidateQueries({ queryKey: ['dashboardData'] })}
            className="text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-xs uppercase text-slate-400 bg-slate-800/50">
              <tr>
                <th className="px-6 py-3">Ref</th>
                <th className="px-6 py-3">Nom</th>
                <th className="px-6 py-3">Filiale</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {recentDemandes.map((d) => (
                <tr
                  key={d.id}
                  className="hover:bg-slate-700/30 transition-colors"
                >
                  <td className="px-6 py-4 font-mono text-[#cda434] text-xs">
                    {d.reference || `#${d.id}`}
                  </td>
                  <td className="px-6 py-4 text-slate-200">{d.nom_complet}</td>
                  <td className="px-6 py-4 text-slate-400">{d.filiale}</td>
                  <td className="px-6 py-4">
                    {updatingId === d.id ? (
                      <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
                    ) : (
                      <StatutBadge statut={d.statut} onClick={() => cycleStatus(d)} />
                    )}
                  </td>
                  <td className="px-6 py-4 text-slate-400">{formatDate(d.created_at)}</td>
                </tr>
              ))}
              {recentDemandes.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                    Aucune demande recue.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminPage>
  );
}
