import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Card, Button, LoadingSpinner, KPICard, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, LineChart, Badge } from '../../components/ui';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function ServicesIndicateurs() {
  const [indicateurs, setIndicateurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriode, setSelectedPeriode] = useState('actuel');
  const [showDetails, setShowDetails] = useState(false);

  const fetchIndicateurs = useCallback(async () => {
    try {
      const response = await api.get('/services/indicateurs');
      setIndicateurs(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchIndicateurs();
  }, [fetchIndicateurs]);

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des indicateurs..." />;
  }

  // Calculer les totaux pour les KPIs
  const totalDemandes = indicateurs.reduce((sum, ind) => sum + parseInt(ind.nb_demandes || 0), 0);
  const totalApprouves = indicateurs.reduce((sum, ind) => sum + parseInt(ind.nb_approuves || 0), 0);
  const totalPayes = indicateurs.reduce((sum, ind) => sum + parseInt(ind.nb_payes || 0), 0);
  const totalMontantApprouve = indicateurs.reduce((sum, ind) => sum + parseFloat(ind.montant_approuve || 0), 0);
  const totalMontantPaye = indicateurs.reduce((sum, ind) => sum + parseFloat(ind.montant_paye || 0), 0);

  const tauxGlobalReussite = totalDemandes > 0 ? Math.round((totalApprouves / totalDemandes) * 100) : 0;
  const tauxExecutionBudget = totalMontantApprouve > 0 ? Math.round((totalMontantPaye / totalMontantApprouve) * 100) : 0;

  // Préparation données pour LineChart simulé
  const lineChartData = [
    { name: 'Mois-3', value: 0 },
    { name: 'Mois-2', value: totalApprouves * 0.4 },
    { name: 'Mois-1', value: totalApprouves * 0.7 },
    { name: 'Actuel', value: totalApprouves }
  ];

  const DocumentIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const MoneyIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Indicateurs de Performance</h1>
          <p className="text-gray-500 mt-1">Suivi des indicateurs d'engagement par programme</p>
        </div>
        <Button>
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Rapport Trimestriel
        </Button>
      </div>

      {/* KPIs Globaux */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Demandes"
          value={totalDemandes}
          subtitle={`${totalApprouves} approuvées (${tauxGlobalReussite}%)`}
          icon={<DocumentIcon />}
          color="primary"
        />
        <KPICard
          title="Taux de Réussite"
          value={`${tauxGlobalReussite}%`}
          subtitle="Demandes approuvées vs créées"
          icon={<DocumentIcon />}
          color={tauxGlobalReussite >= 80 ? 'success' : tauxGlobalReussite >= 50 ? 'warning' : 'danger'}
        />
        <KPICard
          title="Montant Approuvé"
          value={formatMontant(totalMontantApprouve)}
          subtitle="Cumul engagements"
          icon={<MoneyIcon />}
          color="success"
        />
        <KPICard
          title="Exécution Budgétaire"
          value={`${tauxExecutionBudget}%`}
          subtitle={`${totalPayes} liquidations`}
          icon={<MoneyIcon />}
          color={tauxExecutionBudget >= 75 ? 'success' : tauxExecutionBudget >= 50 ? 'warning' : 'danger'}
        />
      </div>

      {/* Tableau des Indicateurs par Programme */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Performance par Programme</h2>
          <p className="text-sm text-gray-500 mt-1">Détail des engagements par programme</p>
        </div>

        {indicateurs.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Programme</TableHead>
                <TableHead className="text-center">Demandes</TableHead>
                <TableHead className="text-center">Approuvées</TableHead>
                <TableHead className="text-center">Payées</TableHead>
                <TableHead className="text-right">Montant Approuvé</TableHead>
                <TableHead className="text-right">Montant Payé</TableHead>
                <TableHead className="text-center">Taux Réussite</TableHead>
                <TableHead className="text-center">Statut</TableHead>
              </TableHeader>
              <TableBody>
                {indicateurs.map((ind, idx) => {
                  const nbDem = parseInt(ind.nb_demandes || 0);
                  const nbApp = parseInt(ind.nb_approuves || 0);
                  const nbPay = parseInt(ind.nb_payes || 0);
                  const taux = nbDem > 0 ? Math.round((nbApp / nbDem) * 100) : 0;
                  const tauxExecution = nbApp > 0 ? Math.round((nbPay / nbApp) * 100) : 0;
                  
                  const getStatutColor = (taux) => {
                    if (taux >= 80) return 'success';
                    if (taux >= 50) return 'warning';
                    return 'danger';
                  };
                  
                  return (
                    <TableRow key={idx} className="hover:bg-gray-50">
                      <TableCell>
                        <div>
                          <span className="font-bold text-gray-900 block">{ind.programme_code}</span>
                          <span className="text-sm text-gray-600 block truncate max-w-[200px]" title={ind.programme_libelle}>
                            {ind.programme_libelle}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="text-center font-medium">{nbDem}</TableCell>
                      <TableCell className="text-center text-primary-600 font-medium">{nbApp}</TableCell>
                      <TableCell className="text-center text-success-600 font-medium">{nbPay}</TableCell>
                      <TableCell className="text-right font-medium">{formatMontant(ind.montant_approuve)}</TableCell>
                      <TableCell className="text-right font-medium text-success-600">{formatMontant(ind.montant_paye)}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatutColor(taux)}>
                          {taux}%
                        </Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant={getStatutColor(tauxExecution)}>
                          {tauxExecution}% exécution
                        </Badge>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">Aucune donnée disponible</div>
        )}
      </Card>

      {/* Résumé et Actions */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Résumé et Actions</h2>
          <p className="text-sm text-gray-500 mt-1">Vue d'ensemble et options d'export</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Performance Globale</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Taux de réussite moyen:</span>
                <span className="font-medium">{tauxGlobalReussite}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Taux d'exécution budget:</span>
                <span className="font-medium">{tauxExecutionBudget}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Nombre de programmes actifs:</span>
                <span className="font-medium">{indicateurs.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Dernière mise à jour:</span>
                <span className="font-medium">{format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}</span>
              </div>
            </div>
          </div>
          
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Actions Rapides</h3>
            <div className="space-y-2">
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => setShowDetails(!showDetails)}
              >
                {showDetails ? 'Masquer les détails' : 'Afficher les détails'}
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => window.print()}
              >
                Imprimer le rapport
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={() => {
                  const dataStr = JSON.stringify(indicateurs, null, 2);
                  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                  const exportFileDefaultName = `indicateurs_${format(new Date(), 'yyyy-MM-dd')}.json`;
                  const linkElement = document.createElement('a');
                  linkElement.setAttribute('href', dataUri);
                  linkElement.setAttribute('download', exportFileDefaultName);
                  linkElement.click();
                }}
              >
                Exporter les données
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Graphiques */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Évolution Globale des Engagements Approuvés</h2>
        </div>
        <div className="h-64">
          <LineChart
            data={lineChartData}
            xKey="name"
            yKey="value"
            height={300}
          />
        </div>
      </Card>
    </div>
  );
}
