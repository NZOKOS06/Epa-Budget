import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../../components/ui';
import { getStatusMeta } from '../../utils/statusUtils';

export default function DGApprobations() {
  const [engagements, setEngagements] = useState([]);
  const [engagementsApprouves, setEngagementsApprouves] = useState([]);
  const [filteredEngagements, setFilteredEngagements] = useState([]);
  const [filteredEngagementsApprouves, setFilteredEngagementsApprouves] = useState([]);
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('');
  const [searchTermApprouves, setSearchTermApprouves] = useState('');
  const [filterProgrammeApprouves, setFilterProgrammeApprouves] = useState('');

  useEffect(() => {
    fetchEngagements();
  }, []);

  useEffect(() => {
    // Filtrer les engagements en attente
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

    // Filtrer les engagements approuvés
    let filteredApprouves = engagementsApprouves;
    
    if (searchTermApprouves) {
      filteredApprouves = filteredApprouves.filter(eng => 
        eng.numero?.toLowerCase().includes(searchTermApprouves.toLowerCase()) ||
        eng.programme_libelle?.toLowerCase().includes(searchTermApprouves.toLowerCase()) ||
        eng.montant?.toString().includes(searchTermApprouves)
      );
    }
    
    if (filterProgrammeApprouves) {
      filteredApprouves = filteredApprouves.filter(eng => eng.programme_id === parseInt(filterProgrammeApprouves));
    }
    
    setFilteredEngagementsApprouves(filteredApprouves);
  }, [engagements, engagementsApprouves, searchTerm, filterProgramme, searchTermApprouves, filterProgrammeApprouves]);

  const fetchEngagements = async () => {
    try {
      const response = await api.get('/dg/dashboard');
      setEngagements(response.data.engagements || []);
      setFilteredEngagements(response.data.engagements || []);
      
      // Récupérer aussi les engagements approuvés
      try {
        const approuvesResponse = await api.get('/dg/engagements-approuves');
        setEngagementsApprouves(approuvesResponse.data || []);
        setFilteredEngagementsApprouves(approuvesResponse.data || []);
      } catch (error) {
        // Si l'endpoint n'existe pas, les laisser vides
        console.warn('Endpoint engagements-approuves non disponible');
        setEngagementsApprouves([]);
      }
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
      const response = await api.get(`/dg/engagements/${engagement.id}`);
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

  const downloadPiece = async (pieceId) => {
    if (!selectedEngagement) return;
    try {
      const response = await api.get(`/dg/engagements/${selectedEngagement.id}/pieces/${pieceId}/download`, {
        responseType: 'blob'
      });
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      const piece = selectedEngagement.pieces_jointes.find(p => p.id === pieceId);
      link.download = piece?.nom_fichier || `piece-${pieceId}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error('Erreur téléchargement:', error);
      alert('Impossible de télécharger la pièce jointe');
    }
  };

  const viewPiece = async (pieceId) => {
    if (!selectedEngagement) return;
    try {
      const response = await api.get(
        `/dg/engagements/${selectedEngagement.id}/pieces/${pieceId}/view`,
        { responseType: 'blob' }
      );
      const responseContentType = response.headers?.['content-type'];
      const piece = selectedEngagement.pieces_jointes.find(p => p.id === pieceId);
      const filename = (piece?.nom_fichier || '').toLowerCase();
      const fallbackContentType = filename.endsWith('.pdf')
        ? 'application/pdf'
        : (piece?.type_fichier || 'application/octet-stream');
      const blob = new Blob([response.data], {
        type: responseContentType || fallbackContentType,
      });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60 * 1000);
    } catch (error) {
      console.error('Erreur visualisation:', error);
      alert('Impossible de visualiser la pièce jointe');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des approbations..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Approbations Stratégiques</h1>
          <p className="text-gray-500 mt-1">Approbation ou refus des engagements validés par le comptable</p>
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
              {Array.from(
                new Map(
                  engagements
                    .filter(e => e.programme_id && e.programme_libelle)
                    .map(e => [e.programme_id, e.programme_libelle])
                ).entries()
              ).map(([id, libelle]) => (
                <option key={id} value={id}>{libelle}</option>
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
          <h2 className="text-xl font-semibold text-gray-900">Liste des Engagements en Attente</h2>
          <p className="text-sm text-gray-500 mt-1">
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
                  <TableRow key={eng.id} hover>
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
                      <span className="text-gray-700">{eng.epa_nom || 'Service Général'}</span>
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

      {/* Approbations Approuvées */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Approbations Approuvées</h2>
          <p className="text-sm text-gray-500 mt-1">
            {filteredEngagementsApprouves.length} engagement(s) approuvé(s)
          </p>
        </div>

        {/* Filtres et Recherche pour Approbations Approuvées */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recherche
              </label>
              <input
                type="text"
                className="input-field"
                placeholder="Numéro, montant, programme..."
                value={searchTermApprouves}
                onChange={(e) => setSearchTermApprouves(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filtrer par programme
              </label>
              <select
                className="input-field"
                value={filterProgrammeApprouves}
                onChange={(e) => setFilterProgrammeApprouves(e.target.value)}
              >
                <option value="">Tous les programmes</option>
                {Array.from(
                  new Map(
                    engagementsApprouves
                      .filter(e => e.programme_id && e.programme_libelle)
                      .map(e => [e.programme_id, e.programme_libelle])
                  ).entries()
                ).map(([id, libelle]) => (
                  <option key={id} value={id}>{libelle}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTermApprouves('');
                  setFilterProgrammeApprouves('');
                }}
                className="w-full"
              >
                Réinitialiser
              </Button>
            </div>
          </div>
        </div>

        {filteredEngagementsApprouves.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Numéro</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Date d'approbation</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {filteredEngagementsApprouves.map((eng) => (
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
                      <span className="text-gray-700">{eng.epa_nom || 'Service Général'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {format(new Date(eng.updated_at), 'dd/MM/yyyy', { locale: fr })}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            }
            title="Aucune approbation"
            description="Les engagements approuvés apparaîtront ici"
          />
        )}
      </Card>

      {/* Modal de Détails avec 4 Onglets - Selon documentation */}
      {showModal && selectedEngagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
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
                      <p className="text-sm text-gray-600 font-medium">Programme</p>
                      <p className="text-gray-900">
                        <span className="font-bold text-primary-700">{selectedEngagement.programme_code}</span> - {selectedEngagement.programme_libelle}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Service / Entité</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEngagement.epa_nom || 'Service Général'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Ligne budgétaire</p>
                      <p className="text-gray-900">
                        <span className="font-bold text-primary-700">{selectedEngagement.article_code}</span> - {selectedEngagement.article_libelle}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 font-medium">Demandeur</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEngagement.demandeur_nom}
                      </p>
                    </div>
                  </div>

                  {/* Highlights / Avis du Contrôleur */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mt-6">
                    <div className="flex items-center space-x-2 mb-3">
                      <svg className="w-5 h-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                      <h4 className="font-bold text-amber-900 text-sm uppercase tracking-wider">Avis du Contrôleur Budgétaire</h4>
                    </div>
                    {selectedEngagement.type_avis === 'favorable' ? (
                      <div className="space-y-2">
                        <Badge variant="success">FAVORABLE</Badge>
                        <p className="text-sm text-amber-800 italic">
                          "{selectedEngagement.avis_commentaire || 'Aucun commentaire particulier.'}"
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm text-amber-700 italic">En attente ou avis non communiqué dans ce dashboard.</p>
                    )}
                  </div>

                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-600 mb-2 font-medium">Objet complet de la dépense</p>
                    <p className="text-gray-900 bg-gray-50 p-4 rounded-xl border border-gray-100 leading-relaxed">
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
                      {selectedEngagement.pieces_jointes.map((piece) => (
                        <div key={piece.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-sm text-gray-900">{piece.nom_fichier || 'Document sans nom'}</span>
                          </div>
                          <div className="flex space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => viewPiece(piece.id)}>
                              Voir
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => downloadPiece(piece.id)}>
                              Télécharger
                            </Button>
                          </div>
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
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-gray-900">Disponibilité Budgétaire (AE)</h4>
                    <Badge variant={selectedEngagement.ae_disponible >= selectedEngagement.montant ? 'success' : 'danger'}>
                      {selectedEngagement.ae_disponible >= selectedEngagement.montant ? 'Crédits suffisants' : 'Crédits insuffisants'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-6">
                    <div className="p-5 bg-primary-50 rounded-lg border border-primary-100 shadow-sm">
                      <p className="text-sm text-primary-700 font-medium mb-1">Disponible avant validation</p>
                      <p className="text-2xl font-black text-primary-900">
                        {formatMontant(selectedEngagement.ae_disponible || 0)}
                      </p>
                    </div>
                    <div className="p-5 bg-gray-50 rounded-lg border border-gray-100 shadow-sm">
                      <p className="text-sm text-gray-600 font-medium mb-1">Reste après validation</p>
                      <p className={`text-2xl font-black ${
                        (selectedEngagement.ae_disponible - selectedEngagement.montant) < 0 
                        ? 'text-danger-600' 
                        : 'text-gray-900'
                      }`}>
                        {formatMontant((selectedEngagement.ae_disponible || 0) - (selectedEngagement.montant || 0))}
                      </p>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-6 rounded-lg border border-gray-100 space-y-4">
                    <div className="flex justify-between text-sm font-bold text-gray-700">
                      <span>Impact sur l'article {selectedEngagement.article_code}</span>
                      <span>{Math.round(((selectedEngagement.montant || 0) / (selectedEngagement.ae_disponible || 1)) * 100)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-700 ease-out ${
                          ((selectedEngagement.montant || 0) / (selectedEngagement.ae_disponible || 1)) > 0.8 ? 'bg-danger-500' : 'bg-primary-600'
                        }`}
                        style={{ width: `${Math.min(100, ((selectedEngagement.montant || 0) / (selectedEngagement.ae_disponible || 1)) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex items-start space-x-3 text-xs text-gray-500 mt-2 italic">
                      <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p>
                        Conformément aux règles de gestion (RG-03), la validation par le DG déclenche la réservation définitive des Autorisations d'Engagement (AE).
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="border-t p-6 bg-gray-50">
              {selectedEngagement.statut === 'valide' ? (
                <div className="flex items-center space-x-3 p-4 bg-green-50 rounded-lg border border-green-200">
                  <svg className="w-6 h-6 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m7 0a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-semibold text-green-900">Engagement approuvé</p>
                    <p className="text-sm text-green-700">Cet engagement a été approuvé par le Directeur Général</p>
                  </div>
                </div>
              ) : selectedEngagement.statut === 'rejete' ? (
                <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
                  <svg className="w-6 h-6 text-red-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l-2-2m0 0l-2-2m2 2l2-2m-2 2l-2 2" />
                  </svg>
                  <div>
                    <p className="font-semibold text-red-900">Engagement rejeté</p>
                    <p className="text-sm text-red-700">Motif: {selectedEngagement.motif_rejet || 'Non spécifié'}</p>
                  </div>
                </div>
              ) : (
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
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
