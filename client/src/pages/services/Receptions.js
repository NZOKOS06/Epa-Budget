import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../../components/ui';
import { getStatusMeta } from '../../utils/statusUtils';

export default function ServicesReceptions() {
  const [receptions, setReceptions] = useState([]);
  const [engagementsDispos, setEngagementsDispos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedReception, setSelectedReception] = useState(null);
  const [showForm, setShowForm] = useState(false);
  
  const [formData, setFormData] = useState({
    engagement_id: '',
    date_reception: format(new Date(), 'yyyy-MM-dd'),
    observations: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [receptionsRes, engagementsRes] = await Promise.all([
        api.get('/services/receptions'),
        api.get('/services/engagements-receptionnables')
      ]);
      setReceptions(receptionsRes.data || []);
      setEngagementsDispos(engagementsRes.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleServiceFait = async (id) => {
    try {
      await api.post(`/services/receptions/${id}/service-fait`, {});
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post(`/services/engagements/${formData.engagement_id}/reception`, {
        date_reception: formData.date_reception,
        observations: formData.observations
      });
      setShowForm(false);
      setFormData({
        engagement_id: '',
        date_reception: format(new Date(), 'yyyy-MM-dd'),
        observations: ''
      });
      fetchData();
      alert('PV de réception créé avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert(`Erreur: ${error.response?.data?.message || error.message}`);
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
    return <LoadingSpinner message="Chargement des réceptions..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Réceptions / Liquidations</h1>
          <p className="text-gray-600 mt-1">Gestion des PV de réception et liquidation</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle Réception
        </Button>
      </div>

      {/* Liste des réceptions */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">PV de Réception</h2>
          <p className="text-sm text-gray-600 mt-1">
            {receptions.length} réception(s) enregistrée(s)
          </p>
        </div>

        {receptions.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Numéro PV</TableHead>
                <TableHead>Engagement</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Date Réception</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {receptions.map((reception) => (
                  <TableRow
                    key={reception.id}
                    onClick={() => setSelectedReception(reception)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <span className="font-semibold text-primary-600">{reception.pv_numero || `PV-${reception.id}`}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{reception.engagement_numero}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{reception.programme_libelle}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-gray-900">
                        {formatMontant(reception.engagement_montant || reception.montant_facture)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {reception.date_reception
                          ? format(new Date(reception.date_reception), 'dd/MM/yyyy', { locale: fr })
                          : '-'}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusMeta(reception.statut).variant}>
                        {getStatusMeta(reception.statut).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleServiceFait(reception.id);
                        }}
                      >
                        Service fait
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Aucune réception enregistrée"
            description="Les PV de réception apparaîtront ici après l'enregistrement d'une nouvelle réception"
            action={
              <Button onClick={() => setShowForm(true)}>
                Nouvelle Réception
              </Button>
            }
          />
        )}
      </Card>

      {/* Détails réception */}
      {selectedReception && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">PV Réception #{selectedReception.pv_numero || `PV-${selectedReception.id}`}</h2>
              <p className="text-sm text-gray-600 mt-1">Engagement: {selectedReception.engagement_numero}</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedReception(null)}>
              Fermer
            </Button>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-gray-600 font-medium">Programme</p>
                <p className="text-base font-semibold text-gray-900">
                  {selectedReception.programme_libelle || '-'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Montant</p>
                <p className="text-base font-semibold text-gray-900">
                  {formatMontant(selectedReception.engagement_montant || selectedReception.montant_facture)}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Date de réception</p>
                <p className="text-base font-semibold text-gray-900">
                  {selectedReception.date_reception
                    ? format(new Date(selectedReception.date_reception), 'dd/MM/yyyy', { locale: fr })
                    : 'Non définie'}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 font-medium">Statut</p>
                <Badge variant={getStatusMeta(selectedReception.statut).variant}>
                  {getStatusMeta(selectedReception.statut).label}
                </Badge>
              </div>
            </div>

            {selectedReception.engagement_objet && (
              <div>
                <p className="text-sm text-gray-600 font-medium mb-2">Objet de l'engagement</p>
                <p className="text-base text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {selectedReception.engagement_objet}
                </p>
              </div>
            )}

            {selectedReception.observations && (
              <div>
                <p className="text-sm text-gray-600 font-medium mb-2">Observations / Conformité</p>
                <p className="text-base text-gray-900 bg-gray-50 p-4 rounded-lg">
                  {selectedReception.observations}
                </p>
              </div>
            )}

            {selectedReception.statut !== 'validee' && selectedReception.statut !== 'payee' && (
              <div className="pt-4 border-t border-gray-200">
                <Button
                  onClick={() => {
                    handleServiceFait(selectedReception.id);
                    setSelectedReception(null);
                  }}
                  className="w-full"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Enregistrer le Service Fait
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Modal Nouvelle Réception */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Enregistrer un PV de Réception</h3>
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
                  Engagement (Approuvé ou Payé)
                </label>
                <select
                  value={formData.engagement_id}
                  onChange={(e) => setFormData({ ...formData, engagement_id: e.target.value })}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border bg-white"
                  required
                >
                  <option value="">Sélectionner un engagement...</option>
                  {engagementsDispos.map((eng) => (
                    <option key={eng.id} value={eng.id}>
                      {eng.numero} - {eng.objet} ({formatMontant(eng.montant)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date de réception
                </label>
                <input
                  type="date"
                  value={formData.date_reception}
                  onChange={(e) => setFormData({ ...formData, date_reception: e.target.value })}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Observations / Conformité
                </label>
                <textarea
                  value={formData.observations}
                  onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                  className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
                  rows="4"
                  placeholder="État de la livraison, remarques éventuelles..."
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
                <Button type="submit" className="flex-1" disabled={!formData.engagement_id}>
                  Enregistrer le PV
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
