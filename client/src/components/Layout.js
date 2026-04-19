import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authService } from '../services/auth';

// Icônes SVG pour remplacer Material-UI
const DashboardIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
  </svg>
);

const NotificationsIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
  </svg>
);

const LogoutIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
  </svg>
);

const MenuIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

const CloseIcon = () => (
  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
  </svg>
);

const menuItemsByRole = {
  DG: [
    { text: 'Dashboard Exécutif', path: '/dg/dashboard', icon: <DashboardIcon /> },
    { text: 'Sessions', path: '/dg/sessions', icon: <DashboardIcon /> },
    { text: 'Rapports Tutelle', path: '/dg/rapports-tutelle', icon: <DashboardIcon /> },
    { text: 'Approbations Stratégiques', path: '/dg/approbations', icon: <DashboardIcon /> },
  ],
  DAF: [
    { text: 'Budget-Programme', path: '/daf/programmes', icon: <DashboardIcon /> },
    { text: 'Lignes Budgétaires', path: '/daf/lignes-budgetaires', icon: <DashboardIcon /> },
    { text: 'Engagements', path: '/daf/engagements', icon: <DashboardIcon /> },
    { text: 'Modificatifs', path: '/daf/modificatifs', icon: <DashboardIcon /> },
    { text: 'Rapports Internes', path: '/daf/rapports-internes', icon: <DashboardIcon /> },
  ],
  CONTROLEUR: [
    { text: 'File Visas', path: '/controleur/file-visas', icon: <DashboardIcon /> },
    { text: 'Checklist Visa', path: '/controleur/checklist', icon: <DashboardIcon /> },
    { text: 'Alertes Dérive', path: '/controleur/alertes-derive', icon: <DashboardIcon /> },
    { text: 'Journal Contrôles', path: '/controleur/journal-controles', icon: <DashboardIcon /> },
  ],
  COMPTABLE: [
    { text: 'Contrôle Régularité', path: '/comptable/controle-regularite', icon: <DashboardIcon /> },
    { text: 'Recettes', path: '/comptable/recettes', icon: <DashboardIcon /> },
    { text: 'Clôture', path: '/comptable/cloture', icon: <DashboardIcon /> },
    { text: 'Trésorerie', path: '/comptable/tresorerie', icon: <DashboardIcon /> },
    { text: 'Comptes Annuels', path: '/comptable/comptes-annuels', icon: <DashboardIcon /> },
  ],
  SERVICE: [
    { text: 'Actions Programme', path: '/services/programmes', icon: <DashboardIcon /> },
    { text: 'Demandes Engagements', path: '/services/demandes-engagements', icon: <DashboardIcon /> },
    { text: 'Réceptions', path: '/services/receptions', icon: <DashboardIcon /> },
    { text: 'Indicateurs', path: '/services/indicateurs', icon: <DashboardIcon /> },
  ],
  TUTELLE: [
    { text: 'Consolidation Multi-EPA', path: '/tutelle/consolidation', icon: <DashboardIcon /> },
    { text: 'Workflow Approbation', path: '/tutelle/workflow-approbation', icon: <DashboardIcon /> },
    { text: 'Performance Programmes', path: '/tutelle/performance-programmes', icon: <DashboardIcon /> },
    { text: 'Rapports Sectoriels', path: '/tutelle/rapports-sectoriels', icon: <DashboardIcon /> },
  ],
  CCDB: [
    { text: 'Piste Audit', path: '/ccdb/piste-audit', icon: <DashboardIcon /> },
    { text: 'Comptes Annuels', path: '/ccdb/comptes-annuels', icon: <DashboardIcon /> },
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

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar Desktop */}
      <aside className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl border-r border-slate-700">
          {/* Logo */}
          <div className="flex items-center justify-center h-20 px-4 bg-gradient-to-r from-primary-600 to-primary-700 border-b border-slate-700 shadow-lg">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-md">
                <span className="text-primary-600 font-bold text-xl">EB</span>
              </div>
              <div>
                <h1 className="text-lg font-bold text-white leading-tight">EPA Budget</h1>
                <p className="text-xs text-primary-100">Gestion Budgétaire</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto custom-scrollbar">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => navigate(item.path)}
                  className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg shadow-primary-500/30'
                      : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                  }`}
                >
                  <span className={`mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`}>{item.icon}</span>
                  <span className="flex-1 text-left">{item.text}</span>
                  {isActive && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full"></div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* User Info Footer */}
          <div className="p-4 border-t border-slate-700 bg-slate-800/50">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm shadow-lg ring-2 ring-slate-700">
                {user?.prenom?.[0]}{user?.nom?.[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">
                  {user?.prenom} {user?.nom}
                </p>
                <p className="text-xs text-slate-400 truncate">{user?.role_nom}</p>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Sidebar Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleDrawerToggle}></div>
          <div className="fixed inset-y-0 left-0 w-64 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white shadow-2xl transform transition-transform duration-300 ease-in-out">
            <div className="flex items-center justify-between h-20 px-4 bg-gradient-to-r from-primary-600 to-primary-700 border-b border-slate-700">
              <h1 className="text-lg font-bold">EPA Budget</h1>
              <button 
                onClick={handleDrawerToggle} 
                className="text-white hover:bg-white/20 p-2 rounded-lg transition-colors"
              >
                <CloseIcon />
              </button>
            </div>
            <nav className="flex-1 px-3 py-6 space-y-1 overflow-y-auto">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <button
                    key={item.path}
                    onClick={() => {
                      navigate(item.path);
                      setMobileOpen(false);
                    }}
                    className={`w-full flex items-center px-4 py-3 text-sm font-medium rounded-lg transition-all duration-200 ${
                      isActive
                        ? 'bg-gradient-to-r from-primary-600 to-primary-700 text-white shadow-lg'
                        : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                    }`}
                  >
                    <span className="mr-3">{item.icon}</span>
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
        <header className="bg-white shadow-sm border-b border-gray-200 z-10 backdrop-blur-sm bg-white/95">
          <div className="flex items-center justify-between h-16 px-4 lg:px-8">
            <div className="flex items-center space-x-4 flex-1">
            <button
              onClick={handleDrawerToggle}
                className="lg:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-100 hover:text-primary-600 transition-all duration-200"
            >
              <MenuIcon />
            </button>
              <h2 className="text-lg font-semibold text-gray-800 lg:ml-0 ml-4">
              {user?.role_nom || 'Application EPA'}
            </h2>
            </div>

            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <button className="relative p-2.5 text-gray-600 hover:text-primary-600 hover:bg-primary-50 rounded-xl transition-all duration-200 group">
                <NotificationsIcon />
                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-danger-500 rounded-full ring-2 ring-white"></span>
              </button>

              {/* User Menu */}
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center space-x-2 p-1.5 rounded-xl hover:bg-gray-100 transition-all duration-200 ring-2 ring-transparent hover:ring-primary-100"
                >
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-500 to-secondary-500 flex items-center justify-center text-white font-semibold text-sm shadow-md">
                    {user?.prenom?.[0]}{user?.nom?.[0]}
                  </div>
                </button>

                {userMenuOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setUserMenuOpen(false)}
                    ></div>
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-20 animate-fade-in overflow-hidden">
                      <div className="px-4 py-3 border-b border-gray-100 bg-gradient-to-r from-primary-50 to-secondary-50">
                        <p className="text-sm font-semibold text-gray-900">
                          {user?.prenom} {user?.nom}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{user?.email}</p>
                        <p className="text-xs text-primary-600 mt-1 font-medium">{user?.role_nom}</p>
                      </div>
                      <button
                        onClick={() => {
                          setUserMenuOpen(false);
                          handleLogout();
                        }}
                        className="w-full flex items-center px-4 py-3 text-sm text-gray-700 hover:bg-danger-50 hover:text-danger-600 transition-colors group"
                      >
                        <span className="mr-3"><LogoutIcon /></span>
                        <span className="font-medium">Déconnexion</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
