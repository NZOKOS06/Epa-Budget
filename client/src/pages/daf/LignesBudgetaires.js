import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../../components/ui';

export default function DAFLignesBudgetaires() {
  const [lignes, setLignes] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [selectedProgramme, setSelectedProgramme] = useState('');
  const [annee, setAnnee] = useState(new Date().getFullYear());
  const [codeNature, setCodeNature] = useState('');
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentLigne, setCurrentLigne] = useState(null);
  const [formData, setFormData] = useState({
    code: '',
    libelle: '',
    ae_initial: '',
    cp_initial: '',
    id_chapitre: '',
  });

  const fetchProgrammes = useCallback(async () => {
    try {
      const response = await api.get('/daf/programmes');
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

  const fetchLignes = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get('/daf/lignes-budgetaires', {
        params: { 
          programme_id: selectedProgramme,
          annee: annee 
        },
      });
      setLignes(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [selectedProgramme, annee]);

  useEffect(() => {
    if (selectedProgramme) {
      fetchLignes();
    } else {
      setLignes([]);
    }
  }, [selectedProgramme, annee, fetchLignes]);

  const handleOpenCreate = () => {
    setIsEditing(false);
    setFormData({
      code: '',
      libelle: '',
      ae_initial: '',
      cp_initial: '',
      id_chapitre: selectedProgramme,
    });
    setShowModal(true);
  };

  const handleEdit = (ligne) => {
    setIsEditing(true);
    setCurrentLigne(ligne);
    setFormData({
      code: ligne.code,
      libelle: ligne.libelle,
      ae_initial: ligne.ae_initial,
      cp_initial: ligne.cp_initial,
      id_chapitre: ligne.id_chapitre,
    });
    setShowModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isEditing) {
        await api.put(`/daf/lignes-budgetaires/${currentLigne.id}`, {
          ...formData,
          ae_initial: parseFloat(formData.ae_initial),
          cp_initial: parseFloat(formData.cp_initial),
        });
      } else {
        await api.post('/daf/lignes-budgetaires', {
          ...formData,
          code: formData.code,
          ae_initial: parseFloat(formData.ae_initial),
          cp_initial: parseFloat(formData.cp_initial),
        });
      }
      setShowModal(false);
      fetchLignes();
    } catch (error) {
      alert(error.response?.data?.message || 'Erreur lors de l\'enregistrement');
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const getPercentageEngage = (initial, restant) => {
    if (!initial || initial === 0) return 0;
    const engage = initial - restant;
    return Math.round((engage / initial) * 100);
  };

  const getStatut = (ligne) => {
    const pourcentage = getPercentageEngage(ligne.ae_initial, ligne.ae_restant);
    if (ligne.ae_restant <= 0) return { label: 'Épuisé', variant: 'danger' };
    if (pourcentage >= 80) return { label: 'Attention', variant: 'warning' };
    return { label: 'Disponible', variant: 'success' };
  };

  // Filtrer les lignes par code
  const lignesFiltrees = codeNature
    ? lignes.filter(ligne => ligne.code?.toLowerCase().includes(codeNature.toLowerCase()))
    : lignes;

  // Calculer les alertes
  const lignesEpusees = lignesFiltrees.filter(l => l.ae_restant <= 0);
  const lignesSeuilDepasse = lignesFiltrees.filter(l => getPercentageEngage(l.ae_initial, l.ae_restant) >= 80);
  
  // Calculer masse salariale (simplifié - devrait être calculé depuis les données)
  const masseSalariale = lignesFiltrees
    .filter(l => l.code_nature?.startsWith('60')) // Codes nature 60 = personnel
    .reduce((sum, l) => sum + (l.ae_initial || 0), 0);
  const budgetTotal = lignesFiltrees.reduce((sum, l) => sum + (l.ae_initial || 0), 0);
  const pourcentageMasseSalariale = budgetTotal > 0 ? (masseSalariale / budgetTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Lignes Budgétaires</h1>
          <p className="text-gray-600 mt-1">Gestion détaillée des lignes budgétaires avec crédits AE/CP</p>
        </div>
        <Button onClick={handleOpenCreate} className="flex items-center" disabled={!selectedProgramme}>
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Ajouter une Ligne
        </Button>
      </div>

      {/* Filtres Principaux - Selon documentation */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Programme
            </label>
            <select
              value={selectedProgramme}
              onChange={(e) => setSelectedProgramme(e.target.value)}
              className="input-field"
            >
              <option value="">Sélectionner un programme</option>
              {programmes.map((prog) => (
                <option key={prog.id} value={prog.id}>
                  {prog.code} - {prog.libelle}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Année
            </label>
            <select
              value={annee}
              onChange={(e) => setAnnee(parseInt(e.target.value))}
              className="input-field"
            >
              {[new Date().getFullYear(), new Date().getFullYear() - 1].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Code Nature
            </label>
            <input
              type="text"
              value={codeNature}
              onChange={(e) => setCodeNature(e.target.value)}
              className="input-field"
              placeholder="Ex: 70.01, 60.02"
            />
          </div>
        </div>
      </Card>

      {/* Alertes - Selon documentation */}
      {(pourcentageMasseSalariale > 50 || lignesEpusees.length > 0 || lignesSeuilDepasse.length > 0) && (
        <div className="space-y-3">
          {pourcentageMasseSalariale > 50 && (
            <Card className="bg-warning-50 border-warning-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-warning-900">
                    ⚠️ Masse Salariale: {pourcentageMasseSalariale.toFixed(1)}%
                  </p>
                  <p className="text-xs text-warning-700">La masse salariale dépasse 50% du budget total</p>
                </div>
              </div>
            </Card>
          )}
          
          {lignesEpusees.length > 0 && (
            <Card className="bg-danger-50 border-danger-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-danger-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-danger-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-danger-900">
                    🔴 Crédits Épuisés: {lignesEpusees.length} ligne(s)
                  </p>
                  <p className="text-xs text-danger-700">Lignes sans crédit disponible</p>
                </div>
              </div>
            </Card>
          )}
          
          {lignesSeuilDepasse.length > 0 && (
            <Card className="bg-warning-50 border-warning-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-warning-100 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-warning-900">
                    🟡 Seuil Dépassé: {lignesSeuilDepasse.length} ligne(s)
                  </p>
                  <p className="text-xs text-warning-700">Lignes engagées à plus de 80%</p>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Tableau des Lignes Budgétaires - Selon documentation */}
      {selectedProgramme ? (
        <Card>
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Tableau des Lignes Budgétaires</h2>
            <p className="text-sm text-gray-600 mt-1">
              {lignesFiltrees.length} ligne(s) trouvée(s)
            </p>
          </div>

          {loading ? (
            <LoadingSpinner message="Chargement des lignes..." />
          ) : lignesFiltrees.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Code Nature</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead className="text-right">AE Initial</TableHead>
                  <TableHead className="text-right">CP Initial</TableHead>
                  <TableHead className="text-right">AE Restant</TableHead>
                  <TableHead className="text-right">CP Restant</TableHead>
                  <TableHead>% Engagé</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableHeader>
                <TableBody>
                  {lignesFiltrees.map((ligne) => {
                    const pourcentage = getPercentageEngage(ligne.ae_initial, ligne.ae_restant);
                    const statut = getStatut(ligne);
                    const programme = programmes.find(p => p.id === ligne.programme_id);
                    
                    return (
                      <TableRow key={ligne.id}>
                        <TableCell>
                          <span className="font-semibold text-primary-600">{ligne.code}</span>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium text-gray-900">{ligne.libelle}</span>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-700">{ligne.chapitre_code || 'N/A'}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-gray-900">
                            {formatMontant(ligne.ae_initial || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-semibold text-gray-900">
                            {formatMontant(ligne.cp_initial || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${
                            ligne.ae_restant <= 0 ? 'text-danger-600' : 'text-gray-900'
                          }`}>
                            {formatMontant(ligne.ae_restant || 0)}
                          </span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className={`font-semibold ${
                            ligne.cp_restant <= 0 ? 'text-danger-600' : 'text-gray-900'
                          }`}>
                            {formatMontant(ligne.cp_restant || 0)}
                          </span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div
                                className={`h-2 rounded-full ${
                                  pourcentage >= 80 ? 'bg-danger-500' :
                                  pourcentage >= 50 ? 'bg-warning-500' :
                                  'bg-success-500'
                                }`}
                                style={{ width: `${Math.min(pourcentage, 100)}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-10">{pourcentage}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={statut.variant}>{statut.label}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button size="sm" variant="outline" onClick={() => handleEdit(ligne)}>
                            Modifier
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
              title="Aucune ligne trouvée"
              description="Modifiez les filtres pour voir plus de résultats"
            />
          )}
        </Card>
      ) : (
        <Card>
          <EmptyState
            title="Sélectionnez un programme"
            description="Choisissez un programme dans le filtre ci-dessus pour voir les lignes budgétaires"
          />
        </Card>
      )}

      {/* Modal Création/Modification Ligne */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h3 className="text-xl font-semibold text-gray-900">
                {isEditing ? 'Modifier la Ligne' : 'Nouvelle Ligne Budgétaire'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {isEditing ? 'Mettre à jour les crédits ou le libellé' : 'Associer une nouvelle nature de dépense au programme'}
              </p>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Code Nature</label>
                <input
                  type="text"
                  required
                  disabled={isEditing}
                  className={`input-field ${isEditing ? 'bg-gray-100' : ''}`}
                  placeholder="Ex: 60.01"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Libellé</label>
                <input
                  type="text"
                  required
                  className="input-field"
                  placeholder="Ex: Achats de fournitures"
                  value={formData.libelle}
                  onChange={(e) => setFormData({ ...formData, libelle: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">AE Initial</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input-field"
                    placeholder="0"
                    value={formData.ae_initial}
                    onChange={(e) => setFormData({ ...formData, ae_initial: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1">CP Initial</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input-field"
                    placeholder="0"
                    value={formData.cp_initial}
                    onChange={(e) => setFormData({ ...formData, cp_initial: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Programme</label>
                <select
                  disabled
                  className="input-field bg-gray-100"
                  value={formData.id_chapitre}
                >
                  {programmes.map(p => (
                    <option key={p.id} value={p.id}>{p.code} - {p.libelle}</option>
                  ))}
                </select>
              </div>
              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1">
                  {isEditing ? 'Enregistrer' : 'Créer'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
