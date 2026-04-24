import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, KPICard, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, LineChart, BarChart, Badge, Select } from '../../components/ui';

export default function DGPerformance() {
  const [data, setData] = useState({
    indicateurs: [],
    evolution: [],
    programmes: [],
    comparaisons: []
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriode, setSelectedPeriode] = useState('12mois');
  const [selectedProgramme, setSelectedProgramme] = useState('tous');
  const [viewMode, setViewMode] = useState('tableau');

  const fetchData = useCallback(async () => {
    try {
      const response = await api.get('/dg/dashboard');
      
      // Préparer les données de performance
      const indicateurs = response.data.programmes?.map(prog => ({
        programme_code: prog.code,
        programme_libelle: prog.libelle,
        budget_initial: prog.budget_initial || 0,
        montant_engage: prog.montant_engage || 0,
        montant_paye: prog.montant_paye || 0,
        taux_engagement: prog.budget_initial > 0 ? Math.round((prog.montant_engage / prog.budget_initial) * 100) : 0,
        taux_execution: prog.budget_initial > 0 ? Math.round((prog.montant_paye / prog.budget_initial) * 100) : 0,
        taux_realisation: prog.montant_engage > 0 ? Math.round((prog.montant_paye / prog.montant_engage) * 100) : 0
      })) || [];

      setData({
        indicateurs,
        evolution: response.data.evolutionMensuelle || [],
        programmes: response.data.programmes || [],
        comparaisons: prepareComparaisons(response.data.programmes || [])
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const prepareComparaisons = (programmes) => {
    return programmes.map(prog => ({
      programme: prog.code,
      engagement: prog.montant_engage || 0,
      paiement: prog.montant_paye || 0,
      budget: prog.budget_initial || 0
    }));
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const getPerformanceColor = (taux) => {
    if (taux >= 90) return 'success';
    if (taux >= 70) return 'warning';
    if (taux >= 50) return 'orange';
    return 'danger';
  };

  const getPerformanceLabel = (taux) => {
    if (taux >= 90) return 'Excellent';
    if (taux >= 70) return 'Bon';
    if (taux >= 50) return 'Moyen';
    return 'Faible';
  };

  // Calculer les KPIs globaux
  const totalBudget = data.indicateurs.reduce((sum, ind) => sum + ind.budget_initial, 0);
  const totalEngage = data.indicateurs.reduce((sum, ind) => sum + ind.montant_engage, 0);
  const totalPaye = data.indicateurs.reduce((sum, ind) => sum + ind.montant_paye, 0);
  const tauxEngagementGlobal = totalBudget > 0 ? Math.round((totalEngage / totalBudget) * 100) : 0;
  const tauxExecutionGlobal = totalBudget > 0 ? Math.round((totalPaye / totalBudget) * 100) : 0;

  // Filtrer les données selon les sélections
  const filteredIndicateurs = selectedProgramme === 'tous' 
    ? data.indicateurs 
    : data.indicateurs.filter(ind => ind.programme_code === selectedProgramme);

  if (loading) {
    return <LoadingSpinner message="Chargement des indicateurs de performance..." />;
  }

  const TrendingUpIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
    </svg>
  );

  const TargetIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
    </svg>
  );

  const MoneyIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const EfficiencyIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Performance Budgétaire</h1>
          <p className="text-gray-600 mt-1">Analyse détaillée de l'exécution budgétaire par programme</p>
        </div>
        <div className="flex items-center space-x-3">
          <Select
            value={selectedProgramme}
            onChange={(e) => setSelectedProgramme(e.target.value)}
            className="w-48"
          >
            <option value="tous">Tous les programmes</option>
            {data.programmes.map((prog) => (
              <option key={prog.code} value={prog.code}>
                {prog.code} - {prog.libelle}
              </option>
            ))}
          </Select>
          <Button
            variant={viewMode === 'tableau' ? 'primary' : 'outline'}
            onClick={() => setViewMode('tableau')}
          >
            Tableau
          </Button>
          <Button
            variant={viewMode === 'graphique' ? 'primary' : 'outline'}
            onClick={() => setViewMode('graphique')}
          >
            Graphiques
          </Button>
        </div>
      </div>

      {/* KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Budget Total"
          value={formatMontant(totalBudget)}
          subtitle="Budget alloué total"
          icon={<TargetIcon />}
          color="primary"
        />
        <KPICard
          title="Taux d'Engagement"
          value={`${tauxEngagementGlobal}%`}
          subtitle={`${formatMontant(totalEngage)} engagé`}
          icon={<TrendingUpIcon />}
          color={getPerformanceColor(tauxEngagementGlobal)}
        />
        <KPICard
          title="Taux d'Exécution"
          value={`${tauxExecutionGlobal}%`}
          subtitle={`${formatMontant(totalPaye)} payé`}
          icon={<MoneyIcon />}
          color={getPerformanceColor(tauxExecutionGlobal)}
        />
        <KPICard
          title="Efficacité Globale"
          value={totalEngage > 0 ? `${Math.round((totalPaye / totalEngage) * 100)}%` : '0%'}
          subtitle="Ratio paiements/engagements"
          icon={<EfficiencyIcon />}
          color={totalEngage > 0 ? getPerformanceColor(Math.round((totalPaye / totalEngage) * 100)) : 'primary'}
        />
      </div>

      {viewMode === 'tableau' ? (
        /* Vue Tableau */
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Performance par Programme</h2>
            <p className="text-sm text-gray-600 mt-1">
              {filteredIndicateurs.length} programme(s) affiché(s)
            </p>
          </div>

          {filteredIndicateurs.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Programme</TableHead>
                  <TableHead className="text-right">Budget Initial</TableHead>
                  <TableHead className="text-right">Montant Engagé</TableHead>
                  <TableHead className="text-right">Montant Payé</TableHead>
                  <TableHead className="text-center">Taux Engagement</TableHead>
                  <TableHead className="text-center">Taux Exécution</TableHead>
                  <TableHead className="text-center">Taux Réalisation</TableHead>
                  <TableHead className="text-center">Performance</TableHead>
                </TableHeader>
                <TableBody>
                  {filteredIndicateurs.map((ind, idx) => (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <span className="font-bold text-gray-900 block">{ind.programme_code}</span>
                          <span className="text-sm text-gray-600 block truncate max-w-[200px]" title={ind.programme_libelle}>
                            {ind.programme_libelle}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatMontant(ind.budget_initial)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-primary-600">
                        {formatMontant(ind.montant_engage)}
                      </TableCell>
                      <TableCell className="text-right font-medium text-success-600">
                        {formatMontant(ind.montant_paye)}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPerformanceColor(ind.taux_engagement)}>
                          {ind.taux_engagement}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPerformanceColor(ind.taux_execution)}>
                          {ind.taux_execution}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPerformanceColor(ind.taux_realisation)}>
                          {ind.taux_realisation}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getPerformanceColor(ind.taux_execution)}>
                          {getPerformanceLabel(ind.taux_execution)}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              Aucune donnée disponible pour les filtres sélectionnés
            </div>
          )}
        </Card>
      ) : (
        /* Vue Graphiques */
        <div className="space-y-6">
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Comparaison Budget vs Réalisation</h2>
            </div>
            <div className="h-96">
              <BarChart
                data={filteredIndicateurs.map(ind => ({
                  name: ind.programme_code,
                  budget: ind.budget_initial,
                  engagement: ind.montant_engage,
                  paiement: ind.montant_paye
                }))}
                xKey="name"
                yKeys={['budget', 'engagement', 'paiement']}
                colors={['#3B82F6', '#10B981', '#F59E0B']}
                height={400}
              />
            </div>
          </Card>

          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Évolution des Taux d'Exécution</h2>
            </div>
            <div className="h-96">
              <LineChart
                data={data.evolution.map((item, index) => ({
                  name: format(new Date(item.mois), 'MMM yyyy', { locale: fr }),
                  montant: parseFloat(item.total_montant || 0),
                  taux: totalBudget > 0 ? Math.round((parseFloat(item.total_montant || 0) / totalBudget) * 100) : 0
                }))}
                xKey="name"
                yKey="taux"
                height={400}
              />
            </div>
          </Card>
        </div>
      )}

      /* Résumé et Actions */
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Résumé Analytique</h2>
          <p className="text-sm text-gray-600 mt-1">Vue d'ensemble et recommandations</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Points Clés</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Programmes performants:</span>
                <span className="font-medium">
                  {filteredIndicateurs.filter(ind => ind.taux_execution >= 80).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Programmes en difficulté:</span>
                <span className="font-medium text-danger-600">
                  {filteredIndicateurs.filter(ind => ind.taux_execution < 50).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taux moyen d'exécution:</span>
                <span className="font-medium">
                  {filteredIndicateurs.length > 0 
                    ? Math.round(filteredIndicateurs.reduce((sum, ind) => sum + ind.taux_execution, 0) / filteredIndicateurs.length)
                    : 0}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dernière mise à jour:</span>
                <span className="font-medium">
                  {format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}
                </span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Actions Rapides</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.print()}
              >
                Imprimer le rapport de performance
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  const dataStr = JSON.stringify(filteredIndicateurs, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = `performance_${format(new Date(), 'yyyy-MM-dd')}.json`;
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
              >
                Exporter les données
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setSelectedProgramme('tous')}
              >
                Réinitialiser les filtres
              </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
