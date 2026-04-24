import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { KPICard, Heatmap, LoadingSpinner, EmptyState, Card, LineChart, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button } from '../../components/ui';

export default function DGDashboard() {
  const [data, setData] = useState({
    engagements: [],
    statistiques: {},
    alertes: [],
    programmes: [],
    evolutionMensuelle: [],
    historique: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const response = await api.get('/dg/dashboard');
      setData({
        ...response.data,
        evolutionMensuelle: response.data.evolutionMensuelle || [],
        programmes: response.data.programmes || [],
        historique: response.data.historique || []
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoirDetails = (engagement) => {
    setSelectedEngagement(engagement);
    setShowModal(true);
  };

  const handleApprouver = async (id, commentaire = '') => {
    try {
      await api.post(`/dg/engagements/${id}/approver`, { commentaire });
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleRefuser = async (id, motif) => {
    try {
      await api.post(`/dg/engagements/${id}/refuser`, { commentaire: motif });
      setShowModal(false);
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleMarquerAlerteLu = async (alerteId) => {
    try {
      await api.put(`/api/notifications/${alerteId}/lire`);
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  // Préparer les données pour la heatmap depuis les programmes
  const heatmapData = data.programmes?.map(prog => {
    const tauxExecution = prog.budget_initial > 0 
      ? ((prog.montant_paye || 0) / prog.budget_initial) * 100 
      : 0;
    return {
      label: prog.code || prog.libelle?.substring(0, 10),
      percentage: Math.round(tauxExecution),
      used: prog.montant_paye || 0,
      total: prog.budget_initial || 0,
    };
  }) || [];

  if (loading) {
    return <LoadingSpinner message="Chargement des données..." />;
  }

  // Icônes pour les KPIs selon documentation
  const EngagementsAttenteIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const ApprobationsIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const MontantIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const AlertesIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* En-tête de la page */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Dashboard Exécutif</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble des activités budgétaires ACPCE 2026</p>
        </div>
        <div className="flex items-center space-x-3">
          <button className="btn-outline text-sm py-2 px-4 flex items-center">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exporter
          </button>
        </div>
      </div>

      {/* KPI Cards - Selon documentation : 4 cartes spécifiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* 1. Engagements en Attente */}
        <KPICard
          title="Engagements en Attente"
          value={data.statistiques?.en_attente_approbation || 0}
          subtitle="Validés par le comptable, en attente d'approbation"
          icon={<EngagementsAttenteIcon />}
          color="primary"
        />
        
        {/* 2. Approbations du Mois */}
        <KPICard
          title="Approbations du Mois"
          value={data.statistiques?.approuves_mois || 0}
          subtitle="Engagements approuvés ce mois"
          icon={<ApprobationsIcon />}
          color="success"
        />
        
        {/* 3. Montant Approuvé (Mois) */}
        <KPICard
          title="Montant Approuvé (Mois)"
          value={formatMontant(data.statistiques?.montant_approuve_mois || 0)}
          subtitle="Total approuvé dans le mois en cours"
          icon={<MontantIcon />}
          color="success"
        />
        
        {/* 4. Alertes Urgentes */}
        <KPICard
          title="Alertes Urgentes"
          value={data.alertes?.length || 0}
          subtitle="Alertes non lues destinées au DG"
          icon={<AlertesIcon />}
          color={data.alertes?.length > 0 ? "danger" : "primary"}
        />
      </div>

      {/* Graphique d'Évolution Mensuelle - 12 derniers mois selon documentation */}
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Évolution Mensuelle des Engagements Approuvés</h2>
          <p className="text-sm text-gray-600 mt-1">Les 12 derniers mois - Tendance d'approbation</p>
        </div>
        <LineChart 
          data={data.evolutionMensuelle.length > 0 ? data.evolutionMensuelle.map((item, index) => ({
            name: format(new Date(item.mois), 'MMM', { locale: fr }),
            value: parseFloat(item.total_montant || 0)
          })) : [
            { name: 'Jan', value: 0 },
            { name: 'Fév', value: 0 },
            { name: 'Mar', value: 0 },
            { name: 'Avr', value: 0 },
            { name: 'Mai', value: 0 },
            { name: 'Juin', value: 0 },
            { name: 'Juil', value: 0 },
            { name: 'Aoû', value: 0 },
            { name: 'Sep', value: 0 },
            { name: 'Oct', value: 0 },
            { name: 'Nov', value: 0 },
            { name: 'Déc', value: 0 },
          ]}
          xKey="name"
          yKey="value"
          height={300}
        />
      </Card>

      {/* Heatmap d'Exécution des Programmes - Selon documentation */}
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Heatmap d'Exécution des Programmes</h2>
          <p className="text-sm text-gray-600 mt-1">
            Taux d'exécution par programme - Codes couleurs : 🟢 &gt;80% (excellent), 🟡 50-80% (bon), 🟠 30-50% (moyen), 🔴 &lt;30% (faible)
          </p>
        </div>
        {heatmapData.length > 0 ? (
          <>
            <Heatmap data={heatmapData} />
            <div className="mt-4 grid grid-cols-1 md:grid-cols-5 gap-4">
              {heatmapData.map((prog, index) => {
                const colorClass = 
                  prog.percentage > 80 ? 'bg-success-100 text-success-800' :
                  prog.percentage >= 50 ? 'bg-warning-100 text-warning-800' :
                  prog.percentage >= 30 ? 'bg-orange-100 text-orange-800' :
                  'bg-danger-100 text-danger-800';
                return (
                  <div key={index} className={`text-center p-3 rounded-lg ${colorClass}`}>
                    <p className="text-sm font-medium">{prog.label}</p>
                    <p className="text-xs mt-1 font-semibold">{prog.percentage}%</p>
                  </div>
                );
              })}
            </div>
          </>
        ) : (
          <EmptyState
            title="Aucun programme disponible"
            description="Les programmes budgétaires apparaîtront ici"
          />
        )}
      </Card>

      {/* Liste des Engagements en Attente - Selon documentation */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Engagements en attente d'approbation</h2>
          <p className="text-sm text-gray-600 mt-1">
            {data.engagements?.length || 0} engagement(s) validés par le comptable, en attente de votre approbation
          </p>
        </div>

        {data.engagements?.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Numéro</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {data.engagements.map((eng) => (
                  <TableRow key={eng.id}>
                    <TableCell>
                      <span className="font-semibold text-primary-600">{eng.numero}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900">
                        {formatMontant(eng.montant)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{eng.programme_libelle}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{eng.service_nom || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {eng.regularite_comptable_date 
                          ? format(new Date(eng.regularite_comptable_date), 'dd/MM/yyyy', { locale: fr })
                          : format(new Date(eng.created_at), 'dd/MM/yyyy', { locale: fr })
                        }
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleVoirDetails(eng)}
                        size="sm"
                        variant="outline"
                      >
                        Voir détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="Aucun engagement en attente"
            description="Tous les engagements ont été traités"
          />
        )}
      </Card>

      {/* Alertes Urgentes - Section selon documentation (5 dernières) */}
      {data.alertes?.length > 0 && (
        <Card className="border-l-4 border-l-warning-500">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Alertes Urgentes</h2>
            <p className="text-sm text-gray-600 mt-1">Les 5 dernières alertes nécessitant votre attention</p>
          </div>
          <div className="space-y-3">
            {data.alertes.slice(0, 5).map((alerte) => (
              <div
                key={alerte.id}
                className="flex items-start justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge 
                      variant={
                        alerte.niveau === 'CRITICAL' ? 'danger' :
                        alerte.niveau === 'WARNING' ? 'warning' : 'info'
                      }
                    >
                      {alerte.niveau}
                    </Badge>
                    <h3 className="font-semibold text-gray-900">{alerte.titre}</h3>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{alerte.message}</p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(alerte.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                  </p>
                </div>
                <Button
                  onClick={() => handleMarquerAlerteLu(alerte.id)}
                  size="sm"
                  variant="ghost"
                  className="ml-4"
                >
                  Marquer comme lu
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Historique des Approbations */}
      <Card>
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Historique des Approbations</h2>
          <p className="text-sm text-gray-600 mt-1">Les 10 dernières approbations effectuées</p>
        </div>

        {data.historique?.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Numéro Engagement</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Ancien Statut</TableHead>
                <TableHead>Nouveau Statut</TableHead>
                <TableHead>Date Approbation</TableHead>
              </TableHeader>
              <TableBody>
                {data.historique.map((hist) => (
                  <TableRow key={hist.id}>
                    <TableCell>
                      <span className="font-semibold text-primary-600">{hist.engagement_numero}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700 truncate max-w-xs">{hist.objet}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900">
                        {formatMontant(hist.montant)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {hist.ancien_statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="success">
                        {hist.nouveau_statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {format(new Date(hist.date_approbation), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Aucun historique d'approbation"
            description="Les approbations apparaîtront ici"
          />
        )}
      </Card>

      {/* Modal de Détails d'Engagement - Selon documentation */}
      {showModal && selectedEngagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">Détails de l'Engagement</h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Informations Générales</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Numéro</p>
                    <p className="font-medium">{selectedEngagement.numero}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Montant</p>
                    <p className="font-medium">{formatMontant(selectedEngagement.montant)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Programme</p>
                    <p className="font-medium">{selectedEngagement.programme_libelle}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Service</p>
                    <p className="font-medium">{selectedEngagement.service_nom || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Objet</h4>
                <p className="text-gray-700">{selectedEngagement.objet || 'N/A'}</p>
              </div>

              <div className="flex space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    const motif = prompt('Motif du refus (obligatoire):');
                    if (motif) {
                      handleRefuser(selectedEngagement.id, motif);
                    }
                  }}
                >
                  Refuser
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    const commentaire = prompt('Commentaire (optionnel):') || '';
                    handleApprouver(selectedEngagement.id, commentaire);
                  }}
                >
                  Approuver
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
