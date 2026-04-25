import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, Button, LoadingSpinner, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, KPICard, LineChart } from '../../components/ui';

export default function ComptableTresorerie() {
  const [data, setData] = useState({
    soldes: [],
    planFlux: [],
    engagements: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/comptable/tresorerie');
      setData(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      // Données de démo
      setData({
        soldes: [
          { compte: 'Compte Principal', solde: 450000000 },
          { compte: 'Compte Secondaire', solde: 50000000 },
        ],
        planFlux: [
          { mois: 'Nov', encaissements: 300000000, decaissements: 400000000 },
          { mois: 'Déc', encaissements: 350000000, decaissements: 450000000 },
          { mois: 'Jan', encaissements: 400000000, decaissements: 500000000 },
        ],
        engagements: 1200000000,
      });
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  if (loading) {
    return <LoadingSpinner message="Chargement de la trésorerie..." />;
  }

  const soldeTotal = data.soldes?.reduce((sum, compte) => sum + (compte.solde || 0), 0) || 0;

  // Icônes pour KPIs
  const SoldeIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  const EngagementIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Trésorerie</h1>
          <p className="text-gray-500 mt-1">Suivi des soldes et plan de trésorerie</p>
        </div>
        <Button>
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exporter
        </Button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="Solde Disponible"
          value={formatMontant(soldeTotal)}
          subtitle="Tous comptes confondus"
          icon={<SoldeIcon />}
          color="success"
        />
        <KPICard
          title="Engagements 90j"
          value={formatMontant(data.engagements || 0)}
          subtitle="Plan de flux sur 3 mois"
          icon={<EngagementIcon />}
          color="primary"
        />
      </div>

      {/* Soldes comptes */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Soldes par compte</h2>
          <p className="text-sm text-gray-500 mt-1">État actuel des comptes bancaires</p>
        </div>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableHead>Compte</TableHead>
              <TableHead className="text-right">Solde</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {data.soldes?.map((compte, index) => (
                <TableRow key={index} hover>
                  <TableCell>
                    <span className="font-medium text-gray-900">{compte.compte}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-semibold text-gray-900">
                      {formatMontant(compte.solde)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Voir détails
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Plan de flux 90 jours */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Plan de flux 90 jours</h2>
          <p className="text-sm text-gray-500 mt-1">Prévision des encaissements et décaissements</p>
        </div>
        <LineChart
          data={data.planFlux || []}
          xKey="mois"
          yKey="encaissements"
          height={300}
        />
      </Card>

      {/* Alertes */}
      {soldeTotal < 500000000 && (
        <Card className="bg-warning-50 border-warning-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
              <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-medium text-warning-900">Risque d'encaissement</p>
              <p className="text-xs text-warning-700 mt-1">
                Le solde disponible est en dessous du seuil recommandé. Surveillez les encaissements.
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
