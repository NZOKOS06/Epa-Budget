import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Card, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Button, Calendar } from '../../components/ui';

export default function ServicesProgrammes() {
  const [programmes, setProgrammes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchProgrammes = useCallback(async () => {
    try {
      const response = await api.get('/services/programmes');
      setProgrammes(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProgrammes();
  }, [fetchProgrammes]);

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des programmes..." />;
  }

  // Calendrier des sessions démo (pourrait venir de l'API)
  const prochaineSession = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 15);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Actions Programme</h1>
          <p className="text-gray-600 mt-1">Consultation des programmes et suivi de leur exécution</p>
        </div>
      </div>

      {/* Liste des programmes */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Programmes de l'EPA</h2>
          <p className="text-sm text-gray-600 mt-1">
            {programmes.length} programme(s) disponible(s)
          </p>
        </div>

        {programmes.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Code</TableHead>
                <TableHead>Libellé</TableHead>
                <TableHead className="text-right">Budget Initial</TableHead>
                <TableHead className="text-right">Montant Engagé</TableHead>
                <TableHead className="text-right">Montant Payé</TableHead>
                <TableHead>Taux d'Exécution</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {programmes.map((prog) => {
                  const budgetInitial = parseFloat(prog.budget_initial) || 0;
                  const montantEngage = parseFloat(prog.montant_engage) || 0;
                  const montantPaye = parseFloat(prog.montant_paye) || 0;
                  const tauxExecution = budgetInitial > 0 ? Math.round((montantEngage / budgetInitial) * 100) : 0;

                  return (
                    <TableRow key={prog.id}>
                      <TableCell>
                        <span className="font-semibold text-primary-600">{prog.code}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-900 font-medium">{prog.libelle}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-gray-700">{formatMontant(budgetInitial)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-gray-900 font-medium">{formatMontant(montantEngage)}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-success-600 font-medium">{formatMontant(montantPaye)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-full bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full ${tauxExecution > 90 ? 'bg-danger-500' : tauxExecution > 70 ? 'bg-warning-500' : 'bg-primary-500'}`}
                              style={{ width: `${Math.min(tauxExecution, 100)}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600 w-8">{tauxExecution}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          Voir détails
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Aucun programme"
            description="Aucun programme n'a été trouvé pour votre EPA."
          />
        )}
      </Card>

      {/* Calendrier des sessions */}
      <Card>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendrier des Sessions</h2>
        <Calendar
          events={[
            {
              id: 1,
              date: prochaineSession,
              title: 'Session d\'approbation mensuelle',
              color: '#2563EB',
            },
          ]}
          selectedDate={prochaineSession}
        />
        <div className="mt-4 p-4 bg-primary-50 rounded-lg">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-primary-900">Prochaine session d'approbation</p>
              <p className="text-xs text-primary-700">
                {prochaineSession.toLocaleDateString('fr-FR', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
