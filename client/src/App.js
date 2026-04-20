import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Login from './pages/Login';
import { authService } from './services/auth';

// Pages DG
import DGDashboard from './pages/dg/Dashboard';
import DGSessions from './pages/dg/Sessions';
import DGRapportsTutelle from './pages/dg/RapportsTutelle';
import DGApprobations from './pages/dg/Approbations';

// Pages DAF
import DAFProgrammes from './pages/daf/Programmes';
import DAFLignesBudgetaires from './pages/daf/LignesBudgetaires';
import DAFEngagements from './pages/daf/Engagements';
import DAFModificatifs from './pages/daf/Modificatifs';
import DAFRapportsInternes from './pages/daf/RapportsInternes';

// Pages Contrôleur
import ControleurFileVisas from './pages/controleur/FileVisas';
import ControleurChecklist from './pages/controleur/Checklist';
import ControleurAlertesDerive from './pages/controleur/AlertesDerive';
import ControleurJournalControles from './pages/controleur/JournalControles';

// Pages Comptable
import ComptableControleRegularite from './pages/comptable/ControleRegularite';
import ComptableRecettes from './pages/comptable/Recettes';
import ComptableCloture from './pages/comptable/Cloture';
import ComptableTresorerie from './pages/comptable/Tresorerie';
import ComptableComptesAnnuels from './pages/comptable/ComptesAnnuels';

// Pages Services
import ServicesProgrammes from './pages/services/Programmes';
import ServicesDemandesEngagements from './pages/services/DemandesEngagements';
import ServicesReceptions from './pages/services/Receptions';
import ServicesIndicateurs from './pages/services/Indicateurs';

// Pages Tutelle
import TutelleConsolidation from './pages/tutelle/Consolidation';
import TutelleWorkflowApprobation from './pages/tutelle/WorkflowApprobation';
import TutellePerformanceProgrammes from './pages/tutelle/PerformanceProgrammes';
import TutelleRapportsSectoriels from './pages/tutelle/RapportsSectoriels';

// Pages CCDB
import CCDBPisteAudit from './pages/ccdb/PisteAudit';
import CCDBComptesAnnuels from './pages/ccdb/ComptesAnnuels';

// Fonction utilitaire pour obtenir la route par défaut selon le rôle
const getDefaultPathForRole = (role) => {
  const rolePath = {
    DG: '/dg/dashboard',
    DAF: '/daf/programmes',
    CONTROLEUR: '/controleur/file-visas',
    COMPTABLE: '/comptable/controle-regularite',
    SERVICE: '/services/programmes',
    TUTELLE: '/tutelle/consolidation',
    CCDB: '/ccdb/piste-audit',
  };
  return rolePath[role] || '/login';
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  if (!authService.isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }
  return <Layout>{children}</Layout>;
};

function App() {
  return (
    <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Routes DG */}
          <Route
            path="/dg/dashboard"
            element={
              <ProtectedRoute>
                <DGDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dg/sessions"
            element={
              <ProtectedRoute>
                <DGSessions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dg/rapports-tutelle"
            element={
              <ProtectedRoute>
                <DGRapportsTutelle />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dg/approbations"
            element={
              <ProtectedRoute>
                <DGApprobations />
              </ProtectedRoute>
            }
          />

          {/* Routes DAF */}
          <Route
            path="/daf/programmes"
            element={
              <ProtectedRoute>
                <DAFProgrammes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/daf/lignes-budgetaires"
            element={
              <ProtectedRoute>
                <DAFLignesBudgetaires />
              </ProtectedRoute>
            }
          />
          <Route
            path="/daf/engagements"
            element={
              <ProtectedRoute>
                <DAFEngagements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/daf/modificatifs"
            element={
              <ProtectedRoute>
                <DAFModificatifs />
              </ProtectedRoute>
            }
          />
          <Route
            path="/daf/rapports-internes"
            element={
              <ProtectedRoute>
                <DAFRapportsInternes />
              </ProtectedRoute>
            }
          />

          {/* Routes Contrôleur */}
          <Route
            path="/controleur/file-visas"
            element={
              <ProtectedRoute>
                <ControleurFileVisas />
              </ProtectedRoute>
            }
          />
          <Route
            path="/controleur/checklist"
            element={
              <ProtectedRoute>
                <Navigate to="/controleur/file-visas" replace />
              </ProtectedRoute>
            }
          />
          <Route
            path="/controleur/checklist/:id"
            element={
              <ProtectedRoute>
                <ControleurChecklist />
              </ProtectedRoute>
            }
          />
          <Route
            path="/controleur/alertes-derive"
            element={
              <ProtectedRoute>
                <ControleurAlertesDerive />
              </ProtectedRoute>
            }
          />
          <Route
            path="/controleur/journal-controles"
            element={
              <ProtectedRoute>
                <ControleurJournalControles />
              </ProtectedRoute>
            }
          />

          {/* Routes Comptable */}
          <Route
            path="/comptable/controle-regularite"
            element={
              <ProtectedRoute>
                <ComptableControleRegularite />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comptable/recettes"
            element={
              <ProtectedRoute>
                <ComptableRecettes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comptable/cloture"
            element={
              <ProtectedRoute>
                <ComptableCloture />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comptable/tresorerie"
            element={
              <ProtectedRoute>
                <ComptableTresorerie />
              </ProtectedRoute>
            }
          />
          <Route
            path="/comptable/comptes-annuels"
            element={
              <ProtectedRoute>
                <ComptableComptesAnnuels />
              </ProtectedRoute>
            }
          />

          {/* Routes Services */}
          <Route
            path="/services/programmes"
            element={
              <ProtectedRoute>
                <ServicesProgrammes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/demandes-engagements"
            element={
              <ProtectedRoute>
                <ServicesDemandesEngagements />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/receptions"
            element={
              <ProtectedRoute>
                <ServicesReceptions />
              </ProtectedRoute>
            }
          />
          <Route
            path="/services/indicateurs"
            element={
              <ProtectedRoute>
                <ServicesIndicateurs />
              </ProtectedRoute>
            }
          />

          {/* Routes Tutelle */}
          <Route
            path="/tutelle/consolidation"
            element={
              <ProtectedRoute>
                <TutelleConsolidation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutelle/workflow-approbation"
            element={
              <ProtectedRoute>
                <TutelleWorkflowApprobation />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutelle/performance-programmes"
            element={
              <ProtectedRoute>
                <TutellePerformanceProgrammes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tutelle/rapports-sectoriels"
            element={
              <ProtectedRoute>
                <TutelleRapportsSectoriels />
              </ProtectedRoute>
            }
          />

          {/* Routes CCDB */}
          <Route
            path="/ccdb/piste-audit"
            element={
              <ProtectedRoute>
                <CCDBPisteAudit />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ccdb/comptes-annuels"
            element={
              <ProtectedRoute>
                <CCDBComptesAnnuels />
              </ProtectedRoute>
            }
          />

          {/* Route par défaut */}
          <Route
            path="/"
            element={
              <Navigate
                to={
                  authService.isAuthenticated()
                    ? getDefaultPathForRole(authService.getCurrentUser()?.role)
                    : '/login'
                }
                replace
              />
            }
          />
        </Routes>
      </Router>
  );
}

export default App;

