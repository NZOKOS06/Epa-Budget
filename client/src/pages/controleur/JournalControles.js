import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, KPICard, LineChart } from '../../components/ui';
import { getStatusMeta } from '../../utils/statusUtils';

export default function ControleurJournalControles() {
  const [controles, setControles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filtres, setFiltres] = useState({
    date_debut: '',
    date_fin: '',
    statut: '',
  });

  useEffect(() => {
    fetchControles();
  }, []);

  const fetchControles = async () => {
    try {
      const response = await api.get('/controleur/journal-controles');
      const normalized = (response.data || []).map((item) => {
        const rawStatut = (item.statut || item.type_avis || '').toString().toLowerCase();
        const statut = rawStatut === 'favorable'
          ? 'APPROUVE'
          : rawStatut === 'defavorable'
            ? 'REFUSE'
            : (item.statut || 'EN_ATTENTE');

        return {
          id: item.id,
          numero: item.numero || item.engagement_numero || 'N/A',
          type_controle: item.type_controle || 'VISA',
          statut,
          montant: item.montant,
          acteur: item.acteur || item.demandeur_nom || '-',
          date_action: item.date_action || item.date_avis || item.created_at || null,
          commentaire: item.commentaire || '',
        };
      });
      setControles(normalized);
    } catch (error) {
      console.error('Erreur:', error);
      // Données de démo
      setControles([
        {
          id: 1,
          numero: 'ACPCE-2026-001',
          type_controle: 'VISA',
          statut: 'APPROUVE',
          montant: 15000000,
          acteur: 'Contrôleur Finance',
          date_action: new Date(),
          commentaire: 'Visa apposé après vérification complète',
        },
        {
          id: 2,
          numero: 'ACPCE-2026-002',
          type_controle: 'VISA',
          statut: 'REFUSE',
          montant: 8000000,
          acteur: 'Contrôleur Finance',
          date_action: new Date(Date.now() - 86400000),
          commentaire: 'Refus - Pièces incomplètes',
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      // Logique d'export
      console.log('Export mensuel MinFin');
      // window.open('/api/controleur/journal-controles/export', '_blank');
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const parseSafeDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  // Filtrer les contrôles
  const controlesFiltres = controles.filter(controle => {
    if (filtres.statut && controle.statut !== filtres.statut) return false;
    const actionDate = parseSafeDate(controle.date_action);
    if (filtres.date_debut && actionDate && actionDate < new Date(filtres.date_debut)) return false;
    if (filtres.date_fin && actionDate && actionDate > new Date(filtres.date_fin)) return false;
    return true;
  });

  // Calculer les statistiques
  const stats = {
    total: controles.length,
    visasFavorables: controles.filter(c => c.statut === 'APPROUVE').length,
    visasDefavorables: controles.filter(c => c.statut === 'REFUSE').length,
    montantTotal: controles.reduce((sum, c) => sum + parseFloat(c.montant || 0), 0),
    montantFavorable: controles.filter(c => c.statut === 'APPROUVE').reduce((sum, c) => sum + parseFloat(c.montant || 0), 0),
    montantDefavorable: controles.filter(c => c.statut === 'REFUSE').reduce((sum, c) => sum + parseFloat(c.montant || 0), 0)
  };

  // Préparer les données pour le graphique
  const evolutionData = controles
    .filter(c => parseSafeDate(c.date_action))
    .sort((a, b) => new Date(a.date_action) - new Date(b.date_action))
    .slice(-30)
    .map((controle, index) => ({
      name: format(new Date(controle.date_action), 'dd/MM', { locale: fr }),
      favorable: controle.statut === 'APPROUVE' ? 1 : 0,
      defavorable: controle.statut === 'REFUSE' ? 1 : 0,
      montant: parseFloat(controle.montant || 0)
    }));

  // Composants d'icônes
  const TotalIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );

  const FavorableIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const DefavorableIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const MoneyIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  if (loading) {
    return <LoadingSpinner message="Chargement du journal..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Journal des Contrôles</h1>
          <p className="text-gray-600 mt-1">Historique complet des visas et contrôles effectués</p>
        </div>
        <Button onClick={handleExport}>
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Mensuel MinFin
        </Button>
      </div>

      {/* Filtres */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date début
            </label>
            <input
              type="date"
              value={filtres.date_debut}
              onChange={(e) => setFiltres({ ...filtres, date_debut: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Date fin
            </label>
            <input
              type="date"
              value={filtres.date_fin}
              onChange={(e) => setFiltres({ ...filtres, date_fin: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Statut
            </label>
            <select
              value={filtres.statut}
              onChange={(e) => setFiltres({ ...filtres, statut: e.target.value })}
              className="input-field"
            >
              <option value="">Tous les statuts</option>
              <option value="APPROUVE">Approuvé</option>
              <option value="REFUSE">Refusé</option>
              <option value="EN_ATTENTE">En attente</option>
            </select>
          </div>
        </div>
      </Card>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Total Contrôles"
          value={stats.total}
          subtitle="Visas effectués"
          icon={<TotalIcon />}
          color="primary"
        />
        <KPICard
          title="Visas Favorables"
          value={stats.visasFavorables}
          subtitle={`${((stats.visasFavorables / stats.total) * 100).toFixed(1)}% du total`}
          icon={<FavorableIcon />}
          color="success"
        />
        <KPICard
          title="Visas Défavorables"
          value={stats.visasDefavorables}
          subtitle={`${((stats.visasDefavorables / stats.total) * 100).toFixed(1)}% du total`}
          icon={<DefavorableIcon />}
          color="danger"
        />
        <KPICard
          title="Montant Total Contrôlé"
          value={formatMontant(stats.montantTotal)}
          subtitle={`${formatMontant(stats.montantFavorable)} favorable`}
          icon={<MoneyIcon />}
          color="primary"
        />
      </div>

      {/* Graphique d'évolution */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Évolution des Contrôles</h2>
          <p className="text-sm text-gray-600 mt-1">
            Derniers 30 jours - Visas favorables vs défavorables
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

      {/* Tableau des contrôles */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Historique des contrôles</h2>
          <p className="text-sm text-gray-600 mt-1">
            {controlesFiltres.length} contrôle(s) trouvé(s)
          </p>
        </div>

        {controlesFiltres.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Date/Heure</TableHead>
                <TableHead>Numéro Engagement</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Acteur</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Commentaire</TableHead>
              </TableHeader>
              <TableBody>
                {controlesFiltres.map((controle) => (
                  <TableRow key={controle.id}>
                    <TableCell>
                      <div>
                        {(() => {
                          const actionDate = parseSafeDate(controle.date_action);
                          if (!actionDate) {
                            return (
                              <span className="text-sm font-medium text-gray-500">
                                Date indisponible
                              </span>
                            );
                          }
                          return (
                            <>
                              <span className="text-sm font-medium text-gray-900">
                                {format(actionDate, 'dd/MM/yyyy', { locale: fr })}
                              </span>
                              <span className="text-xs text-gray-500 ml-2">
                                {format(actionDate, 'HH:mm')}
                              </span>
                            </>
                          );
                        })()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="font-semibold text-primary-600">{controle.numero}</span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="primary" size="sm">{controle.type_controle}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-gray-900">
                        {formatMontant(controle.montant)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{controle.acteur}</span>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getStatusMeta(controle.statut).variant}
                        size="sm"
                      >
                        {getStatusMeta(controle.statut).label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-gray-600 truncate max-w-xs block" title={controle.commentaire}>
                        {controle.commentaire}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Aucun contrôle trouvé"
            description="Aucun contrôle ne correspond aux critères de filtrage"
          />
        )}
      </Card>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Total contrôles</p>
            <p className="text-2xl font-semibold text-gray-900">{controles.length}</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Visas apposés</p>
            <p className="text-2xl font-semibold text-success-600">
              {controles.filter(c => c.statut === 'APPROUVE').length}
            </p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Refusés</p>
            <p className="text-2xl font-semibold text-danger-600">
              {controles.filter(c => c.statut === 'REFUSE').length}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
