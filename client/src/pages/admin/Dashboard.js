import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const fmt = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(v || 0);
const pct = (eng, total) => total > 0 ? Math.round((eng / total) * 100) : 0;

const ROLE_COLORS = {
  DG: 'bg-purple-100 text-purple-700',
  DAF: 'bg-blue-100 text-blue-700',
  CONTROLEUR: 'bg-amber-100 text-amber-700',
  COMPTABLE: 'bg-emerald-100 text-emerald-700',
  SERVICE: 'bg-cyan-100 text-cyan-700',
  TUTELLE: 'bg-rose-100 text-rose-700',
  CCDB: 'bg-slate-100 text-slate-700',
  ADMIN: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/dashboard');
      setData(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadDashboard(); }, [loadDashboard]);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-center">
        <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
        <p className="text-sm text-gray-500">Chargement du tableau de bord...</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700">{error}</div>
  );

  const { epa, utilisateurs, engagements, budgetsParEpa, dernieresConnexions, alertes } = data || {};

  const totalUtilisateurs = utilisateurs?.reduce((s, r) => s + parseInt(r.total), 0) || 0;
  const totalActifs = utilisateurs?.reduce((s, r) => s + parseInt(r.actifs), 0) || 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de Bord Admin</h1>
          <p className="text-sm text-gray-500 mt-0.5">Vue centralisée de toute la plateforme EPA-Budget</p>
        </div>
        <button
          onClick={loadDashboard}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Actualiser
        </button>
      </div>

      {/* Alertes */}
      {alertes?.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <h3 className="text-sm font-semibold text-amber-800 mb-2 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            {alertes.length} alerte{alertes.length > 1 ? 's' : ''} système
          </h3>
          {alertes.map((a, i) => (
            <p key={i} className="text-xs text-amber-700 mt-1">• {a.titre} — {a.message}</p>
          ))}
        </div>
      )}

      {/* KPIs principaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          label="EPA Actives"
          value={epa?.actives || 0}
          sub={`${epa?.total || 0} au total`}
          color="indigo"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>}
        />
        <KpiCard
          label="Utilisateurs Actifs"
          value={totalActifs}
          sub={`${totalUtilisateurs} au total`}
          color="emerald"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}
        />
        <KpiCard
          label="Engagements Validés"
          value={engagements?.valides || 0}
          sub={fmt(engagements?.montant_valide)}
          color="blue"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
        <KpiCard
          label="En Attente DG"
          value={engagements?.en_attente || 0}
          sub="Engagements à valider"
          color="amber"
          icon={<svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carte EPA */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-800">État des EPA</h2>
            <a href="/admin/epa" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Gérer →</a>
          </div>
          <div className="divide-y divide-gray-50">
            {budgetsParEpa?.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Aucune EPA trouvée</p>
            )}
            {budgetsParEpa?.map((epa) => {
              const tx = pct(parseFloat(epa.engage_total), parseFloat(epa.budget_total));
              return (
                <div key={epa.id} className="px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-semibold ${epa.statut === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {epa.statut === 'actif' ? '●' : '○'} {epa.statut?.toUpperCase()}
                      </span>
                      <span className="text-sm font-medium text-gray-800">{epa.nom}</span>
                      <span className="text-xs text-gray-400">({epa.code})</span>
                    </div>
                    <span className="text-sm font-bold text-gray-700">{tx}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-1.5">
                    <div
                      className={`h-1.5 rounded-full transition-all ${tx >= 90 ? 'bg-red-500' : tx >= 70 ? 'bg-amber-500' : 'bg-indigo-500'}`}
                      style={{ width: `${Math.min(tx, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[10px] text-gray-400">{epa.nb_utilisateurs} utilisateurs</span>
                    <span className="text-[10px] text-gray-400">{fmt(epa.engage_total)} / {fmt(epa.budget_total)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Panel droit */}
        <div className="space-y-4">
          {/* Répartition rôles */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-sm font-semibold text-gray-800">Utilisateurs par Rôle</h2>
              <a href="/admin/utilisateurs" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">Gérer →</a>
            </div>
            <div className="p-4 space-y-2">
              {utilisateurs?.map((r) => (
                <div key={r.role} className="flex items-center justify-between">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${ROLE_COLORS[r.role] || 'bg-gray-100 text-gray-600'}`}>
                    {r.role}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{r.actifs}/{r.total} actifs</span>
                    <span className="text-sm font-semibold text-gray-800">{r.total}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dernières connexions */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Dernières Connexions</h2>
            </div>
            <div className="divide-y divide-gray-50">
              {dernieresConnexions?.slice(0, 6).map((c, i) => (
                <div key={i} className="px-4 py-2.5">
                  <p className="text-xs font-medium text-gray-700">{c.utilisateur_nom}</p>
                  <div className="flex justify-between mt-0.5">
                    <span className="text-[10px] text-gray-400">{c.role_nom}</span>
                    <span className="text-[10px] text-gray-400">
                      {new Date(c.date_heure).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
              {(!dernieresConnexions || dernieresConnexions.length === 0) && (
                <p className="text-xs text-gray-400 text-center py-4">Aucune connexion récente</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub, color, icon }) {
  const colors = {
    indigo: 'bg-indigo-50 text-indigo-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    blue: 'bg-blue-50 text-blue-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">{label}</p>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${colors[color]}`}>{icon}</div>
      </div>
      <p className="text-2xl font-bold text-gray-900">{typeof value === 'number' ? value.toLocaleString('fr-FR') : value}</p>
      <p className="text-xs text-gray-400 mt-1">{sub}</p>
    </div>
  );
}
