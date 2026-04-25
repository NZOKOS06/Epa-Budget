import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../../components/ui';
import { getStatusMeta } from '../../utils/statusUtils';

export default function ComptableControleRegularite() {
  const [liquidations, setLiquidations] = useState([]);
  const [selectedLiquidation, setSelectedLiquidation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiquidations();
  }, []);

  const fetchLiquidations = async () => {
    try {
      const response = await api.get('/liquidations/en-attente');
      setLiquidations(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleValiderLiquidation = async (id) => {
    try {
      await api.post(`/liquidations/${id}/valider`, {});
      alert('Liquidation validée avec succès (Régularité OK).');
      // Pour l'instant, on rafraîchit. Dans un vrai flux, on pourrait passer au paiement directement.
      fetchLiquidations();
      setSelectedLiquidation(null);
    } catch (error) {
      console.error('Erreur lors de la validation:', error);
      alert(error.response?.data?.message || 'Une erreur est survenue.');
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
    return <LoadingSpinner message="Chargement des liquidations..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contrôle de Régularité & Liquidations</h1>
          <p className="text-gray-500 mt-1">Validation de la régularité comptable et préparation au paiement</p>
        </div>
      </div>

      {/* Tableau des liquidations */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Liquidations en attente</h2>
          <p className="text-sm text-gray-500 mt-1">
            {liquidations.length} dossier(s) nécessitant un contrôle de régularité
          </p>
        </div>

        {liquidations.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>N° Engagement</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead className="text-right">Montant Engagé</TableHead>
                <TableHead className="text-right">Montant Facture</TableHead>
                <TableHead className="text-right">Montant à Liquider</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {liquidations.map((liq) => (
                  <TableRow
                    key={liq.id}
                    onClick={() => setSelectedLiquidation(liq)}
                    className="cursor-pointer"
                  >
                    <TableCell>
                      <span className="font-semibold text-primary-600">{liq.engagement_numero}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700 truncate block max-w-xs" title={liq.engagement_objet}>
                        {liq.engagement_objet}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-gray-900">
                        {formatMontant(liq.engagement_montant)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-gray-900">
                        {formatMontant(liq.montant_facture)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-bold text-gray-900">
                        {formatMontant(liq.montant_liquide)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {format(new Date(liq.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={getStatusMeta(liq.statut).variant}>
                        {getStatusMeta(liq.statut).label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="sm">
                        Examiner
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Aucun dossier en attente"
            description="Toutes les liquidations ont été traitées."
          />
        )}
      </Card>

      {/* Détails du dossier sélectionné */}
      {selectedLiquidation && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Dossier #{selectedLiquidation.engagement_numero}</h2>
              <p className="text-sm text-gray-500 mt-1">Vérification de la liquidation (RG-12, RG-13)</p>
            </div>
            <Button variant="outline" onClick={() => setSelectedLiquidation(null)}>
              Fermer
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Informations de l'Engagement</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                <p><span className="text-gray-600">Numéro:</span> <span className="font-medium text-gray-900">{selectedLiquidation.engagement_numero}</span></p>
                <p><span className="text-gray-600">Objet:</span> <span className="font-medium text-gray-900">{selectedLiquidation.engagement_objet}</span></p>
                <p><span className="text-gray-600">Montant engagé:</span> <span className="font-medium text-gray-900">{formatMontant(selectedLiquidation.engagement_montant)}</span></p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-semibold text-gray-900">Détails de la Liquidation</h3>
              <div className="bg-primary-50 p-4 rounded-lg space-y-2">
                <p><span className="text-primary-800">Montant de la Facture:</span> <span className="font-bold text-primary-900">{formatMontant(selectedLiquidation.montant_facture)}</span></p>
                <p><span className="text-primary-800">Montant à Liquider:</span> <span className="font-bold text-primary-900">{formatMontant(selectedLiquidation.montant_liquide)}</span></p>
              </div>
            </div>
          </div>

          {/* Pièces jointes (RG-12) */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Pièces justificatives requises</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-900">Facture certifiée</span>
                </div>
                {selectedLiquidation.facture_path ? (
                  <Badge variant="success" size="sm">✓ Présent</Badge>
                ) : (
                  <Badge variant="danger" size="sm">Manquant</Badge>
                )}
              </div>
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-gray-900">Procès-verbal de service fait</span>
                </div>
                {selectedLiquidation.pv_service_fait_path ? (
                  <Badge variant="success" size="sm">✓ Présent</Badge>
                ) : (
                  <Badge variant="danger" size="sm">Manquant</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="pt-6 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-900">Décision</p>
                <p className="text-xs text-gray-500 mt-1">
                  {selectedLiquidation.statut === 'en_attente' 
                    ? 'Valider la liquidation après vérification des pièces.'
                    : 'Procéder au paiement de cette liquidation validée.'}
                </p>
              </div>
              
              {selectedLiquidation.statut === 'en_attente' ? (
                <Button
                  onClick={() => handleValiderLiquidation(selectedLiquidation.id)}
                  className="btn-success"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Valider la Régularité
                </Button>
              ) : (
                <Button
                  onClick={async () => {
                    try {
                      await api.post(`/liquidations/${selectedLiquidation.id}/paiement`, {
                        montant: selectedLiquidation.montant_liquide,
                        date_paiement: new Date().toISOString().split('T')[0],
                        mode_paiement: 'virement'
                      });
                      alert('Paiement enregistré avec succès (RG-13) !');
                      fetchLiquidations();
                      setSelectedLiquidation(null);
                    } catch (error) {
                      alert('Erreur lors du paiement.');
                    }
                  }}
                  className="bg-primary-600 text-white hover:bg-primary-700"
                >
                  <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                  Enregistrer le Paiement
                </Button>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
