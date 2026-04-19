import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, LineChart } from '../../components/ui';

export default function DAFProgrammes() {
  const [programmes, setProgrammes] = useState([]);
  const [filteredProgrammes, setFilteredProgrammes] = useState([]);
  const [selectedProgramme, setSelectedProgramme] = useState(null);
  const [loading, setLoading] = useState(true);
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [searchTerm, setSearchTerm] = useState('');
  const [showModalCreate, setShowModalCreate] = useState(false);
  const [newProgramme, setNewProgramme] = useState({
    code: '',
    libelle: '',
    budget_initial: '',
  });

  useEffect(() => {
    fetchProgrammes();
  }, []);

  useEffect(() => {
    // Filtrer les programmes
    let filtered = programmes;
    
    if (annee) {
      filtered = filtered.filter(prog => prog.annee === annee);
    }
    
    if (searchTerm) {
      filtered = filtered.filter(prog => 
        prog.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        prog.libelle?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredProgrammes(filtered);
  }, [programmes, annee, searchTerm]);

  const fetchProgrammes = async () => {
    try {
      const response = await api.get('/daf/programmes');
      setProgrammes(response.data || []);
      setFilteredProgrammes(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVoirDetails = async (programme) => {
    try {
      // Récupérer les détails complets du programme
      const response = await api.get(`/daf/programmes/${programme.id}`);
      setSelectedProgramme(response.data);
    } catch (error) {
      console.error('Erreur:', error);
      // Si l'API n'existe pas, utiliser les données de base
      setSelectedProgramme(programme);
    }
  };

  const handleCreateProgramme = async (e) => {
    e.preventDefault();
    try {
      await api.post('/daf/programmes', {
        ...newProgramme,
        budget_initial: parseFloat(newProgramme.budget_initial)
      });
      setShowModalCreate(false);
      setNewProgramme({ code: '', libelle: '', budget_initial: '' });
      fetchProgrammes();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de la création du programme');
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const calculateTauxExecution = (paye, initial) => {
    if (!initial || initial === 0) return 0;
    return Math.round((paye / initial) * 100);
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des programmes..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Budget-Programme</h1>
          <p className="text-gray-600 mt-1">Gestion et suivi des programmes budgétaires de l'EPA</p>
        </div>
        <Button onClick={() => setShowModalCreate(true)} className="flex items-center">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Créer un Programme
        </Button>
      </div>

      {/* Filtres - Selon documentation */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année
            </label>
            <select
              value={annee}
              onChange={(e) => setAnnee(parseInt(e.target.value))}
              className="input-field"
            >
              {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Code ou libellé..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Liste des Programmes - Selon documentation */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Liste des Programmes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredProgrammes.length} programme(s) de l'année {annee}
          </p>
        </div>

        {filteredProgrammes.length > 0 ? (
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
                {filteredProgrammes.map((prog) => {
                  const montantEngage = prog.montant_engage || 0;
                  const montantPaye = prog.montant_paye || 0;
                  const tauxExecution = calculateTauxExecution(montantPaye, prog.budget_initial);
                  
                  return (
                    <TableRow key={prog.id}>
                      <TableCell>
                        <span className="font-semibold text-primary-600">{prog.code}</span>
                      </TableCell>
                      <TableCell>
                        <span className="font-medium text-gray-900">{prog.libelle}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">
                          {formatMontant(prog.budget_initial || 0)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">
                          {formatMontant(montantEngage)}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">
                          {formatMontant(montantPaye)}
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
                        <Button
                          onClick={() => handleVoirDetails(prog)}
                          size="sm"
                          variant="outline"
                        >
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
            description="Aucun programme trouvé pour les critères sélectionnés"
          />
        )}
      </Card>

      {/* Vue Détails d'un Programme - Selon documentation */}
      {selectedProgramme && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Détails du Programme</h2>
              <p className="text-sm text-gray-600 mt-1">
                {selectedProgramme.code} - {selectedProgramme.libelle}
              </p>
            </div>
            <Button variant="outline" onClick={() => setSelectedProgramme(null)}>
              Fermer
            </Button>
          </div>

          {/* Informations générales */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Informations Générales</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Code</p>
                <p className="font-semibold text-gray-900">{selectedProgramme.code}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Libellé</p>
                <p className="font-semibold text-gray-900">{selectedProgramme.libelle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Budget Initial</p>
                <p className="font-semibold text-gray-900">
                  {formatMontant(selectedProgramme.budget_initial || 0)}
                </p>
              </div>
            </div>
          </div>

          {/* Statistiques d'exécution */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Statistiques d'Exécution</h3>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="p-4 bg-gray-50 rounded-lg">
                <p className="text-sm text-gray-600">Budget initial</p>
                <p className="text-xl font-bold text-gray-900 mt-1">
                  {formatMontant(selectedProgramme.budget_initial || 0)}
                </p>
              </div>
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-700">Engagements totaux</p>
                <p className="text-xl font-bold text-primary-900 mt-1">
                  {formatMontant(selectedProgramme.montant_engage || 0)}
                </p>
              </div>
              <div className="p-4 bg-success-50 rounded-lg">
                <p className="text-sm text-success-700">Paiements totaux</p>
                <p className="text-xl font-bold text-success-900 mt-1">
                  {formatMontant(selectedProgramme.montant_paye || 0)}
                </p>
              </div>
              <div className="p-4 bg-warning-50 rounded-lg">
                <p className="text-sm text-warning-700">Reste à engager</p>
                <p className="text-xl font-bold text-warning-900 mt-1">
                  {formatMontant((selectedProgramme.budget_initial || 0) - (selectedProgramme.montant_engage || 0))}
                </p>
              </div>
              <div className="p-4 bg-info-50 rounded-lg">
                <p className="text-sm text-info-700">Reste à payer</p>
                <p className="text-xl font-bold text-info-900 mt-1">
                  {formatMontant((selectedProgramme.montant_engage || 0) - (selectedProgramme.montant_paye || 0))}
                </p>
              </div>
            </div>
          </div>

          {/* Graphique d'évolution */}
          {selectedProgramme.evolutionMensuelle && selectedProgramme.evolutionMensuelle.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Graphique d'Évolution</h3>
              <LineChart
                data={selectedProgramme.evolutionMensuelle.map(item => ({
                  name: format(new Date(item.mois), 'MMM', { locale: fr }),
                  value: parseFloat(item.total_montant || 0)
                }))}
                xKey="name"
                yKey="value"
                height={300}
              />
            </div>
          )}

          {/* Liste des engagements */}
          {selectedProgramme.engagements && selectedProgramme.engagements.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Liste des Engagements</h3>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableHead>Numéro</TableHead>
                    <TableHead>Objet</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date</TableHead>
                  </TableHeader>
                  <TableBody>
                    {selectedProgramme.engagements.map((eng) => (
                      <TableRow key={eng.id}>
                        <TableCell>
                          <span className="font-semibold text-primary-600">{eng.numero}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-900">{eng.objet || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-gray-900">
                            {formatMontant(eng.montant)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge variant={
                            eng.statut === 'PAYE' ? 'success' :
                            eng.statut === 'APPROUVE' ? 'info' :
                            'warning'
                          }>
                            {eng.statut}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-600">
                            {format(new Date(eng.created_at), 'dd/MM/yyyy', { locale: fr })}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Modal Création Programme */}
      {showModalCreate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-bold text-gray-900">Nouveau Programme</h3>
              <p className="text-sm text-gray-500 mt-1">Ajouter un nouveau chapitre budgétaire</p>
            </div>
            <form onSubmit={handleCreateProgramme} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Code du Programme</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Ex: PROG-001"
                  value={newProgramme.code}
                  onChange={(e) => setNewProgramme({ ...newProgramme, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Libellé</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Ex: Administration Générale"
                  value={newProgramme.libelle}
                  onChange={(e) => setNewProgramme({ ...newProgramme, libelle: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Budget Initial (FCFA)</label>
                <input
                  type="number"
                  required
                  min="0"
                  className="input-field"
                  placeholder="0"
                  value={newProgramme.budget_initial}
                  onChange={(e) => setNewProgramme({ ...newProgramme, budget_initial: e.target.value })}
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModalCreate(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1">
                  Créer
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
