import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, KPICard, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, LineChart, Badge } from '../../components/ui';

export default function ControleurDashboard() {
  const [data, setData] = useState({
    fileVisas: [],
    alertes: [],
    journal: [],
    stats: {}
  });
  const [loading, setLoading] = useState(true);
  const [selectedPeriode, setSelectedPeriode] = useState('7jours');

  const fetchData = useCallback(async () => {
    try {
      const [fileVisasRes, alertesRes, journalRes] = await Promise.all([
        api.get('/controleur/file-visas'),
        api.get('/controleur/alertes-derive'),
        api.get('/controleur/journal-controles')
      ]);

      // Calculer les statistiques
      const stats = {
        totalEnAttente: fileVisasRes.data?.length || 0,
        totalAlertes: alertesRes.data?.length || 0,
        totalControles: journalRes.data?.length || 0,
        montantTotalEnAttente: fileVisasRes.data?.reduce((sum, item) => sum + parseFloat(item.montant || 0), 0) || 0,
        visasFavorables: journalRes.data?.filter(item => item.type_avis === 'favorable').length || 0,
        visasDefavorables: journalRes.data?.filter(item => item.type_avis === 'defavorable').length || 0
      };

      setData({
        fileVisas: fileVisasRes.data || [],
        alertes: alertesRes.data || [],
        journal: journalRes.data || [],
        stats
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

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  // Préparer les données pour le graphique d'évolution
  const evolutionData = data.journal.slice(0, 10).reverse().map((item, index) => ({
    name: format(new Date(item.date_avis), 'dd/MM', { locale: fr }),
    favorable: item.type_avis === 'favorable' ? 1 : 0,
    defavorable: item.type_avis === 'defavorable' ? 1 : 0,
    montant: parseFloat(item.montant || 0)
  }));

  if (loading) {
    return <LoadingSpinner message="Chargement du tableau de bord..." />;
  }

  // Icônes pour les KPIs
  const FileVisasIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const AlertesIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const ControlesIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
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
          <h1 className="text-3xl font-bold text-gray-900">Tableau de Bord du Contrôleur</h1>
          <p className="text-gray-600 mt-1">Vue d'ensemble des contrôles budgétaires et visas</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button>
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Exporter
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="File d'Attente"
          value={data.stats.totalEnAttente}
          subtitle="Engagements en attente de visa"
          icon={<FileVisasIcon />}
          color={data.stats.totalEnAttente > 0 ? "warning" : "success"}
        />
        <KPICard
          title="Alertes Dérive"
          value={data.stats.totalAlertes}
          subtitle="Alertes budgétaires détectées"
          icon={<AlertesIcon />}
          color={data.stats.totalAlertes > 0 ? "danger" : "primary"}
        />
        <KPICard
          title="Contrôles Effectués"
          value={data.stats.totalControles}
          subtitle={`${data.stats.visasFavorables} favorables, ${data.stats.visasDefavorables} défavorables`}
          icon={<ControlesIcon />}
          color="primary"
        />
        <KPICard
          title="Montant en Attente"
          value={formatMontant(data.stats.montantTotalEnAttente)}
          subtitle="Total des montants à contrôler"
          icon={<MoneyIcon />}
          color="success"
        />
      </div>

      {/* File d'Attente Prioritaire */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">File d'Attente Prioritaire</h2>
          <p className="text-sm text-gray-600 mt-1">
            Engagements en attente de visa (triés par montant décroissant)
          </p>
        </div>

        {data.fileVisas.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Numéro</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Demandeur</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Article Budget</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {data.fileVisas.slice(0, 10).map((engagement) => (
                  <TableRow key={engagement.id} className="hover:bg-gray-50">
                    <TableCell>
                      <span className="font-semibold text-primary-600">{engagement.numero}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700 truncate max-w-xs" title={engagement.objet}>
                        {engagement.objet}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{engagement.demandeur_nom}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-gray-900">
                        {formatMontant(engagement.montant)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{engagement.article_code}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        onClick={() => window.location.href = `/controleur/checklist/${engagement.id}`}
                      >
                        Contrôler
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucun engagement en attente de contrôle
          </div>
        )}
      </Card>

      {/* Alertes de Dérive */}
      {data.alertes.length > 0 && (
        <Card className="border-l-4 border-l-danger-500">
          <div className="mb-6">
            <h2 className="text-xl font-bold text-gray-900">Alertes de Dérive Budgétaire</h2>
            <p className="text-sm text-gray-600 mt-1">
              Engagements présentant des risques de dépassement
            </p>
          </div>
          <div className="space-y-3">
            {data.alertes.slice(0, 5).map((alerte) => (
              <div
                key={alerte.id}
                className="flex items-start justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge variant="danger">
                      {alerte.type_alerte}
                    </Badge>
                    <h3 className="font-semibold text-gray-900">{alerte.numero}</h3>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{alerte.objet}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>Montant: {formatMontant(alerte.montant)}</span>
                    <span>AE Disponible: {formatMontant(alerte.ae_disponible)}</span>
                    <span>Article: {alerte.article_code}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => window.location.href = `/controleur/checklist/${alerte.id}`}
                >
                  Contrôler
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Évolution des Contrôles */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Évolution des Contrôles</h2>
          <p className="text-sm text-gray-600 mt-1">
            Derniers contrôles effectués (favorables vs défavorables)
          </p>
        </div>
        <div className="h-64">
          <LineChart
            data={evolutionData}
            xKey="name"
            yKeys={['favorable', 'defavorable']}
            colors={['#10B981', '#EF4444']}
            height={300}
          />
        </div>
      </Card>

      {/* Journal des Contrôles Récents */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Journal des Contrôles Récents</h2>
          <p className="text-sm text-gray-600 mt-1">
            Les 10 derniers contrôles effectués
          </p>
        </div>

        {data.journal.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Date</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Demandeur</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Avis</TableHead>
                <TableHead>Commentaire</TableHead>
              </TableHeader>
              <TableBody>
                {data.journal.slice(0, 10).map((controle) => (
                  <TableRow key={controle.id}>
                    <TableCell>
                      <span className="text-gray-600">
                        {format(new Date(controle.date_avis), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary-600">{controle.engagement_numero}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{controle.demandeur_nom}</span>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-gray-900">
                        {formatMontant(controle.montant)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={controle.type_avis === 'favorable' ? 'success' : 'danger'}>
                        {controle.type_avis === 'favorable' ? 'Favorable' : 'Défavorable'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700 truncate max-w-xs" title={controle.commentaire}>
                        {controle.commentaire}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            Aucun contrôle effectué récemment
          </div>
        )}
      </Card>
    </div>
  );
}
