import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

const SECTEURS = ['Transport', 'Infrastructure', 'Énergie', 'Éducation', 'Santé', 'Agriculture', 'Finance', 'Autre'];

export default function GestionEPA() {
  const [epas, setEpas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [detailItem, setDetailItem] = useState(null);
  const [detailData, setDetailData] = useState(null);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ code: '', nom: '', secteur: '', description: '' });
  const [toast, setToast] = useState(null);

  const loadEPAs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/epa');
      setEpas(res.data);
    } catch (e) {
      setError(e.response?.data?.message || 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadEPAs(); }, [loadEPAs]);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleOpenForm = (item = null) => {
    setEditItem(item);
    setForm(item ? { code: item.code, nom: item.nom, secteur: item.secteur || '', description: '' } : { code: '', nom: '', secteur: '', description: '' });
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.code.trim() || !form.nom.trim()) return;
    try {
      setSaving(true);
      if (editItem) {
        await api.put(`/admin/epa/${editItem.id}`, form);
        showToast(`EPA "${form.nom}" modifiée avec succès`);
      } else {
        await api.post('/admin/epa', form);
        showToast(`EPA "${form.nom}" créée avec succès`);
      }
      setShowForm(false);
      loadEPAs();
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur lors de la sauvegarde', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatut = async (epa) => {
    const nouveau = epa.statut === 'actif' ? 'inactif' : 'actif';
    const action = nouveau === 'actif' ? 'activer' : 'désactiver';
    if (!window.confirm(`Voulez-vous ${action} l'EPA "${epa.nom}" ?`)) return;
    try {
      await api.patch(`/admin/epa/${epa.id}/statut`, { statut: nouveau });
      showToast(`EPA ${nouveau === 'actif' ? 'activée' : 'désactivée'} avec succès`);
      loadEPAs();
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur', 'error');
    }
  };

  const handleViewDetail = async (epa) => {
    setDetailItem(epa);
    setLoadingDetail(true);
    try {
      const res = await api.get(`/admin/epa/${epa.id}`);
      setDetailData(res.data);
    } catch (e) {
      showToast('Erreur chargement détail', 'error');
    } finally {
      setLoadingDetail(false);
    }
  };

  const filtered = epas.filter(e => {
    const matchSearch = !search || e.nom.toLowerCase().includes(search.toLowerCase()) || e.code.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filterStatut || (e.statut || 'actif') === filterStatut;
    return matchSearch && matchStatut;
  });

  const fmt = (v) => new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(v || 0);

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white transition-all animate-fade-in ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des EPA</h1>
          <p className="text-sm text-gray-500 mt-0.5">{epas.length} établissement{epas.length !== 1 ? 's' : ''} au total</p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle EPA
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Rechercher par nom ou code..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>
        <select
          value={filterStatut}
          onChange={e => setFilterStatut(e.target.value)}
          className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="flex items-center justify-center h-48">
          <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm">{error}</div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Code</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Nom officiel</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Secteur</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisateurs</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Budget Actif</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-10 text-center text-gray-400">
                    Aucune EPA trouvée
                  </td>
                </tr>
              )}
              {filtered.map(epa => (
                <tr key={epa.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3">
                    <span className="font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">{epa.code}</span>
                  </td>
                  <td className="px-5 py-3 font-medium text-gray-900">{epa.nom}</td>
                  <td className="px-5 py-3 text-gray-500">{epa.secteur || <span className="text-gray-300 italic">Non défini</span>}</td>
                  <td className="px-5 py-3 text-gray-700">{epa.nb_utilisateurs || 0}</td>
                  <td className="px-5 py-3 text-gray-700">
                    {epa.budget_annee_actif ? (
                      <span>{epa.budget_annee_actif} — {fmt(epa.budget_total)}</span>
                    ) : (
                      <span className="text-amber-600 text-xs font-medium">Aucun budget actif</span>
                    )}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${(epa.statut || 'actif') === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {(epa.statut || 'actif') === 'actif' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => handleViewDetail(epa)} title="Voir détail" className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                      </button>
                      <button onClick={() => handleOpenForm(epa)} title="Modifier" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button
                        onClick={() => handleToggleStatut(epa)}
                        title={(epa.statut || 'actif') === 'actif' ? 'Désactiver' : 'Activer'}
                        className={`p-1.5 rounded transition-colors ${(epa.statut || 'actif') === 'actif' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                      >
                        {(epa.statut || 'actif') === 'actif' ? (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                        ) : (
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">{editItem ? 'Modifier une EPA' : 'Créer une nouvelle EPA'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Code EPA *</label>
                  <input
                    type="text"
                    value={form.code}
                    onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                    placeholder="ex: DGTT"
                    disabled={!!editItem}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono disabled:bg-gray-50 disabled:text-gray-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Secteur</label>
                  <select
                    value={form.secteur}
                    onChange={e => setForm(f => ({ ...f, secteur: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Sélectionner...</option>
                    {SECTEURS.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nom officiel *</label>
                <input
                  type="text"
                  value={form.nom}
                  onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  placeholder="ex: Direction Générale des Transports Terrestres"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {saving ? 'Enregistrement...' : editItem ? 'Modifier' : 'Créer l\'EPA'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détail */}
      {detailItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900">Détail EPA — {detailItem.nom}</h2>
              <button onClick={() => { setDetailItem(null); setDetailData(null); }} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {loadingDetail ? (
                <div className="flex justify-center py-8"><div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
              ) : detailData && (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-indigo-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-700">{detailData.statistiques?.nb_engagements || 0}</p>
                      <p className="text-xs text-indigo-500 mt-0.5">Engagements</p>
                    </div>
                    <div className="bg-emerald-50 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-emerald-700">{detailData.statistiques?.nb_valides || 0}</p>
                      <p className="text-xs text-emerald-500 mt-0.5">Validés</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                      <p className="text-lg font-bold text-blue-700">{fmt(detailData.statistiques?.montant_valide)}</p>
                      <p className="text-xs text-blue-500 mt-0.5">Montant Validé</p>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Utilisateurs rattachés ({detailData.utilisateurs?.length || 0})</h3>
                    <div className="space-y-1.5">
                      {detailData.utilisateurs?.map(u => (
                        <div key={u.id} className="flex items-center justify-between px-3 py-2 bg-gray-50 rounded-lg">
                          <div>
                            <span className="text-sm font-medium text-gray-800">{u.prenom} {u.nom}</span>
                            <span className="text-xs text-gray-400 ml-2">{u.email}</span>
                          </div>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${u.statut === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                            {u.role_code}
                          </span>
                        </div>
                      ))}
                      {detailData.utilisateurs?.length === 0 && <p className="text-sm text-gray-400 text-center py-3">Aucun utilisateur rattaché</p>}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
