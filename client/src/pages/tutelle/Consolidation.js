import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Card, Button, LoadingSpinner, KPICard, Heatmap, PageHeader } from '../../components/ui';

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
      {/* Header premium */}
      <PageHeader
        title="Consolidation ACPCE"
        subtitle="Vue consolidée de l'exécution budgétaire"
        kpis={[
          {
            label: 'Plafond global',
            value: formatMontant(data.plafond),
            sub: 'budget alloué',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          },
          {
            label: 'Exécution',
            value: formatMontant(data.execution),
            sub: `${data.plafond > 0 ? Math.round((data.execution / data.plafond) * 100) : 0}% du plafond`,
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
          },
          {
            label: 'Programmes',
            value: data.programmes.length,
            sub: 'actifs',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
          },
          {
            label: 'Reste à exécuter',
            value: formatMontant(Math.max(0, data.plafond - data.execution)),
            sub: 'disponible',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          },
        ]}
      >
        <Button className="shadow-md hover:shadow-lg">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Exporter
        </Button>
      </PageHeader>

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
          <p className="text-sm text-gray-500 mt-1">
            Programme 01 (rouge) : Budget totalement consommé
          </p>
        </div>
        <Heatmap data={data.programmes || []} />
      </Card>
    </div>
  );
}
