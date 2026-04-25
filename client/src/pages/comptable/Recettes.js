import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, PageHeader, KPICard } from '../../components/ui';

export default function ComptableRecettes() {
  const [recettes, setRecettes] = useState([]);
  const [stats, setStats] = useState({ total: 0, attendues: 0, encaissees: 0 });
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    nature_recette: '',
    montant: '',
    date_recette: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    fetchRecettes();
  }, []);

  const fetchRecettes = async () => {
    try {
      const response = await api.get('/comptable/recettes');
      setRecettes(response.data || []);
      
      // Calculer statistiques
      const total = response.data?.reduce((sum, r) => sum + (r.montant || 0), 0) || 0;
      const attendues = 300000000; // Données de démo
      const encaissees = total;
      setStats({ total, attendues, encaissees });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/comptable/recettes', formData);
      setShowForm(false);
      setFormData({ nature_recette: '', montant: '', date_recette: new Date().toISOString().split('T')[0] });
      fetchRecettes();
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

  if (loading) {
    return <LoadingSpinner message="Chargement des recettes..." />;
  }

  const pourcentageEncaissement = stats.attendues > 0 
    ? Math.round((stats.encaissees / stats.attendues) * 100) 
    : 0;

  // Icônes pour KPIs
  const TitresIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const EncaissementIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* Header premium */}
      <PageHeader
        title="Recettes"
        subtitle="Gestion des recettes et titres de recettes"
        kpis={[
          {
            label: 'Recettes enregistrées',
            value: recettes.length,
            sub: 'tous types',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>,
          },
          {
            label: 'Montant total',
            value: formatMontant(recettes.reduce((s, r) => s + (parseFloat(r.montant) || 0), 0)),
            sub: 'recettes',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          },
          {
            label: 'Rapprochées',
            value: recettes.filter(r => r.rapprochee).length,
            sub: 'bancaire OK',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          },
          {
            label: 'En attente',
            value: recettes.filter(r => !r.rapprochee).length,
            sub: 'à rapprocher',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          },
        ]}
      >
        <Button onClick={() => setShowForm(true)} className="shadow-md hover:shadow-lg">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Nouvelle Recette
        </Button>
      </PageHeader>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <KPICard
          title="Titres Attendus"
          value={formatMontant(stats.attendues)}
          subtitle="Recettes prévues"
          icon={<TitresIcon />}
          color="primary"
        />
        <KPICard
          title="Taux d'Encaissement"
          value={`${pourcentageEncaissement}%`}
          subtitle={`${formatMontant(stats.encaissees)} encaissés`}
          icon={<EncaissementIcon />}
          color={pourcentageEncaissement >= 85 ? 'success' : 'warning'}
          trend={pourcentageEncaissement >= 85 ? 'up' : 'down'}
        />
      </div>

      {/* Rapprochement bancaire */}
      <Card className="bg-primary-50 border-primary-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Rapprochement bancaire</h2>
            <p className="text-sm text-gray-500 mt-1">Rapprochement automatique effectué</p>
          </div>
          <Button variant="outline">
            <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Actualiser
          </Button>
        </div>
      </Card>

      {/* Liste des recettes */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Liste des recettes</h2>
          <p className="text-sm text-gray-500 mt-1">
            {recettes.length} recette(s) enregistrée(s)
          </p>
        </div>

        {recettes.length > 0 ? (
          <div className="overflow-x-auto">
            <Table striped>
              <TableHeader>
                <TableHead>Numéro</TableHead>
                <TableHead>Nature</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {recettes.map((recette) => (
                  <TableRow key={recette.id} hover>
                    <TableCell>
                      <span className="font-semibold text-primary-600">{recette.numero}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-900">{recette.nature_recette}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-gray-900">
                        {formatMontant(recette.montant)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {format(new Date(recette.date_recette), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={recette.statut === 'ENCAISSE' ? 'success' : 'warning'}>
                        {recette.statut || 'En attente'}
                      </Badge>
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
        ) : (
          <EmptyState
            title="Aucune recette enregistrée"
            description="Créez une nouvelle recette pour commencer"
            action={
              <Button onClick={() => setShowForm(true)}>
                Créer une recette
              </Button>
            }
          />
        )}
      </Card>

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Nouvelle Recette</h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nature de la recette
                </label>
                <input
                  type="text"
                  value={formData.nature_recette}
                  onChange={(e) => setFormData({ ...formData, nature_recette: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Taxes, Subventions..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  className="input-field"
                  placeholder="Ex: 300000000"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date
                </label>
                <input
                  type="date"
                  value={formData.date_recette}
                  onChange={(e) => setFormData({ ...formData, date_recette: e.target.value })}
                  className="input-field"
                  required
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1">
                  Enregistrer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
