import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Card, Button, LoadingSpinner, KPICard, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, LineChart } from '../../components/ui';

export default function ServicesIndicateurs() {
  const [indicateurs, setIndicateurs] = useState([]);
  const [loading, setLoading] = useState(true);

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
  const totalMontantApprouve = indicateurs.reduce((sum, ind) => sum + parseFloat(ind.montant_approuve || 0), 0);
  const totalMontantPaye = indicateurs.reduce((sum, ind) => sum + parseFloat(ind.montant_paye || 0), 0);

  const tauxGlobalReussite = totalDemandes > 0 ? Math.round((totalApprouves / totalDemandes) * 100) : 0;

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
          <h1 className="text-3xl font-bold text-gray-900">Indicateurs de Performance</h1>
          <p className="text-gray-600 mt-1">Suivi des indicateurs d'engagement par programme</p>
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
          title="Montant Payé"
          value={formatMontant(totalMontantPaye)}
          subtitle="Liquidations terminées"
          icon={<MoneyIcon />}
          color="primary"
        />
      </div>

      {/* Tableau des Indicateurs par Programme */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Performance par Programme</h2>
          <p className="text-sm text-gray-600 mt-1">Détail des engagements par programme</p>
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
              </TableHeader>
              <TableBody>
                {indicateurs.map((ind, idx) => {
                  const nbDem = parseInt(ind.nb_demandes || 0);
                  const nbApp = parseInt(ind.nb_approuves || 0);
                  const taux = nbDem > 0 ? Math.round((nbApp / nbDem) * 100) : 0;
                  
                  return (
                    <TableRow key={idx}>
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
                      <TableCell className="text-center text-success-600 font-medium">{ind.nb_payes}</TableCell>
                      <TableCell className="text-right font-medium">{formatMontant(ind.montant_approuve)}</TableCell>
                      <TableCell className="text-right font-medium text-success-600">{formatMontant(ind.montant_paye)}</TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded text-xs font-bold ${
                          taux >= 80 ? 'bg-success-100 text-success-800' :
                          taux >= 50 ? 'bg-warning-100 text-warning-800' :
                          'bg-danger-100 text-danger-800'
                        }`}>
                          {taux}%
                        </span>
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

      {/* Graphiques */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Évolution Globale des Engagements Approuvés</h2>
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
