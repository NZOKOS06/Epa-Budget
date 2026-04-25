import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, LineChart, PageHeader, FilterBar, ProgressBar, StatusBadge } from '../../components/ui';

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

  // KPIs globaux
  const totalBudget = filteredProgrammes.reduce((s, p) => s + (p.budget_initial || 0), 0);
  const totalEngage = filteredProgrammes.reduce((s, p) => s + (p.montant_engage || 0), 0);
  const totalPaye = filteredProgrammes.reduce((s, p) => s + (p.montant_paye || 0), 0);
  const tauxGlobal = totalBudget > 0 ? Math.round((totalPaye / totalBudget) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header premium avec KPIs */}
      <PageHeader
        title="Budget-Programme"
        subtitle="Gestion et suivi des programmes budgétaires de l'EPA"
        kpis={[
          {
            label: 'Budget Total',
            value: formatMontant(totalBudget),
            sub: `${filteredProgrammes.length} programmes`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
          {
            label: 'Montant Engagé',
            value: formatMontant(totalEngage),
            sub: `${totalBudget > 0 ? Math.round((totalEngage / totalBudget) * 100) : 0}% du budget`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            ),
          },
          {
            label: 'Montant Payé',
            value: formatMontant(totalPaye),
            sub: `${totalBudget > 0 ? Math.round((totalPaye / totalBudget) * 100) : 0}% du budget`,
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            ),
          },
          {
            label: "Taux d'Exécution Global",
            value: `${tauxGlobal}%`,
            sub: 'Objectif 100%',
            icon: (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            ),
          },
        ]}
      >
        <Button onClick={() => setShowModalCreate(true)} className="flex items-center shadow-md hover:shadow-lg">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Créer un Programme
        </Button>
      </PageHeader>

      {/* Filtres */}
      <FilterBar>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-gray-600">Année</label>
          <select
            value={annee}
            onChange={(e) => setAnnee(parseInt(e.target.value))}
            className="input-field py-1.5 w-32"
          >
            {[new Date().getFullYear(), new Date().getFullYear() - 1, new Date().getFullYear() - 2].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center space-x-2 flex-1 min-w-[200px]">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="input-field py-1.5 border-0 bg-transparent focus:ring-0 w-full"
            placeholder="Rechercher par code ou libellé..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </FilterBar>

      {/* Liste des Programmes */}
      <Card>
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-gray-900">Liste des Programmes</h2>
          <p className="text-sm text-gray-500 mt-0.5">
            {filteredProgrammes.length} programme(s) de l'année {annee}
          </p>
        </div>

        {filteredProgrammes.length > 0 ? (
          <Table striped>
            <TableHeader>
              <TableHead>Code</TableHead>
              <TableHead>Libellé</TableHead>
              <TableHead className="text-right">Budget Initial</TableHead>
              <TableHead className="text-right">Montant Engagé</TableHead>
              <TableHead className="text-right">Montant Payé</TableHead>
              <TableHead className="w-48">Taux d'Exécution</TableHead>
              <TableHead className="text-right">Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {filteredProgrammes.map((prog) => {
                const montantEngage = prog.montant_engage || 0;
                const montantPaye = prog.montant_paye || 0;
                const tauxExecution = calculateTauxExecution(montantPaye, prog.budget_initial);

                return (
                  <TableRow key={prog.id} onClick={() => handleVoirDetails(prog)} hover>
                    <TableCell>
                      <span className="font-semibold text-primary-700">{prog.code}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-900">{prog.libelle}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-gray-900">
                        {formatMontant(prog.budget_initial || 0)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-gray-900">
                        {formatMontant(montantEngage)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-medium text-gray-900">
                        {formatMontant(montantPaye)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <ProgressBar value={tauxExecution} size="sm" showLabel />
                    </TableCell>
                    <TableCell className="text-right">
                      <StatusBadge value={tauxExecution} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={(e) => { e.stopPropagation(); handleVoirDetails(prog); }}
                        size="sm"
                        variant="outline"
                      >
                        Voir
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        ) : (
          <EmptyState
            title="Aucun programme"
            description="Aucun programme trouvé pour les critères sélectionnés"
            action={
              <Button variant="outline" onClick={() => { setSearchTerm(''); setAnnee(new Date().getFullYear()); }}>
                Réinitialiser les filtres
              </Button>
            }
          />
        )}
      </Card>

      {/* Vue Détails d'un Programme - Selon documentation */}
      {selectedProgramme && (
        <Card>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Détails du Programme</h2>
              <p className="text-sm text-gray-500 mt-1">
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
                <p className="text-xl font-semibold text-gray-900 mt-1">
                  {formatMontant(selectedProgramme.budget_initial || 0)}
                </p>
              </div>
              <div className="p-4 bg-primary-50 rounded-lg">
                <p className="text-sm text-primary-700">Engagements totaux</p>
                <p className="text-xl font-semibold text-primary-900 mt-1">
                  {formatMontant(selectedProgramme.montant_engage || 0)}
                </p>
              </div>
              <div className="p-4 bg-success-50 rounded-lg">
                <p className="text-sm text-success-700">Paiements totaux</p>
                <p className="text-xl font-semibold text-success-900 mt-1">
                  {formatMontant(selectedProgramme.montant_paye || 0)}
                </p>
              </div>
              <div className="p-4 bg-warning-50 rounded-lg">
                <p className="text-sm text-warning-700">Reste à engager</p>
                <p className="text-xl font-semibold text-warning-900 mt-1">
                  {formatMontant((selectedProgramme.budget_initial || 0) - (selectedProgramme.montant_engage || 0))}
                </p>
              </div>
              <div className="p-4 bg-info-50 rounded-lg">
                <p className="text-sm text-info-700">Reste à payer</p>
                <p className="text-xl font-semibold text-info-900 mt-1">
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
                      <TableRow key={eng.id} hover>
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
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">Nouveau Programme</h3>
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
