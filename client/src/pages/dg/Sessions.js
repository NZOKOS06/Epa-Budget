import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Calendar, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../../components/ui';

export default function DGSessions() {
  const [sessions, setSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showVoteModal, setShowVoteModal] = useState(false);

  const fetchSessions = useCallback(async () => {
    try {
      const response = await api.get('/dg/sessions');
      const data = response.data || [];
      setSessions(data);
      // Sélectionner la première session par défaut si aucune n'est sélectionnée
      if (data.length > 0 && !selectedSession) {
        setSelectedSession(data[0]);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedSession]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  // Préparer les événements pour le calendrier
  const sessionEvents = sessions.map(session => ({
    id: session.mois,
    date: new Date(session.date_session || session.mois),
    title: `Session ${format(new Date(session.mois), 'MMMM yyyy', { locale: fr })}`,
    nbEngagements: session.nb_engagements,
    totalMontant: session.total_montant
  }));

  const handleDateClick = (date) => {
    // Trouver la session correspondante
    const session = sessions.find(s => {
      const sessionDate = new Date(s.mois);
      return sessionDate.getMonth() === date.getMonth() && 
             sessionDate.getFullYear() === date.getFullYear();
    });
    if (session) {
      setSelectedSession(session);
    }
  };

  const handleLancerVote = () => {
    setShowVoteModal(true);
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des sessions..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">Sessions</h1>
        <p className="text-gray-500 mt-1">Visualisation des sessions d'approbation mensuelles et e-voting</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Calendrier des Sessions - Selon documentation */}
        <div className="lg:col-span-2">
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Calendrier des Sessions</h2>
            <Calendar
              events={sessionEvents}
              onDateClick={handleDateClick}
              selectedDate={selectedSession ? new Date(selectedSession.mois) : null}
            />
          </Card>
        </div>

        {/* Détails de Session - Selon documentation */}
        <div>
          {selectedSession ? (
            <Card>
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                  Session {format(new Date(selectedSession.mois), 'MMMM yyyy', { locale: fr })}
                </h2>
                
                {/* Période */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Période</p>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(selectedSession.mois), 'MMMM yyyy', { locale: fr })}
                  </p>
                </div>

                {/* Nombre d'engagements */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Nombre d'engagements</p>
                  <p className="font-semibold text-gray-900">{selectedSession.nb_engagements || 0}</p>
                </div>

                {/* Montant total */}
                <div className="mb-3">
                  <p className="text-sm text-gray-600">Montant total</p>
                  <p className="font-semibold text-gray-900">
                    {formatMontant(selectedSession.total_montant || 0)}
                  </p>
                </div>

                {/* Date de session */}
                {selectedSession.date_session && (
                  <div className="mb-4">
                    <p className="text-sm text-gray-600">Date de session</p>
                    <p className="font-semibold text-gray-900">
                      {format(new Date(selectedSession.date_session), 'dd/MM/yyyy', { locale: fr })}
                    </p>
                  </div>
                )}
              </div>

              {/* Bouton e-vote si applicable */}
              <Button
                onClick={handleLancerVote}
                className="w-full"
              >
                Lancer e-vote
              </Button>
            </Card>
          ) : (
            <Card>
              <EmptyState
                title="Aucune session disponible"
                description="Les sessions d'approbation apparaîtront ici"
              />
            </Card>
          )}
        </div>
      </div>

      {/* Liste des Engagements de la Session - Selon documentation */}
      {selectedSession && selectedSession.engagements && (
        <Card>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Liste des Engagements de la Session
          </h2>
          {selectedSession.engagements.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Numéro d'engagement</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead>Service demandeur</TableHead>
                  <TableHead>Date d'approbation</TableHead>
                </TableHeader>
                <TableBody>
                  {selectedSession.engagements.map((eng) => (
                    <TableRow key={eng.id} hover>
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
                          {eng.approbation_dg_date 
                            ? format(new Date(eng.approbation_dg_date), 'dd/MM/yyyy', { locale: fr })
                            : 'N/A'
                          }
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <EmptyState
              title="Aucun engagement dans cette session"
              description="Les engagements approuvés apparaîtront ici"
            />
          )}
        </Card>
      )}

      {/* Modal E-Voting - Selon documentation */}
      {showVoteModal && selectedSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">E-Voting</h3>
              <button
                onClick={() => setShowVoteModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-4">
                  Session {format(new Date(selectedSession.mois), 'MMMM yyyy', { locale: fr })}
                </h4>
                <p className="text-sm text-gray-600">
                  Votez pour chaque engagement de la session
                </p>
              </div>

              {selectedSession.engagements && selectedSession.engagements.length > 0 ? (
                <div className="space-y-4">
                  {selectedSession.engagements.map((eng) => (
                    <div key={eng.id} className="border rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="font-semibold text-gray-900">{eng.numero}</p>
                          <p className="text-sm text-gray-600">{eng.objet || 'N/A'}</p>
                        </div>
                        <p className="font-semibold text-gray-900">
                          {formatMontant(eng.montant)}
                        </p>
                      </div>
                      <div className="flex space-x-3">
                        <Button variant="success" size="sm" className="flex-1">
                          Pour
                        </Button>
                        <Button variant="danger" size="sm" className="flex-1">
                          Contre
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="Aucun engagement à voter"
                  description="Les engagements de la session apparaîtront ici"
                />
              )}

              <div className="flex space-x-3 mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowVoteModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    // Logique de validation des votes
                    alert('Votes enregistrés avec succès');
                    setShowVoteModal(false);
                  }}
                >
                  Valider les votes
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
