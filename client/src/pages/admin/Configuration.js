import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const STATUT_BUDGET_LABELS = {
  preparation: { label: 'En préparation', color: 'bg-gray-100 text-gray-600' },
  approuve: { label: 'Approuvé', color: 'bg-blue-100 text-blue-700' },
  actif: { label: 'Actif', color: 'bg-emerald-100 text-emerald-700' },
  cloture: { label: 'Clôturé', color: 'bg-slate-100 text-slate-600' },
};

export default function Configuration() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [updatingBudget, setUpdatingBudget] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const loadConfig = async () => {
    try {
      setLoading(true);
      const res = await api.get('/admin/configuration');
      setConfig(res.data);
    } catch (e) {
      showToast('Erreur de chargement de la configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadConfig(); }, []);

  const handleStatutBudget = async (budget, statut) => {
    const labels = { actif: 'activer', cloture: 'clôturer', approuve: 'approuver' };
    if (!window.confirm(`Voulez-vous ${labels[statut] || 'modifier'} ce budget ?`)) return;
    try {
      setUpdatingBudget(budget.id);
      await api.patch(`/admin/budgets/${budget.id}/statut`, { statut });
      showToast(`Budget ${statut === 'actif' ? 'activé' : 'mis à jour'} avec succès`);
      loadConfig();
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur', 'error');
    } finally {
      setUpdatingBudget(null);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  const { annees_budgetaires, secteurs, statistiques } = config || {};

  // Grouper les budgets par EPA
  const budgetsByEpa = {};
  annees_budgetaires?.forEach(b => {
    if (!budgetsByEpa[b.epa_nom]) budgetsByEpa[b.epa_nom] = [];
    budgetsByEpa[b.epa_nom].push(b);
  });

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-fade-in ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}

      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuration Système</h1>
        <p className="text-sm text-gray-500 mt-0.5">Paramètres globaux de la plateforme EPA-Budget</p>
      </div>

      {/* Stats système */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'EPA Actives', value: statistiques?.nb_epa || 0, icon: '🏛️', color: 'indigo' },
          { label: 'Utilisateurs Actifs', value: statistiques?.nb_utilisateurs_actifs || 0, icon: '👥', color: 'emerald' },
          { label: 'Engagements ce mois', value: statistiques?.nb_engagements_mois || 0, icon: '📄', color: 'blue' },
          { label: 'Actions aujourd\'hui', value: statistiques?.nb_actions_jour || 0, icon: '⚡', color: 'amber' },
        ].map((s, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">{s.icon}</span>
              <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            </div>
            <p className="text-3xl font-bold text-gray-900">{parseInt(s.value).toLocaleString('fr-FR')}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Années budgétaires */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-800">Gestion des Années Budgétaires</h2>
            <p className="text-xs text-gray-400 mt-0.5">Activez, approuvez ou clôturez les budgets par EPA</p>
          </div>
          <div className="divide-y divide-gray-50">
            {Object.keys(budgetsByEpa).length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">Aucun budget créé</p>
            )}
            {Object.entries(budgetsByEpa).map(([epanom, budgets]) => (
              <div key={epanom} className="px-5 py-3">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">{epanom}</p>
                <div className="space-y-2">
                  {budgets.map(b => {
                    const info = STATUT_BUDGET_LABELS[b.statut] || { label: b.statut, color: 'bg-gray-100 text-gray-600' };
                    return (
                      <div key={b.id} className="flex items-center justify-between bg-gray-50 rounded-lg px-3 py-2">
                        <div className="flex items-center gap-3">
                          <span className="font-mono font-bold text-gray-700 text-sm">{b.annee}</span>
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${info.color}`}>{info.label}</span>
                          <span className="text-xs text-gray-400">
                            {new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'XAF', maximumFractionDigits: 0 }).format(b.montant_previsionnel)} prévisionnel
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          {b.statut === 'preparation' && (
                            <button
                              onClick={() => handleStatutBudget(b, 'approuve')}
                              disabled={updatingBudget === b.id}
                              className="px-2.5 py-1 bg-blue-100 text-blue-700 hover:bg-blue-200 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >Approuver</button>
                          )}
                          {(b.statut === 'approuve' || b.statut === 'preparation') && (
                            <button
                              onClick={() => handleStatutBudget(b, 'actif')}
                              disabled={updatingBudget === b.id}
                              className="px-2.5 py-1 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >Activer</button>
                          )}
                          {b.statut === 'actif' && (
                            <button
                              onClick={() => handleStatutBudget(b, 'cloture')}
                              disabled={updatingBudget === b.id}
                              className="px-2.5 py-1 bg-slate-100 text-slate-600 hover:bg-slate-200 text-xs font-medium rounded-lg transition-colors disabled:opacity-50"
                            >Clôturer</button>
                          )}
                          {b.statut === 'cloture' && (
                            <span className="text-xs text-gray-400 italic">Finalisé</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Panel droit */}
        <div className="space-y-4">
          {/* Secteurs disponibles */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Secteurs EPA</h2>
            </div>
            <div className="p-4">
              {secteurs?.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-2">Aucun secteur défini</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {secteurs?.map(s => (
                    <span key={s} className="px-3 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">{s}</span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Informations application */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="px-4 py-3 border-b border-gray-100">
              <h2 className="text-sm font-semibold text-gray-800">Informations Système</h2>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Application', value: 'EPA Budget v2.0' },
                { label: 'Environnement', value: process.env.NODE_ENV || 'development' },
                { label: 'Exercice courant', value: new Date().getFullYear().toString() },
                { label: 'Fuseau horaire', value: 'Africa/Brazzaville (UTC+1)' },
                { label: 'Dernière mise à jour', value: '25 avril 2026' },
              ].map((item, i) => (
                <div key={i} className="flex justify-between items-center py-1 border-b border-gray-50 last:border-0">
                  <span className="text-xs text-gray-500">{item.label}</span>
                  <span className="text-xs font-semibold text-gray-800">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Workflow par défaut */}
          <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4">
            <h3 className="text-xs font-semibold text-indigo-800 mb-2">Circuit de Validation</h3>
            <div className="space-y-1.5">
              {[
                { step: '1', label: 'Chef de Service', action: 'Initie la demande' },
                { step: '2', label: 'DAF', action: 'Valide et transmet' },
                { step: '3', label: 'Contrôleur', action: 'Émet l\'avis' },
                { step: '4', label: 'DG', action: 'Approuve ou rejette' },
                { step: '5', label: 'Comptable', action: 'Liquide et paye' },
              ].map((s) => (
                <div key={s.step} className="flex items-center gap-2">
                  <span className="w-5 h-5 bg-indigo-600 text-white text-[10px] font-bold rounded-full flex items-center justify-center flex-shrink-0">{s.step}</span>
                  <div>
                    <span className="text-xs font-semibold text-indigo-900">{s.label}</span>
                    <span className="text-[10px] text-indigo-500 ml-1">— {s.action}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
