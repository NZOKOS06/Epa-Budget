import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';

// Icônes fonctionnelles par rôle
const IconDashboard = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
  </svg>
);

const IconSessions = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const IconRapport = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconApprobation = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconBudget = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const IconFile = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
  </svg>
);

const IconChecklist = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);

const IconAlert = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const IconJournal = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
  </svg>
);

const IconTresorerie = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
  </svg>
);

const IconComptes = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconProgramme = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
  </svg>
);

const IconEngagement = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const IconModificatif = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
  </svg>
);

const IconReception = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
  </svg>
);

const IconIndicateur = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
  </svg>
);

const IconWorkflow = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
  </svg>
);

const IconPerformance = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
  </svg>
);

const IconAudit = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

const IconBuilding = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
  </svg>
);

const IconUsers = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const IconShield = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const IconSettings = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} />
  </svg>
);

const IconActivityLog = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
  </svg>
);

const IconNotifications = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const IconLogout = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const IconMenu = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const IconClose = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const menuItemsByRole = {
  DG: [
    { text: 'Dashboard Exécutif', path: '/dg/dashboard', icon: <IconDashboard /> },
    { text: 'Sessions', path: '/dg/sessions', icon: <IconSessions /> },
    { text: 'Rapports Tutelle', path: '/dg/rapports-tutelle', icon: <IconRapport /> },
    { text: 'Approbations Stratégiques', path: '/dg/approbations', icon: <IconApprobation /> },
  ],
  DAF: [
    { text: 'Budget-Programme', path: '/daf/programmes', icon: <IconProgramme /> },
    { text: 'Lignes Budgétaires', path: '/daf/lignes-budgetaires', icon: <IconBudget /> },
    { text: 'Engagements', path: '/daf/engagements', icon: <IconEngagement /> },
    { text: 'Modificatifs', path: '/daf/modificatifs', icon: <IconModificatif /> },
    { text: 'Rapports Internes', path: '/daf/rapports-internes', icon: <IconRapport /> },
  ],
  CONTROLEUR: [
    { text: 'File Visas', path: '/controleur/file-visas', icon: <IconFile /> },
    { text: 'Checklist Visa', path: '/controleur/checklist', icon: <IconChecklist /> },
    { text: 'Alertes Dérive', path: '/controleur/alertes-derive', icon: <IconAlert /> },
    { text: 'Journal Contrôles', path: '/controleur/journal-controles', icon: <IconJournal /> },
  ],
  COMPTABLE: [
    { text: 'Contrôle Régularité', path: '/comptable/controle-regularite', icon: <IconChecklist /> },
    { text: 'Recettes', path: '/comptable/recettes', icon: <IconBudget /> },
    { text: 'Clôture', path: '/comptable/cloture', icon: <IconComptes /> },
    { text: 'Trésorerie', path: '/comptable/tresorerie', icon: <IconTresorerie /> },
    { text: 'Comptes Annuels', path: '/comptable/comptes-annuels', icon: <IconComptes /> },
  ],
  SERVICE: [
    { text: 'Actions Programme', path: '/services/programmes', icon: <IconProgramme /> },
    { text: 'Demandes Engagements', path: '/services/demandes-engagements', icon: <IconEngagement /> },
    { text: 'Réceptions', path: '/services/receptions', icon: <IconReception /> },
    { text: 'Indicateurs', path: '/services/indicateurs', icon: <IconIndicateur /> },
  ],
  TUTELLE: [
    { text: 'Consolidation Multi-EPA', path: '/tutelle/consolidation', icon: <IconDashboard /> },
    { text: 'Workflow Approbation', path: '/tutelle/workflow-approbation', icon: <IconWorkflow /> },
    { text: 'Performance Programmes', path: '/tutelle/performance-programmes', icon: <IconPerformance /> },
    { text: 'Rapports Sectoriels', path: '/tutelle/rapports-sectoriels', icon: <IconRapport /> },
  ],
  CCDB: [
    { text: 'Piste Audit', path: '/ccdb/piste-audit', icon: <IconAudit /> },
    { text: 'Comptes Annuels', path: '/ccdb/comptes-annuels', icon: <IconComptes /> },
  ],
  ADMIN: [
    { text: 'Tableau de Bord', path: '/admin/dashboard', icon: <IconDashboard /> },
    { text: 'Gestion des EPA', path: '/admin/epa', icon: <IconBuilding /> },
    { text: 'Utilisateurs', path: '/admin/utilisateurs', icon: <IconUsers /> },
    { text: 'Rôles & Permissions', path: '/admin/roles', icon: <IconShield /> },
    { text: 'Configuration', path: '/admin/configuration', icon: <IconSettings /> },
    { text: "Journal d'Activité", path: '/admin/journal', icon: <IconActivityLog /> },
  ],
};

