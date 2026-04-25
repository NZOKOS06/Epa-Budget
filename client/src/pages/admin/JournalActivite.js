import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const ACTION_COLORS = {
  create: 'bg-emerald-100 text-emerald-700',
  update: 'bg-blue-100 text-blue-700',
  delete: 'bg-red-100 text-red-700',
  view: 'bg-gray-100 text-gray-600',
};

const ACTION_ICONS = {
  create: '＋',
  update: '✎',
  delete: '✕',
  view: '👁',
};

const RESSOURCE_LABELS = {
  connexion: '🔐 Connexion',
  engagements: '📄 Engagement',
  liquidations: '💳 Liquidation',
  paiements: '💰 Paiement',
  recettes: '📥 Recette',
  budgets: '📊 Budget',
  programmes: '📋 Programme',
  articles: '📑 Article Budgétaire',
  modificatifs: '✏️ Modificatif',
  rapports: '📈 Rapport',
  epa: '🏛️ EPA',
  utilisateurs: '👤 Utilisateur',
};

export default function JournalActivite() {
  const [journal, setJournal] = useState([]);
  const [stats, setStats] = useState([]);
  const [utilisateurs, setUtilisateurs] = useState([]);
  const [epas, setEpas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    ressource: '', action: '', date_debut: '', date_fin: '',
    id_utilisateur: '', epa_id: ''
  });
  const [total, setTotal] = useState(0);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v; });

      const [journalRes, usersRes, epasRes] = await Promise.all([
        api.get('/admin/journal', { params }),
        api.get('/admin/utilisateurs'),
        api.get('/admin/epa'),
      ]);

      setJournal(journalRes.data.journal || []);
      setStats(journalRes.data.stats || []);
      setTotal(journalRes.data.journal?.length || 0);
      setUtilisateurs(usersRes.data);
      setEpas(epasRes.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleExport = () => {
    const rows = [
      ['Date/Heure', 'Action', 'Ressource', 'ID Ressource', 'Utilisateur', 'Rôle', 'EPA', 'IP'],
      ...journal.map(j => [
        new Date(j.date_heure).toLocaleString('fr-FR'),
        j.action, j.ressource, j.ressource_id,
        j.utilisateur_nom, j.role_nom, j.epa_nom || '',
        j.ip_adresse
      ])
    ];
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `journal_audit_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalActions = stats.reduce((s, r) => s + parseInt(r.total), 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal d'Activité</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} entrée{total !== 1 ? 's' : ''} — Historique complet de toutes les opérations</p>
        </div>
        <button
          onClick={handleExport}
          disabled={journal.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 transition-colors shadow-sm disabled:opacity-50"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          Exporter CSV
        </button>
      </div>

      {/* Stats 30 jours */}
      {stats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map(s => (
            <div key={s.action} className="bg-white rounded-lg border border-gray-200 p-3 flex items-center justify-between">
              <div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${ACTION_COLORS[s.action] || 'bg-gray-100 text-gray-600'}`}>
                  {ACTION_ICONS[s.action]} {s.action}
                </span>
                <p className="text-xs text-gray-400 mt-0.5">30 derniers jours</p>
              </div>
              <p className="text-xl font-bold text-gray-800">{parseInt(s.total).toLocaleString('fr-FR')}</p>
            </div>
          ))}
          <div className="bg-indigo-50 rounded-lg border border-indigo-100 p-3 flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-indigo-700">TOTAL</span>
              <p className="text-xs text-indigo-400 mt-0.5">30 derniers jours</p>
            </div>
            <p className="text-xl font-bold text-indigo-800">{totalActions.toLocaleString('fr-FR')}</p>
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Action</label>
            <select
              value={filters.action}
              onChange={e => setFilters(f => ({ ...f, action: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Toutes les actions</option>
              <option value="create">Création</option>
              <option value="update">Modification</option>
              <option value="delete">Suppression</option>
              <option value="view">Consultation</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Ressource</label>
            <select
              value={filters.ressource}
              onChange={e => setFilters(f => ({ ...f, ressource: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Toutes les ressources</option>
              {Object.entries(RESSOURCE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">EPA</label>
            <select
              value={filters.epa_id}
              onChange={e => setFilters(f => ({ ...f, epa_id: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Toutes les EPA</option>
              {epas.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Utilisateur</label>
            <select
              value={filters.id_utilisateur}
              onChange={e => setFilters(f => ({ ...f, id_utilisateur: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
            >
              <option value="">Tous les utilisateurs</option>
              {utilisateurs.map(u => <option key={u.id} value={u.id}>{u.prenom} {u.nom} ({u.role_code})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Date début</label>
            <input
              type="date"
              value={filters.date_debut}
              onChange={e => setFilters(f => ({ ...f, date_debut: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">Date fin</label>
            <input
              type="date"
              value={filters.date_fin}
              onChange={e => setFilters(f => ({ ...f, date_fin: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        <div className="flex justify-end mt-3">
          <button
            onClick={() => setFilters({ ressource: '', action: '', date_debut: '', date_fin: '', id_utilisateur: '', epa_id: '' })}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Réinitialiser les filtres
          </button>
        </div>
      </div>

      {/* Journal */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Date/Heure</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Action</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Ressource</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisateur</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">EPA</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {journal.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-gray-400">
                    Aucune entrée trouvée pour ces critères
                  </td>
                </tr>
              )}
              {journal.map((entry, i) => (
                <tr key={entry.id || i} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                    {new Date(entry.date_heure).toLocaleString('fr-FR', {
                      day: '2-digit', month: '2-digit', year: '2-digit',
                      hour: '2-digit', minute: '2-digit', second: '2-digit'
                    })}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${ACTION_COLORS[entry.action] || 'bg-gray-100 text-gray-600'}`}>
                      {ACTION_ICONS[entry.action]} {entry.action}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-700">
                    <span className="font-medium">{RESSOURCE_LABELS[entry.ressource] || entry.ressource}</span>
                    <span className="text-gray-400 ml-1.5">#{entry.ressource_id}</span>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-xs font-medium text-gray-800">{entry.utilisateur_nom}</p>
                    <p className="text-[10px] text-gray-400">{entry.role_nom}</p>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{entry.epa_nom || <span className="text-gray-300">—</span>}</td>
                  <td className="px-5 py-3 text-xs font-mono text-gray-400">{entry.ip_adresse}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {journal.length === 500 && (
            <div className="px-5 py-3 bg-amber-50 border-t border-amber-100">
              <p className="text-xs text-amber-700">⚠ Affichage limité à 500 entrées. Utilisez les filtres pour affiner les résultats ou exportez en CSV.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
