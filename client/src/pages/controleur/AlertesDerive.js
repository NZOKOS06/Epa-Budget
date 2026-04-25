import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Card, Button, LoadingSpinner, EmptyState, Badge } from '../../components/ui';

export default function ControleurAlertesDerive() {
  const [alertes, setAlertes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAlertes();
  }, []);

  const fetchAlertes = async () => {
    try {
      const response = await api.get('/controleur/alertes-derive');
      setAlertes(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
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
    return <LoadingSpinner message="Chargement des alertes..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Alertes de Dérive Budgétaire</h1>
          <p className="text-gray-500 mt-1">Surveillance en temps réel des dépassements et seuils critiques</p>
        </div>
      </div>

      {/* Cartes d'alertes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {alertes.map((alerte) => {
          const isOver = parseFloat(alerte.montant) > parseFloat(alerte.ae_disponible);
          
          return (
            <Card
              key={alerte.id}
              className={`border-l-4 ${isOver ? 'border-l-danger-600 bg-danger-50' : 'border-l-warning-600 bg-warning-50'}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isOver ? 'bg-danger-100' : 'bg-warning-100'}`}>
                    <svg className={`w-6 h-6 ${isOver ? 'text-danger-600' : 'text-warning-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{alerte.type_alerte}</h3>
                    <p className="text-sm text-gray-600">Engagement #{alerte.numero}</p>
                  </div>
                </div>
                <Badge variant={isOver ? 'danger' : 'warning'}>
                  {isOver ? 'BLOQUANT' : 'ATTENTION'}
                </Badge>
              </div>

              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Objet de la dépense</p>
                  <p className="text-sm font-medium text-gray-900 truncate">{alerte.objet}</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Montant Demandé</p>
                    <p className="text-lg font-bold text-gray-900">{formatMontant(alerte.montant)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 uppercase font-bold">Crédits AE Disponibles</p>
                    <p className={`text-lg font-bold ${isOver ? 'text-danger-600' : 'text-warning-600'}`}>
                      {formatMontant(alerte.ae_disponible)}
                    </p>
                  </div>
                </div>

                <div className="flex space-x-3">
                  <Button
                    className="flex-1"
                    size="sm"
                    onClick={() => (window.location.href = `/controleur/checklist/${alerte.id}`)}
                  >
                    Examiner le dossier
                  </Button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {alertes.length === 0 && (
        <EmptyState
          title="Aucune dérive détectée"
          description="Tous les engagements en attente respectent les crédits disponibles sur leurs lignes budgétaires."
        />
      )}
    </div>
  );
}
