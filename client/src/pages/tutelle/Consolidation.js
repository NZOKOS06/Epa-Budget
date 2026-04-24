import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Card, Button, LoadingSpinner, KPICard, Heatmap } from '../../components/ui';

export default function TutelleConsolidation() {
  const [data, setData] = useState({
    execution: 0,
    plafond: 0,
    programmes: [],
  });
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get('/tutelle/consolidation');
      setData(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      // Données de démo
      setData({
        execution: 78,
        plafond: 2500000000,
        programmes: [
          { label: 'Prog 01', percentage: 100, used: 50000000, total: 50000000 },
          { label: 'Prog 02', percentage: 85, used: 42500000, total: 50000000 },
          { label: 'Prog 03', percentage: 62, used: 31000000, total: 50000000 },
        ],
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  if (loading) {
    return <LoadingSpinner message="Chargement de la consolidation..." />;
  }

  // Icônes pour KPIs
  const ExecutionIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const PlafondIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Consolidation ACPCE</h1>
          <p className="text-gray-600 mt-1">Vue consolidée de l'exécution budgétaire</p>
        </div>
        <Button>
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exporter
        </Button>
      </div>

      {/* KPI unique */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="Exécution Globale"
          value={`${data.execution}%`}
          subtitle={`Budget consolidé ACPCE 2026`}
          icon={<ExecutionIcon />}
          color="primary"
        />
        <KPICard
          title="Plafond Budget"
          value={formatMontant(data.plafond)}
          subtitle="Plafond autorisé"
          icon={<PlafondIcon />}
          color="success"
        />
      </div>

      {/* Heatmap Programmes */}
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">État d'Exécution par Programme</h2>
          <p className="text-sm text-gray-600 mt-1">
            Programme 01 (rouge) : Budget totalement consommé
          </p>
        </div>
        <Heatmap data={data.programmes || []} />
      </Card>
    </div>
  );
}
