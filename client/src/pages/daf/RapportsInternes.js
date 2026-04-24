import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, LineChart } from '../../components/ui';

export default function DAFRapportsInternes() {
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedMois, setSelectedMois] = useState(new Date().getMonth() + 1);
  const [selectedAnnee, setSelectedAnnee] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchRapports();
  }, []);

  const fetchRapports = async () => {
    try {
      const response = await api.get('/daf/rapports-internes');
      setRapports(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenererRapport = async () => {
    try {
      await api.post('/daf/rapports-internes/generer', {
        mois: selectedMois,
        annee: selectedAnnee
      });
      setShowGenerateModal(false);
      fetchRapports();
      alert('Rapport généré avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la génération du rapport');
    }
  };

  const handleExportPDF = async (rapportId) => {
    try {
      window.open(`/api/daf/rapports-internes/${rapportId}/export`, '_blank');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'export PDF');
    }
  };

  const handlePrevisualiser = (rapport) => {
    // Logique de prévisualisation
    console.log('Prévisualiser rapport:', rapport.id);
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const calculateTauxExecution = (paye, engage) => {
    if (!engage || engage === 0) return 0;
    return Math.round((paye / engage) * 100);
  };

  // Préparer les données pour le graphique
  const graphiqueData = rapports.slice(0, 12).map(rapport => ({
    name: format(new Date(rapport.mois), 'MMM', { locale: fr }),
    engage: rapport.total_engage || 0,
    paye: rapport.total_paye || 0,
  }));

  if (loading) {
    return <LoadingSpinner message="Chargement des rapports..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rapports Internes</h1>
          <p className="text-gray-600 mt-1">Génération de rapports mensuels d'exécution budgétaire</p>
        </div>
        <Button onClick={() => setShowGenerateModal(true)}>
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Générer Rapport
        </Button>
      </div>

      {/* Graphique d'Évolution - Selon documentation */}
      {rapports.length > 0 && (
        <Card>
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Graphique d'Évolution</h2>
            <p className="text-sm text-gray-600 mt-1">Évolution mensuelle des engagements - Les 12 derniers mois</p>
          </div>
          <LineChart
            data={graphiqueData.map(item => ({
              name: item.name,
              value: item.engage
            }))}
            xKey="name"
            yKey="value"
            height={300}
          />
        </Card>
      )}

      {/* Liste des Rapports - Selon documentation */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Liste des Rapports</h2>
          <p className="text-sm text-gray-600 mt-1">
            Rapports mensuels d'exécution budgétaire
          </p>
        </div>

        {rapports.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Période</TableHead>
                <TableHead className="text-right">Nombre d'Engagements</TableHead>
                <TableHead className="text-right">Total Engagé</TableHead>
                <TableHead className="text-right">Nombre Payé</TableHead>
                <TableHead className="text-right">Total Payé</TableHead>
                <TableHead>Taux d'Exécution</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {rapports.map((rapport) => {
                  const tauxExecution = calculateTauxExecution(rapport.total_paye, rapport.total_engage);
                  const rowKey = rapport.id || rapport.mois || `${rapport.nb_engagements || 0}-${rapport.total_engage || 0}`;
                  
                  return (
                    <TableRow key={rowKey}>
                      <TableCell>
                        <span className="font-semibold text-gray-900">
                          {format(new Date(rapport.mois), 'MMMM yyyy', { locale: fr })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">
                          {rapport.nb_engagements || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">
                          {formatMontant(rapport.total_engagements || rapport.total_engage || 0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">
                          {rapport.nb_payes || 0}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">
                          {formatMontant(rapport.total_payes || rapport.total_paye || 0)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div
                              className={`h-2 rounded-full ${
                                tauxExecution >= 80 ? 'bg-success-500' :
                                tauxExecution >= 50 ? 'bg-warning-500' :
                                'bg-danger-500'
                              }`}
                              style={{ width: `${Math.min(tauxExecution, 100)}%` }}
                            />
                          </div>
                          <span className="text-sm text-gray-600 w-12">{tauxExecution}%</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handlePrevisualiser(rapport)}
                          >
                            Prévisualiser
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleExportPDF(rapport.id)}
                          >
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Télécharger PDF
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Aucun rapport disponible"
            description="Générez votre premier rapport mensuel"
            action={
              <Button onClick={() => setShowGenerateModal(true)}>
                Générer un rapport
              </Button>
            }
          />
        )}
      </Card>

      {/* Modal Génération Rapport - Selon documentation */}
      {showGenerateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Générer un Rapport</h3>
              <button
                onClick={() => setShowGenerateModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mois
                </label>
                <select
                  value={selectedMois}
                  onChange={(e) => setSelectedMois(parseInt(e.target.value))}
                  className="input-field"
                >
                  {[
                    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
                  ].map((mois, index) => (
                    <option key={index + 1} value={index + 1}>{mois}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Année
                </label>
                <select
                  value={selectedAnnee}
                  onChange={(e) => setSelectedAnnee(parseInt(e.target.value))}
                  className="input-field"
                >
                  {[new Date().getFullYear(), new Date().getFullYear() - 1].map(year => (
                    <option key={year} value={year}>{year}</option>
                  ))}
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowGenerateModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleGenererRapport}
                >
                  Générer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
