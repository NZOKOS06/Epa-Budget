import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../../components/ui';
import { getStatusMeta } from '../../utils/statusUtils';

export default function DAFModificatifs() {
  const [modificatifs, setModificatifs] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [lignesBudgetaires, setLignesBudgetaires] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(null);
  const [formData, setFormData] = useState({
    type: 'VIREMENT',
    programme_source_id: '',
    programme_destination_id: '',
    ligne_budgetaire_id: '',
    montant: '',
    motif: '',
  });

  const fetchModificatifs = useCallback(async () => {
    try {
      const response = await api.get('/daf/modificatifs');
      setModificatifs(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProgrammes = useCallback(async () => {
    try {
      const response = await api.get('/daf/programmes');
      setProgrammes(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    }
  }, []);

  useEffect(() => {
    fetchModificatifs();
    fetchProgrammes();
  }, [fetchModificatifs, fetchProgrammes]);

  const fetchLignesBudgetaires = useCallback(async () => {
    try {
      const programmeId = formData.programme_destination_id || formData.programme_source_id;
      if (programmeId) {
        const response = await api.get('/daf/lignes-budgetaires', {
          params: { programme_id: programmeId }
        });
        setLignesBudgetaires(response.data || []);
      }
    } catch (error) {
      console.error('Erreur:', error);
    }
  }, [formData.programme_destination_id, formData.programme_source_id]);

  useEffect(() => {
    if (formData.programme_source_id || formData.programme_destination_id) {
      fetchLignesBudgetaires();
    }
  }, [formData.programme_source_id, formData.programme_destination_id, fetchLignesBudgetaires]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post('/daf/modificatifs', formData);
      setShowForm(false);
      setFormData({
        type: 'VIREMENT',
        programme_source_id: '',
        programme_destination_id: '',
        ligne_budgetaire_id: '',
        montant: '',
        motif: '',
      });
      setPreview(null);
      fetchModificatifs();
      alert('Modificatif créé avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la création du modificatif');
    }
  };

  const handlePreview = () => {
    // Calculer le preview
    if (formData.type === 'VIREMENT') {
      // Pour virement, on ne peut pas prévisualiser sans les lignes des deux programmes
      const programmeSource = programmes.find(p => p.id === parseInt(formData.programme_source_id));
      const programmeDestination = programmes.find(p => p.id === parseInt(formData.programme_destination_id));
      
      if (programmeSource && programmeDestination) {
        setPreview({
          ancien_equilibre: programmeSource.budget_initial || 0,
          variation: -(parseFloat(formData.montant) || 0),
          nouveau_equilibre: (programmeSource.budget_initial || 0) - (parseFloat(formData.montant) || 0),
          destination: {
            ancien_equilibre: programmeDestination.budget_initial || 0,
            variation: parseFloat(formData.montant) || 0,
            nouveau_equilibre: (programmeDestination.budget_initial || 0) + (parseFloat(formData.montant) || 0)
          }
        });
      }
    } else {
      const ligne = lignesBudgetaires.find(l => l.id === parseInt(formData.ligne_budgetaire_id));
      if (ligne) {
        const ancienEquilibre = ligne.ae_initial || 0;
        let variation = 0;
        if (formData.type === 'AUGMENTATION') {
          variation = parseFloat(formData.montant) || 0;
        } else if (formData.type === 'ANNULATION') {
          variation = -(parseFloat(formData.montant) || 0);
        }
        setPreview({
          ancien_equilibre: ancienEquilibre,
          variation: variation,
          nouveau_equilibre: ancienEquilibre + variation,
        });
      }
    }
  };

  const handleSoumettre = async (id) => {
    if (window.confirm('Soumettre ce modificatif à la tutelle ?')) {
      try {
        await api.post(`/daf/modificatifs/${id}/soumettre`);
        fetchModificatifs();
        alert('Modificatif soumis à la tutelle');
      } catch (error) {
        console.error('Erreur:', error);
        alert('Erreur lors de la soumission');
      }
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const getTypeBadge = (type) => {
    switch(type) {
      case 'VIREMENT':
        return <Badge variant="info">🔵 VIREMENT</Badge>;
      case 'ANNULATION':
        return <Badge variant="danger">🔴 ANNULATION</Badge>;
      case 'AUGMENTATION':
        return <Badge variant="success">🟢 AUGMENTATION</Badge>;
      default:
        return <Badge>{type}</Badge>;
    }
  };

  const getStatutBadge = (statut) => {
    const meta = getStatusMeta(statut);
    return <Badge variant={meta.variant}>{meta.label}</Badge>;
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des modificatifs..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Modificatifs</h1>
          <p className="text-gray-600 mt-1">Gestion des modificatifs budgétaires (&gt;10% d'une ligne)</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau modificatif
        </Button>
      </div>

      {/* Liste des Modificatifs - Selon documentation */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Liste des Modificatifs</h2>
          <p className="text-sm text-gray-600 mt-1">
            {modificatifs.length} modificatif(s) enregistré(s)
          </p>
        </div>

        {modificatifs.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Numéro</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Programme Source</TableHead>
                <TableHead>Programme Destination</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {modificatifs.map((mod) => {
                  const programmeSource = programmes.find(p => p.id === mod.programme_source_id);
                  const programmeDestination = programmes.find(p => p.id === mod.programme_destination_id);
                  
                  return (
                    <TableRow key={mod.id}>
                      <TableCell>
                        <span className="font-semibold text-primary-600">{mod.numero || `MOD-${mod.id}`}</span>
                      </TableCell>
                      <TableCell>
                        {getTypeBadge(mod.type_modificatif || mod.type)}
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700">
                          {programmeSource ? `${programmeSource.code} - ${programmeSource.libelle}` : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700">
                          {programmeDestination ? `${programmeDestination.code} - ${programmeDestination.libelle}` : 'N/A'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">
                          {formatMontant(mod.montant)}
                        </span>
                      </TableCell>
                      <TableCell>
                        {getStatutBadge(mod.statut)}
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-600">
                          {format(new Date(mod.created_at), 'dd/MM/yyyy', { locale: fr })}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          {mod.statut === 'BROUILLON' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleSoumettre(mod.id)}
                              >
                                Soumettre
                              </Button>
                              <Button variant="ghost" size="sm">
                                Modifier
                              </Button>
                              <Button variant="ghost" size="sm">
                                Supprimer
                              </Button>
                            </>
                          )}
                          <Button variant="ghost" size="sm">
                            Voir détails
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
            title="Aucun modificatif"
            description="Créez un nouveau modificatif pour modifier une ligne budgétaire"
            action={
              <Button onClick={() => setShowForm(true)}>
                Créer un modificatif
              </Button>
            }
          />
        )}
      </Card>

      {/* Modal Formulaire - Selon documentation */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900">Nouveau Modificatif</h3>
              <button
                onClick={() => {
                  setShowForm(false);
                  setPreview(null);
                }}
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
                  Type de modificatif *
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field"
                  required
                >
                  <option value="VIREMENT">🔵 VIREMENT - Transfert entre programmes</option>
                  <option value="ANNULATION">🔴 ANNULATION - Annulation de crédits</option>
                  <option value="AUGMENTATION">🟢 AUGMENTATION - Ajout de crédits</option>
                </select>
              </div>

              {formData.type === 'VIREMENT' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Programme Source *
                    </label>
                    <select
                      value={formData.programme_source_id}
                      onChange={(e) => setFormData({ ...formData, programme_source_id: e.target.value })}
                      className="input-field"
                      required={formData.type === 'VIREMENT'}
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
                      Programme Destination *
                    </label>
                    <select
                      value={formData.programme_destination_id}
                      onChange={(e) => setFormData({ ...formData, programme_destination_id: e.target.value })}
                      className="input-field"
                      required={formData.type === 'VIREMENT'}
                    >
                      <option value="">Sélectionner un programme</option>
                      {programmes.map((prog) => (
                        <option key={prog.id} value={prog.id}>
                          {prog.code} - {prog.libelle}
                        </option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {formData.type !== 'VIREMENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Ligne Budgétaire
                  </label>
                  <select
                    value={formData.ligne_budgetaire_id}
                    onChange={(e) => setFormData({ ...formData, ligne_budgetaire_id: e.target.value })}
                    className="input-field"
                  >
                    <option value="">Sélectionner une ligne (optionnel)</option>
                    {lignesBudgetaires.map((ligne) => (
                      <option key={ligne.id} value={ligne.id}>
                        {ligne.code_nature} - {ligne.libelle}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (FCFA) *
                </label>
                <input
                  type="number"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  className="input-field"
                  placeholder="Ex: 20000000"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">Modification &gt;10% de la ligne</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Motif *
                </label>
                <textarea
                  value={formData.motif}
                  onChange={(e) => setFormData({ ...formData, motif: e.target.value })}
                  className="input-field"
                  rows="4"
                  placeholder="Justification obligatoire..."
                  required
                />
              </div>

              {/* Prévisualisation - Selon documentation */}
              {preview && (
                <Card className="bg-primary-50 border-primary-200">
                  <h4 className="text-sm font-semibold text-primary-900 mb-3">Prévisualisation</h4>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-xs text-primary-700">Ancien équilibre</p>
                      <p className="text-lg font-bold text-primary-900 mt-1">
                        {formatMontant(preview.ancien_equilibre)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-700">Variation</p>
                      <p className={`text-lg font-bold mt-1 ${
                        preview.variation < 0 ? 'text-danger-600' : 'text-success-600'
                      }`}>
                        {formatMontant(preview.variation)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-primary-700">Nouvel équilibre</p>
                      <p className="text-lg font-bold text-primary-900 mt-1">
                        {formatMontant(preview.nouveau_equilibre)}
                      </p>
                    </div>
                  </div>
                </Card>
              )}

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setShowForm(false);
                    setPreview(null);
                  }}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={handlePreview}
                >
                  Prévisualiser
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
