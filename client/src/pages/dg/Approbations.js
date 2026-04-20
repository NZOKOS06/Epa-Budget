import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../../components/ui';
import { getStatusMeta } from '../../utils/statusUtils';

export default function DGApprobations() {
  const [engagements, setEngagements] = useState([]);
  const [filteredEngagements, setFilteredEngagements] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('');

  useEffect(() => {
    fetchEngagements();
  }, []);

  useEffect(() => {
    // Filtrer les engagements
    let filtered = engagements;
    
    if (searchTerm) {
      filtered = filtered.filter(eng => 
        eng.numero?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eng.programme_libelle?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        eng.montant?.toString().includes(searchTerm)
      );
    }
    
    if (filterProgramme) {
      filtered = filtered.filter(eng => eng.programme_id === parseInt(filterProgramme));
    }
    
    setFilteredEngagements(filtered);
  }, [engagements, searchTerm, filterProgramme]);

  const fetchEngagements = async () => {
    try {
      const response = await api.get('/dg/dashboard');
      setEngagements(response.data.engagements || []);
      setFilteredEngagements(response.data.engagements || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = (event) => {
    if (event.target.checked) {
      setSelected(filteredEngagements.map((e) => e.id));
    } else {
      setSelected([]);
    }
  };

  const handleSelect = (id) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((e) => e !== id) : [...prev, id]
    );
  };

  const handleVoirDetails = async (engagement) => {
    try {
      // Récupérer les détails complets de l'engagement
      const response = await api.get(`/engagements/${engagement.id}`);
      setSelectedEngagement(response.data);
      setShowModal(true);
      setActiveTab(1);
    } catch (error) {
      console.error('Erreur:', error);
      // Si l'API n'existe pas, utiliser les données de base
      setSelectedEngagement(engagement);
      setShowModal(true);
      setActiveTab(1);
    }
  };

  const handleApprouverBatch = async () => {
    try {
      const commentaire = prompt('Commentaire global (optionnel):') || '';
      await api.post('/dg/engagements/batch-approver', {
        engagementIds: selected,
        commentaire
      });
      setSelected([]);
      fetchEngagements();
      alert('Engagements approuvés avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'approbation en lot');
    }
  };

  const handleApprouver = async (id, commentaire = '') => {
    try {
      await api.post(`/dg/engagements/${id}/approver`, { commentaire });
      setShowModal(false);
      fetchEngagements();
      alert('Engagement approuvé avec succès');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de l\'approbation');
    }
  };

  const handleRefuser = async (id, motif) => {
    if (!motif || motif.trim() === '') {
      alert('Le motif du refus est obligatoire');
      return;
    }
    try {
      await api.post(`/dg/engagements/${id}/refuser`, { commentaire: motif });
      setShowModal(false);
      fetchEngagements();
      alert('Engagement refusé');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du refus');
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
    return <LoadingSpinner message="Chargement des approbations..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Approbations Stratégiques</h1>
          <p className="text-gray-600 mt-1">Approbation ou refus des engagements validés par le comptable</p>
        </div>
        {selected.length > 0 && (
          <Button onClick={handleApprouverBatch} variant="success">
            Approuver la sélection ({selected.length})
          </Button>
        )}
      </div>

      {/* Filtres et Recherche - Selon documentation */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche
            </label>
            <input
              type="text"
              className="input-field"
              placeholder="Numéro, montant, programme..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrer par programme
            </label>
            <select
              className="input-field"
              value={filterProgramme}
              onChange={(e) => setFilterProgramme(e.target.value)}
            >
              <option value="">Tous les programmes</option>
              {[...new Set(engagements.map(e => ({ id: e.programme_id, libelle: e.programme_libelle })))].map(prog => (
                <option key={prog.id} value={prog.id}>{prog.libelle}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('');
                setFilterProgramme('');
              }}
              className="w-full"
            >
              Réinitialiser
            </Button>
          </div>
        </div>
      </Card>

      {/* Statistiques rapides */}
      {selected.length > 0 && (
        <Card className="bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-primary-900">
                {selected.length} engagement(s) sélectionné(s)
              </p>
              <p className="text-xs text-primary-700 mt-1">
                Total: {formatMontant(
                  filteredEngagements
                    .filter(eng => selected.includes(eng.id))
                    .reduce((sum, eng) => sum + (eng.montant || 0), 0)
                )}
              </p>
            </div>
            <Button variant="outline" onClick={() => setSelected([])}>
              Désélectionner tout
            </Button>
          </div>
        </Card>
      )}

      {/* Liste des Engagements en Attente - Selon documentation */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Liste des Engagements en Attente</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredEngagements.length} engagement(s) en attente de validation
          </p>
        </div>

        {filteredEngagements.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selected.length === filteredEngagements.length && filteredEngagements.length > 0}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                  />
                </TableHead>
                <TableHead>Numéro</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date validation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {filteredEngagements.map((eng) => (
                  <TableRow key={eng.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selected.includes(eng.id)}
                        onChange={() => handleSelect(eng.id)}
                        className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                      />
                    </TableCell>
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
                        {eng.regularite_comptable_date 
                          ? format(new Date(eng.regularite_comptable_date), 'dd/MM/yyyy', { locale: fr })
                          : format(new Date(eng.created_at), 'dd/MM/yyyy', { locale: fr })
                        }
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        onClick={() => handleVoirDetails(eng)}
                        size="sm"
                        variant="outline"
                      >
                        Voir détails
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            icon={
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            }
            title="Aucun engagement en attente"
            description="Tous les engagements ont été traités"
          />
        )}
      </Card>

      {/* Modal de Détails avec 4 Onglets - Selon documentation */}
      {showModal && selectedEngagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h3 className="text-xl font-bold text-gray-900">
                Détails de l'Engagement - {selectedEngagement.numero}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Onglets */}
            <div className="border-b bg-gray-50">
              <div className="flex space-x-1 px-6">
                {[
                  { id: 1, label: 'Informations Générales' },
                  { id: 2, label: 'Historique Workflow' },
                  { id: 3, label: 'Pièces Jointes' },
                  { id: 4, label: 'Impact Budgétaire' }
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                      activeTab === tab.id
                        ? 'border-primary-500 text-primary-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Contenu des onglets */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Onglet 1 : Informations Générales */}
              {activeTab === 1 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Numéro d'engagement</p>
                      <p className="font-semibold text-gray-900">{selectedEngagement.numero}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Montant</p>
                      <p className="font-semibold text-gray-900">
                        {formatMontant(selectedEngagement.montant)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Programme</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEngagement.programme_libelle}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ligne budgétaire</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEngagement.ligne_budgetaire_libelle || 'N/A'}
                      </p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Objet complet</p>
                    <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">
                      {selectedEngagement.objet || 'N/A'}
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600">Date de création</p>
                      <p className="font-semibold text-gray-900">
                        {format(new Date(selectedEngagement.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date de visa</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEngagement.visa_date 
                          ? format(new Date(selectedEngagement.visa_date), 'dd/MM/yyyy', { locale: fr })
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date régularité</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEngagement.regularite_comptable_date 
                          ? format(new Date(selectedEngagement.regularite_comptable_date), 'dd/MM/yyyy', { locale: fr })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet 2 : Historique Workflow */}
              {activeTab === 2 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Timeline des Validations</h4>
                  <div className="space-y-3">
                    {/* Timeline items */}
                    <div className="border-l-2 border-primary-500 pl-4 pb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="success">Créé</Badge>
                        <span className="text-sm text-gray-600">
                          {format(new Date(selectedEngagement.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">Création par le service demandeur</p>
                    </div>
                    {selectedEngagement.visa_date && (
                      <div className="border-l-2 border-primary-500 pl-4 pb-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="success">Visé</Badge>
                          <span className="text-sm text-gray-600">
                            {format(new Date(selectedEngagement.visa_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">Validation par le contrôleur</p>
                      </div>
                    )}
                    {selectedEngagement.regularite_comptable_date && (
                      <div className="border-l-2 border-primary-500 pl-4 pb-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="success">Régularité OK</Badge>
                          <span className="text-sm text-gray-600">
                            {format(new Date(selectedEngagement.regularite_comptable_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">Validation comptable</p>
                      </div>
                    )}
                    <div className="border-l-2 border-warning-500 pl-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant={getStatusMeta(selectedEngagement.statut).variant}>
                          {getStatusMeta(selectedEngagement.statut).label}
                        </Badge>
                        <span className="text-sm text-gray-600 ml-2">En attente d'approbation DG</span>
                      </div>
                      <p className="text-sm text-gray-700">Dossier prêt pour signature finale</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet 3 : Pièces Jointes */}
              {activeTab === 3 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Documents Associés</h4>
                  {selectedEngagement.pieces_jointes && selectedEngagement.pieces_jointes.length > 0 ? (
                    <div className="space-y-2">
                      {selectedEngagement.pieces_jointes.map((piece, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-900">{piece.nom || `Document ${index + 1}`}</span>
                          </div>
                          <Button variant="outline" size="sm">
                            Télécharger
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="Aucune pièce jointe"
                      description="Les documents associés apparaîtront ici"
                    />
                  )}
                </div>
              )}

              {/* Onglet 4 : Impact Budgétaire */}
              {activeTab === 4 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Analyse Budgétaire</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Crédits disponibles (avant)</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatMontant(selectedEngagement.credits_disponibles || 0)}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Crédits restants (après)</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatMontant((selectedEngagement.credits_disponibles || 0) - (selectedEngagement.montant || 0))}
                      </p>
                    </div>
                  </div>
                  <div className="p-4 bg-primary-50 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Taux d'engagement de la ligne</p>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-primary-500 h-4 rounded-full"
                        style={{ width: `${Math.min(((selectedEngagement.montant || 0) / (selectedEngagement.credits_disponibles || 1)) * 100, 100)}%` }}
                      />
                    </div>
                    <p className="text-sm text-gray-700 mt-2">
                      {((selectedEngagement.montant || 0) / (selectedEngagement.credits_disponibles || 1) * 100).toFixed(1)}%
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t p-6 bg-gray-50">
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowModal(false)}
                >
                  Annuler
                </Button>
                <Button
                  variant="danger"
                  className="flex-1"
                  onClick={() => {
                    const motif = prompt('Motif du refus (obligatoire):');
                    if (motif) {
                      handleRefuser(selectedEngagement.id, motif);
                    }
                  }}
                >
                  Refuser
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => {
                    const commentaire = prompt('Commentaire (optionnel):') || '';
                    handleApprouver(selectedEngagement.id, commentaire);
                  }}
                >
                  Approuver
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
