import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';

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

function genPassword() {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#!';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export default function GestionUtilisateurs() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [epas, setEpas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRole, setFilterRole] = useState('');
  const [filterEpa, setFilterEpa] = useState('');
  const [filterStatut, setFilterStatut] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editUser, setEditUser] = useState(null);
  const [resetData, setResetData] = useState(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [form, setForm] = useState({
    nom: '', prenom: '', email: '', role_id: '', epa_id: '', direction_id: '', mot_de_passe: ''
  });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterRole) params.role = filterRole;
      if (filterEpa) params.epa_id = filterEpa;
      if (filterStatut) params.statut = filterStatut;
      if (search) params.search = search;

      const [usersRes, rolesRes, epasRes] = await Promise.all([
        api.get('/admin/utilisateurs', { params }),
        api.get('/admin/roles'),
        api.get('/admin/epa'),
      ]);
      setUsers(usersRes.data);
      setRoles(rolesRes.data);
      setEpas(epasRes.data);
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur de chargement', 'error');
    } finally {
      setLoading(false);
    }
  }, [search, filterRole, filterEpa, filterStatut]);

  useEffect(() => { loadData(); }, [loadData]);

  const handleOpenForm = (user = null) => {
    setEditUser(user);
    if (user) {
      setForm({
        nom: user.nom, prenom: user.prenom, email: user.email,
        role_id: user.role_id || '', epa_id: user.epa_id || '',
        direction_id: user.direction_id || '', mot_de_passe: ''
      });
    } else {
      const pwd = genPassword();
      setForm({ nom: '', prenom: '', email: '', role_id: '', epa_id: '', direction_id: '', mot_de_passe: pwd });
    }
    setShowForm(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.nom || !form.prenom || !form.email || !form.role_id) return;
    try {
      setSaving(true);
      if (editUser) {
        await api.put(`/admin/utilisateurs/${editUser.id}`, form);
        showToast(`Utilisateur "${form.prenom} ${form.nom}" modifié`);
      } else {
        if (!form.mot_de_passe) return showToast('Mot de passe requis', 'error');
        await api.post('/admin/utilisateurs', form);
        showToast(`Utilisateur "${form.prenom} ${form.nom}" créé avec succès`);
      }
      setShowForm(false);
      loadData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatut = async (user) => {
    const nouveau = user.statut === 'actif' ? 'inactif' : 'actif';
    if (!window.confirm(`Voulez-vous ${nouveau === 'actif' ? 'activer' : 'désactiver'} "${user.prenom} ${user.nom}" ?`)) return;
    try {
      await api.patch(`/admin/utilisateurs/${user.id}/statut`, { statut: nouveau });
      showToast(`Compte ${nouveau === 'actif' ? 'activé' : 'désactivé'}`);
      loadData();
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur', 'error');
    }
  };

  const handleResetPassword = async (user) => {
    const nouveau = genPassword();
    if (!window.confirm(`Réinitialiser le mot de passe de "${user.prenom} ${user.nom}" ?`)) return;
    try {
      await api.post(`/admin/utilisateurs/${user.id}/reset-password`, { nouveau_mot_de_passe: nouveau });
      setResetData({ user, password: nouveau });
    } catch (e) {
      showToast(e.response?.data?.message || 'Erreur', 'error');
    }
  };

  const activeCount = users.filter(u => u.statut === 'actif').length;

  return (
    <div className="space-y-5">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-lg shadow-lg text-sm font-medium text-white animate-fade-in ${toast.type === 'error' ? 'bg-red-600' : 'bg-emerald-600'}`}>
          {toast.type === 'error' ? '✕' : '✓'} {toast.msg}
        </div>
      )}

      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestion des Utilisateurs</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {activeCount} actif{activeCount !== 1 ? 's' : ''} sur {users.length} utilisateur{users.length !== 1 ? 's' : ''}
          </p>
        </div>
        <button
          onClick={() => handleOpenForm()}
          className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
          Nouvel utilisateur
        </button>
      </div>

      {/* Filtres */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
          <input type="text" placeholder="Rechercher nom, email..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" />
        </div>
        <select value={filterRole} onChange={e => setFilterRole(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">Tous les rôles</option>
          {roles.map(r => <option key={r.code} value={r.code}>{r.nom}</option>)}
        </select>
        <select value={filterEpa} onChange={e => setFilterEpa(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">Toutes les EPA</option>
          {epas.map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
        </select>
        <select value={filterStatut} onChange={e => setFilterStatut(e.target.value)} className="px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
          <option value="">Tous les statuts</option>
          <option value="actif">Actifs</option>
          <option value="inactif">Inactifs</option>
        </select>
      </div>

      {/* Tableau */}
      {loading ? (
        <div className="flex items-center justify-center h-48"><div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>
      ) : (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Utilisateur</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Rôle</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">EPA</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Dernière connexion</th>
                <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Statut</th>
                <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wide">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {users.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-gray-400">Aucun utilisateur trouvé</td></tr>
              )}
              {users.map(user => (
                <tr key={user.id} className={`hover:bg-gray-50 transition-colors ${user.statut !== 'actif' ? 'opacity-60' : ''}`}>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-xs flex-shrink-0">
                        {user.prenom?.[0]}{user.nom?.[0]}
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{user.prenom} {user.nom}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${ROLE_COLORS[user.role_code] || 'bg-gray-100 text-gray-600'}`}>
                      {user.role_code}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-gray-600 text-sm">{user.epa_nom || <span className="text-gray-300 italic">—</span>}</td>
                  <td className="px-5 py-3 text-xs text-gray-500">
                    {user.derniere_connexion
                      ? new Date(user.derniere_connexion).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })
                      : <span className="text-gray-300">Jamais connecté</span>}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${user.statut === 'actif' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                      {user.statut === 'actif' ? 'Actif' : 'Inactif'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button onClick={() => handleOpenForm(user)} title="Modifier" className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>
                      </button>
                      <button onClick={() => handleResetPassword(user)} title="Réinitialiser mot de passe" className="p-1.5 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
                      </button>
                      <button
                        onClick={() => handleToggleStatut(user)}
                        title={user.statut === 'actif' ? 'Désactiver' : 'Activer'}
                        className={`p-1.5 rounded transition-colors ${user.statut === 'actif' ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' : 'text-gray-400 hover:text-emerald-600 hover:bg-emerald-50'}`}
                      >
                        {user.statut === 'actif'
                          ? <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" /></svg>
                          : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        }
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal Formulaire Utilisateur */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <h2 className="text-lg font-bold text-gray-900">{editUser ? 'Modifier l\'utilisateur' : 'Nouvel utilisateur'}</h2>
              <button onClick={() => setShowForm(false)} className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Prénom *</label>
                  <input type="text" value={form.prenom} onChange={e => setForm(f => ({ ...f, prenom: e.target.value }))} placeholder="ex: Jean-Pierre" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Nom *</label>
                  <input type="text" value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))} placeholder="ex: MOUKANGA" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Adresse Email *</label>
                <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="ex: j.moukanga@dgtt.cg" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Rôle *</label>
                  <select value={form.role_id} onChange={e => setForm(f => ({ ...f, role_id: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white" required>
                    <option value="">Sélectionner un rôle...</option>
                    {roles.map(r => <option key={r.id} value={r.id}>{r.nom} ({r.code})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">EPA</label>
                  <select value={form.epa_id} onChange={e => setForm(f => ({ ...f, epa_id: e.target.value }))} className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white">
                    <option value="">Aucune (Tutelle/CCDB/Admin)</option>
                    {epas.filter(e => (e.statut || 'actif') === 'actif').map(e => <option key={e.id} value={e.id}>{e.nom}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-1.5">Direction / Service (optionnel)</label>
                <input type="text" value={form.direction_id} onChange={e => setForm(f => ({ ...f, direction_id: e.target.value }))} placeholder="ex: Direction Financière" className="w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>
              {!editUser && (
                <div>
                  <label className="block text-xs font-semibold text-gray-600 mb-1.5">Mot de passe initial *</label>
                  <div className="flex gap-2">
                    <input type="text" value={form.mot_de_passe} onChange={e => setForm(f => ({ ...f, mot_de_passe: e.target.value }))} className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    <button type="button" onClick={() => setForm(f => ({ ...f, mot_de_passe: genPassword() }))} className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-600 rounded-lg text-xs font-medium transition-colors" title="Générer un nouveau MDP">
                      ↻ Générer
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-600 mt-1">⚠ Communiquez ce mot de passe à l'utilisateur de façon sécurisée</p>
                </div>
              )}
              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">Annuler</button>
                <button type="submit" disabled={saving} className="px-5 py-2 bg-indigo-600 text-white text-sm font-semibold rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-60">
                  {saving ? 'Enregistrement...' : editUser ? 'Modifier' : 'Créer l\'utilisateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal MDP Reset */}
      {resetData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
            <div className="text-center mb-4">
              <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" /></svg>
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-1">Mot de passe réinitialisé</h2>
              <p className="text-sm text-gray-500">Pour {resetData.user.prenom} {resetData.user.nom}</p>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <p className="text-xs text-amber-700 mb-2 font-semibold">Nouveau mot de passe temporaire :</p>
              <p className="font-mono text-lg font-bold text-amber-900 tracking-wider text-center">{resetData.password}</p>
            </div>
            <p className="text-xs text-red-600 text-center mb-4">⚠ Communiquez ce mot de passe de façon sécurisée. Il ne sera plus affiché.</p>
            <div className="flex gap-3">
              <button
                onClick={() => navigator.clipboard.writeText(resetData.password).then(() => showToast('Copié !'))}
                className="flex-1 px-4 py-2.5 bg-amber-100 text-amber-700 text-sm font-semibold rounded-lg hover:bg-amber-200 transition-colors"
              >
                📋 Copier
              </button>
              <button onClick={() => setResetData(null)} className="flex-1 px-4 py-2.5 bg-gray-900 text-white text-sm font-semibold rounded-lg hover:bg-gray-800 transition-colors">
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
