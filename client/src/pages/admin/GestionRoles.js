import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const PERM_LABELS = {
  valider_budget: 'Valider le budget',
  valider_engagement: 'Valider les engagements',
  consulter_rapports: 'Consulter les rapports',
  compte_administratif: 'Accès compte administratif',
  compte_gestion: 'Accès compte de gestion',
  creer_budget: 'Créer le budget',
  modifier_budget: 'Modifier le budget',
  liquider_depense: 'Liquider les dépenses',
  emettre_avis: 'Émettre des avis',
  valider_liquidation: 'Valider les liquidations',
  enregistrer_recette: 'Enregistrer les recettes',
  enregistrer_paiement: 'Enregistrer les paiements',
  initier_engagement: 'Initier des engagements',
  consulter_budget: 'Consulter le budget',
  gerer_utilisateurs: 'Gérer les utilisateurs',
  gerer_roles: 'Gérer les rôles',
  gerer_epa: 'Gérer les EPA',
  voir_journal_global: 'Voir le journal global',
  configurer_systeme: 'Configurer le système',
};

const ROLE_COLORS = {
  DG: { bg: 'bg-purple-50', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-700', dot: 'bg-purple-500' },
  DAF: { bg: 'bg-blue-50', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-700', dot: 'bg-blue-500' },
  CONTROLEUR: { bg: 'bg-amber-50', border: 'border-amber-200', badge: 'bg-amber-100 text-amber-700', dot: 'bg-amber-500' },
  COMPTABLE: { bg: 'bg-emerald-50', border: 'border-emerald-200', badge: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  SERVICE: { bg: 'bg-cyan-50', border: 'border-cyan-200', badge: 'bg-cyan-100 text-cyan-700', dot: 'bg-cyan-500' },
  TUTELLE: { bg: 'bg-rose-50', border: 'border-rose-200', badge: 'bg-rose-100 text-rose-700', dot: 'bg-rose-500' },
  CCDB: { bg: 'bg-slate-50', border: 'border-slate-200', badge: 'bg-slate-100 text-slate-700', dot: 'bg-slate-500' },
  ADMIN: { bg: 'bg-red-50', border: 'border-red-200', badge: 'bg-red-100 text-red-700', dot: 'bg-red-500' },
};

const ROLE_DESC = {
  DG: 'Ordonnateur principal — Valide les engagements et approuve le budget annuel. Dernière étape du circuit de validation.',
  DAF: 'Gestionnaire budgétaire — Crée et modifie le budget, transmet les engagements au Contrôleur, liquide les dépenses.',
  CONTROLEUR: 'Contrôleur Budgétaire — Émet des avis favorables ou défavorables sur les engagements. Étape intermédiaire obligatoire.',
  COMPTABLE: 'Agent Comptable — Enregistre les recettes et paiements, valide les liquidations. Gère la clôture budgétaire.',
  SERVICE: 'Chef de Service — Initie les demandes d\'engagement, uploade les pièces justificatives et émet les PV de réception.',
  TUTELLE: 'Ministère de Tutelle — Vue consolidée multi-EPA, approbation des modificatifs budgétaires, rapports sectoriels.',
  CCDB: 'Chambre des Comptes — Piste d\'audit complète, timeline des engagements, export pour audit externe.',
  ADMIN: 'Super-Administrateur — Gestion globale de la plateforme : EPA, utilisateurs, configuration système.',
};

export default function GestionRoles() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get('/admin/roles')
      .then(res => { setRoles(res.data); if (res.data.length > 0) setSelected(res.data[0]); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Rôles & Permissions</h1>
        <p className="text-sm text-gray-500 mt-0.5">Visualisation des droits d'accès de chaque acteur dans la plateforme</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Liste des rôles */}
        <div className="space-y-2">
          {roles.map(role => {
            const colors = ROLE_COLORS[role.code] || ROLE_COLORS.ADMIN;
            const isSelected = selected?.id === role.id;
            return (
              <button
                key={role.id}
                onClick={() => setSelected(role)}
                className={`w-full text-left px-4 py-3.5 rounded-xl border-2 transition-all ${isSelected ? `${colors.bg} ${colors.border}` : 'bg-white border-gray-200 hover:border-gray-300'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className={`w-2.5 h-2.5 rounded-full ${colors.dot}`}></div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{role.nom}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${colors.badge}`}>{role.code}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-800">{role.nb_actifs}</p>
                    <p className="text-[10px] text-gray-400">actifs / {role.nb_utilisateurs}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Détail du rôle sélectionné */}
        {selected && (
          <div className="lg:col-span-2 space-y-4">
            {/* En-tête rôle */}
            {(() => {
              const colors = ROLE_COLORS[selected.code] || ROLE_COLORS.ADMIN;
              return (
                <div className={`${colors.bg} border ${colors.border} rounded-xl p-5`}>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <span className={`inline-block px-2.5 py-1 rounded-lg text-xs font-bold mb-2 ${colors.badge}`}>{selected.code}</span>
                      <h2 className="text-xl font-bold text-gray-900">{selected.nom}</h2>
                    </div>
                    <div className="text-center px-4 py-2 bg-white rounded-lg border border-gray-200">
                      <p className="text-2xl font-bold text-gray-900">{selected.nb_utilisateurs}</p>
                      <p className="text-[10px] text-gray-500">utilisateurs</p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">{ROLE_DESC[selected.code] || selected.description}</p>
                </div>
              );
            })()}

            {/* Permissions */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="px-5 py-3.5 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">Permissions assignées</h3>
              </div>
              <div className="p-5">
                {!selected.permissions || Object.keys(selected.permissions).length === 0 ? (
                  <p className="text-sm text-gray-400 text-center py-4">Aucune permission spécifique définie</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {Object.entries(selected.permissions).map(([key, value]) => (
                      <div key={key} className={`flex items-center gap-2.5 px-3 py-2 rounded-lg ${value ? 'bg-emerald-50' : 'bg-red-50'}`}>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${value ? 'bg-emerald-500' : 'bg-red-400'}`}>
                          {value
                            ? <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                            : <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" /></svg>
                          }
                        </div>
                        <span className={`text-xs font-medium ${value ? 'text-emerald-700' : 'text-red-600'}`}>
                          {PERM_LABELS[key] || key}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Circuit de validation */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Circuit de validation budgétaire</h3>
              <div className="flex items-center gap-1 flex-wrap">
                {['SERVICE', 'DAF', 'CONTROLEUR', 'DG'].map((r, i) => {
                  const colors = ROLE_COLORS[r] || {};
                  const isCurrentRole = r === selected.code;
                  return (
                    <React.Fragment key={r}>
                      <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${isCurrentRole ? `${colors.bg} ${colors.badge} ring-2 ring-current scale-110` : 'bg-gray-100 text-gray-500'}`}>
                        {r}
                      </div>
                      {i < 3 && <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>}
                    </React.Fragment>
                  );
                })}
                <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${selected.code === 'COMPTABLE' ? `${ROLE_COLORS.COMPTABLE.bg} ${ROLE_COLORS.COMPTABLE.badge} ring-2 ring-current scale-110` : 'bg-gray-100 text-gray-500'}`}>
                  COMPTABLE
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Le circuit complet est : Chef de Service → DAF → Contrôleur Budgétaire → DG → Agent Comptable (liquidation/paiement)</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
