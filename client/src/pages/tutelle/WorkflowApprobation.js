import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Badge } from '../../components/ui';

export default function TutelleWorkflowApprobation() {
  const [budget, setBudget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentaire, setCommentaire] = useState('');

  useEffect(() => {
    fetchBudget();
  }, []);

  const fetchBudget = async () => {
    try {
      const response = await api.get('/tutelle/budget-2026');
      setBudget(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      // Données de démo
      setBudget({
        id: 1,
        numero: 'BUD-2026-001',
        montant_total: 2500000000,
        statut: 'EN_ATTENTE',
        date_soumission: new Date(),
        commentaires: [],
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprouver = async () => {
    try {
      await api.post(`/tutelle/budget/${budget.id}/approver`, { commentaire });
      fetchBudget();
      setCommentaire('');
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleRefuser = async () => {
    try {
      await api.post(`/tutelle/budget/${budget.id}/refuser`, { 
        commentaire: commentaire || 'Refus - Budget non conforme' 
      });
      fetchBudget();
      setCommentaire('');
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
    return <LoadingSpinner message="Chargement du budget..." />;
  }

  if (!budget) {
    return (
      <EmptyState
        title="Aucun budget en attente"
        description="Tous les budgets ont été traités"
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Workflow Approbation</h1>
          <p className="text-gray-500 mt-1">Budget 2026 - Validation tutelle</p>
        </div>
      </div>

      {/* Budget en attente */}
      <Card>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Budget 2026</h2>
            <p className="text-sm text-gray-500 mt-1">Numéro: {budget.numero}</p>
          </div>
          <Badge variant={budget.statut === 'APPROUVE' ? 'success' : 'warning'}>
            {budget.statut || 'En attente'}
          </Badge>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Montant Total</p>
            <p className="text-2xl font-semibold text-gray-900">
              {formatMontant(budget.montant_total)}
            </p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 mb-2">Date de soumission</p>
            <p className="text-lg font-semibold text-gray-900">
              {format(new Date(budget.date_soumission), 'dd MMMM yyyy', { locale: fr })}
            </p>
          </div>
        </div>

        {/* Commentaires */}
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Commentaires</h3>
          {budget.commentaires && budget.commentaires.length > 0 ? (
            <div className="space-y-2">
              {budget.commentaires.map((comment, index) => (
                <div key={index} className="p-3 bg-primary-50 rounded-lg">
                  <p className="text-sm text-gray-900">{comment}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="text-sm text-gray-600">Aucun commentaire</p>
            </div>
          )}
        </div>

        {/* Formulaire d'action */}
        {budget.statut === 'EN_ATTENTE' && (
          <div className="pt-6 border-t border-gray-200">
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Votre commentaire
              </label>
              <textarea
                value={commentaire}
                onChange={(e) => setCommentaire(e.target.value)}
                className="input-field"
                rows="4"
                placeholder="Ex: Indicateurs OK, Budget conforme..."
              />
            </div>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                className="flex-1 border-danger-300 text-danger-700 hover:bg-danger-50"
                onClick={handleRefuser}
              >
                Refus -20M
              </Button>
              <Button
                className="flex-1 btn-success"
                onClick={handleApprouver}
              >
                Approuver
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