export default function Layout({ children }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const user = authService.getCurrentUser();
  const menuItems = menuItemsByRole[user?.role] || [];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  const isAdmin = user?.role === 'ADMIN';

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-shrink-0 transition-all duration-300 ease-in-out">
        <div className={`flex flex-col w-64 text-white border-r shadow-xl ${isAdmin ? 'bg-indigo-950 border-indigo-900' : 'bg-slate-900 border-slate-800'}`}>
          {/* Logo */}
          <div className={`flex items-center h-16 px-5 border-b ${isAdmin ? 'border-indigo-800 bg-indigo-900' : 'border-slate-800 bg-slate-950'}`}>
            <div className={`w-8 h-8 rounded flex items-center justify-center mr-3 ${isAdmin ? 'bg-white/20' : 'bg-primary-600'}`}>
              <span className="text-white font-bold text-sm">{isAdmin ? 'AD' : 'EB'}</span>
            </div>
            <div>
              <h1 className="text-sm font-semibold text-white leading-tight">EPA Budget</h1>
              <p className={`text-[10px] uppercase tracking-wider ${isAdmin ? 'text-indigo-300' : 'text-slate-400'}`}>
                {isAdmin ? 'Administration' : 'Gestion Budgétaire'}
              </p>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              const activeClass = isAdmin
                ? 'bg-indigo-800 text-white'
                : 'bg-slate-800 text-white';
              const inactiveClass = isAdmin
                ? 'text-indigo-300 hover:bg-indigo-800 hover:text-white hover:pl-4'
                : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:pl-4';
              const iconActive = isAdmin ? 'text-indigo-300' : 'text-primary-400';
              const iconInactive = isAdmin ? 'text-indigo-500 group-hover:text-white' : 'text-slate-500 group-hover:text-white';
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-out ${
                    isActive ? activeClass : inactiveClass
                  }`}
                >
                  <span className={`mr-3 transition-transform duration-200 group-hover:translate-x-0.5 ${isActive ? iconActive : iconInactive}`}>{item.icon}</span>
                  <span className="flex-1 text-left">{item.text}</span>
                  {isActive && (
                    <div className={`w-1.5 h-1.5 rounded-full ${isAdmin ? 'bg-indigo-400' : 'bg-primary-400'}`}></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Info Footer */}
          <div className={`p-4 border-t ${isAdmin ? 'border-indigo-800' : 'border-slate-800'}`}>
            <div className="flex items-center space-x-3">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-medium text-xs ${isAdmin ? 'bg-indigo-700' : 'bg-slate-700'}`}>
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <p className={`text-xs truncate ${isAdmin ? 'text-indigo-300' : 'text-slate-400'}`}>{user?.role_nom}</p>
              </div>
            </div>
            {isAdmin && (
              <div className="mt-2 px-2 py-1 bg-indigo-800/60 rounded-md">
                <p className="text-[10px] text-indigo-300 text-center font-semibold tracking-widest uppercase">⚡ Super Admin</p>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={handleDrawerToggle}></div>
          <div className={`fixed inset-y-0 left-0 w-64 text-white border-r ${isAdmin ? 'bg-indigo-950 border-indigo-900' : 'bg-slate-900 border-slate-800'}`}>
            <div className={`flex items-center justify-between h-16 px-5 border-b ${isAdmin ? 'border-indigo-800 bg-indigo-900' : 'border-slate-800 bg-slate-950'}`}>
              <div className="flex items-center">
                <div className={`w-8 h-8 rounded flex items-center justify-center mr-3 ${isAdmin ? 'bg-white/20' : 'bg-primary-600'}`}>
                  <span className="text-white font-bold text-sm">{isAdmin ? 'AD' : 'EB'}</span>
                </div>
                <span className="text-sm font-semibold">EPA Budget</span>
              </div>
              <button
                onClick={handleDrawerToggle}
                className="text-slate-400 hover:text-white p-1.5 rounded transition-colors"
              >
                <IconClose />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileOpen(false);
                    }}
                    className={`w-full group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-all duration-200 ease-out ${
                      isActive
                        ? 'bg-slate-800 text-white'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white hover:pl-4'
                    }`}
                  >
                    <span className={`mr-3 transition-transform duration-200 group-hover:translate-x-0.5 ${isActive ? 'text-primary-400' : 'text-slate-500 group-hover:text-white'}`}>{item.icon}</span>
                    <span className="flex-1 text-left">{item.text}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 z-10">
          <div className="flex items-center justify-between h-14 px-4 lg:px-6">
            <div className="flex items-center space-x-3 flex-1">
              <button
                onClick={handleDrawerToggle}
                className="lg:hidden p-2 rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors"
              >
                <IconMenu />
              </button>
              <h2 className="text-sm font-semibold text-gray-700">
                {user?.role_nom || 'Application EPA'}
              </h2>
            </div>

            <div className="flex items-center space-x-2">
              {/* Notifications */}
              <button className="relative p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
                <IconNotifications />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-danger-500 rounded-full"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1 rounded-md hover:bg-gray-100 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-medium text-xs">
                    {user?.prenom?.[0]}{user?.nom?.[0]}
                  </div>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-1.5 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20 animate-fade-in">
                      <div className="px-3 py-2 border-b border-gray-100">
                        <p className="text-sm font-medium text-gray-900">
                          {user?.prenom} {user?.nom}
                        </p>
                        <p className="text-xs text-gray-500">{user?.email}</p>
                        <p className="text-xs text-primary-600 mt-0.5">{user?.role_nom}</p>
                      </div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 hover:text-danger-600 transition-colors"
                      >
                        <span className="mr-2"><IconLogout /></span>
                        <span>Déconnexion</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 lg:p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
