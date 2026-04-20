import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../../components/ui';

export default function ServicesDemandesEngagements() {
  const [engagements, setEngagements] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [lignes, setLignes] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [filterStatut, setFilterStatut] = useState('');
  const [filterProgramme, setFilterProgramme] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    programme_id: '',
    ligne_budgetaire_id: '',
    montant: '',
    objet: '',
  });
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [detailTab, setDetailTab] = useState('infos');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [engResponse, progResponse, artResponse] = await Promise.all([
        api.get('/services/demandes-engagements'),
        api.get('/services/programmes'),
        api.get('/services/articles-budgetaires'),
      ]);
      setEngagements(engResponse.data || []);
      setProgrammes(progResponse.data || []);
      setLignes(artResponse.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    setUploadedFiles([...uploadedFiles, ...files]);
  };

  const handleRemoveFile = (index) => {
    setUploadedFiles(uploadedFiles.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const formDataToSend = new FormData();
      Object.keys(formData).forEach(key => {
        formDataToSend.append(key, formData[key]);
      });
      uploadedFiles.forEach((file) => {
        formDataToSend.append('pieces_jointes', file);
      });

      await api.post('/services/demandes-engagements', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      
      setShowForm(false);
      setFormData({ programme_id: '', ligne_budgetaire_id: '', montant: '', objet: '' });
      setUploadedFiles([]);
      fetchData();
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors de la création de la demande');
    }
  };

  const handleVoirDetails = async (eng) => {
    try {
      const response = await api.get(`/services/demandes-engagements/${eng.id}`);
      setSelectedEngagement(response.data);
      setDetailTab('infos');
      setShowDetails(true);
    } catch (error) {
      // Fallback si la route détail n'est pas encore parfaite
      setSelectedEngagement(eng);
      setDetailTab('infos');
      setShowDetails(true);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette demande ?')) {
      try {
        await api.delete(`/services/demandes-engagements/${id}`);
        fetchData();
      } catch (error) {
        alert(error.response?.data?.message || 'Erreur lors de la suppression');
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

  const getStatusMeta = (statut) => {
    const value = (statut || '').toLowerCase();
    const map = {
      brouillon: { label: 'Brouillon', variant: 'gray' },
      soumise_daf: { label: 'Soumise DAF', variant: 'warning' },
      en_attente_cb: { label: 'En attente Contrôleur', variant: 'info' },
      en_attente_dg: { label: 'En attente DG', variant: 'warning' },
      valide: { label: 'Validée', variant: 'success' },
      liquide: { label: 'Liquidée', variant: 'success' },
      rejete: { label: 'Rejetée', variant: 'danger' },
    };
    return map[value] || { label: statut || 'Inconnu', variant: 'gray' };
  };

  const viewPiece = async (piece) => {
    if (!selectedEngagement) return;
    try {
      const response = await api.get(
        `/services/demandes-engagements/${selectedEngagement.id}/pieces/${piece.id}/view`,
        { responseType: 'blob' }
      );
      const responseContentType = response.headers?.['content-type'];
      const filename = (piece.nom_fichier || '').toLowerCase();
      const fallbackContentType = filename.endsWith('.pdf')
        ? 'application/pdf'
        : (piece.type_fichier || 'application/octet-stream');
      const blob = new Blob([response.data], {
        type: responseContentType || fallbackContentType,
      });
      const blobUrl = window.URL.createObjectURL(blob);
      window.open(blobUrl, '_blank', 'noopener,noreferrer');
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60 * 1000);
    } catch (error) {
      alert('Impossible de visualiser la pièce jointe');
    }
  };

  const downloadPiece = async (piece) => {
    if (!selectedEngagement) return;
    try {
      const response = await api.get(
        `/services/demandes-engagements/${selectedEngagement.id}/pieces/${piece.id}/download`,
        { responseType: 'blob' }
      );
      const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = piece.nom_fichier || `piece-${piece.id}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      alert('Impossible de télécharger la pièce jointe');
    }
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des demandes..." />;
  }

  const filteredEngagements = engagements.filter(eng => {
    const statut = (eng.statut || '').toLowerCase();
    const programmeCode = (eng.chapitre_code || '').toLowerCase();
    const programmeLibelle = (eng.chapitre_libelle || '').toLowerCase();
    const matchStatut = filterStatut ? statut === filterStatut : true;
    const matchProgramme = filterProgramme
      ? (
          eng.programme_id?.toString() === filterProgramme ||
          programmeCode.includes(filterProgramme.toLowerCase()) ||
          programmeLibelle.includes(filterProgramme.toLowerCase())
        )
      : true;
    const matchSearch = searchQuery ? (
      (eng.numero && eng.numero.toLowerCase().includes(searchQuery.toLowerCase())) || 
      (eng.objet && eng.objet.toLowerCase().includes(searchQuery.toLowerCase())) ||
      programmeCode.includes(searchQuery.toLowerCase()) ||
      programmeLibelle.includes(searchQuery.toLowerCase())
    ) : true;
    return matchStatut && matchProgramme && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Demandes d'Engagements</h1>
          <p className="text-gray-600 mt-1">Créer et suivre vos demandes d'engagements</p>
        </div>
        <Button onClick={() => setShowForm(true)}>
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouvelle demande
        </Button>
      </div>

      {/* Liste des demandes */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Mes demandes</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredEngagements.length} demande(s) trouvée(s)
          </p>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <input
            type="text"
            placeholder="Rechercher par N°, objet, code ou libellé programme..."
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <select 
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border bg-white"
            value={filterProgramme}
            onChange={(e) => setFilterProgramme(e.target.value)}
          >
            <option value="">Tous les programmes</option>
            {programmes.map(p => (
              <option key={p.id} value={p.id}>{p.code} - {p.libelle}</option>
            ))}
          </select>
          <select 
            className="border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border bg-white"
            value={filterStatut}
            onChange={(e) => setFilterStatut(e.target.value)}
          >
            <option value="">Tous les statuts</option>
            <option value="brouillon">Brouillon</option>
            <option value="soumise_daf">Soumise DAF</option>
            <option value="en_attente_cb">En attente Contrôleur</option>
            <option value="en_attente_dg">En attente DG</option>
            <option value="valide">Validée</option>
            <option value="liquide">Liquidée</option>
            <option value="rejete">Rejetée</option>
          </select>
        </div>

        {filteredEngagements.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Numéro</TableHead>
                <TableHead>Programme</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead>Objet</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {filteredEngagements.map((eng) => (
                  <TableRow key={eng.id}>
                    <TableCell>
                      <span className="font-semibold text-primary-600">{eng.numero}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{eng.chapitre_libelle}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="font-semibold text-gray-900">
                        {formatMontant(eng.montant)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700 truncate max-w-xs block" title={eng.objet}>
                        {eng.objet}
                      </span>
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const statusMeta = getStatusMeta(eng.statut);
                        return (
                      <Badge 
                        variant={statusMeta.variant}
                      >
                        {statusMeta.label}
                      </Badge>
                        );
                      })()}
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {format(new Date(eng.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button variant="ghost" size="sm" onClick={() => handleVoirDetails(eng)}>
                          Détails
                        </Button>
                        {eng.statut.toLowerCase() === 'brouillon' && (
                          <Button variant="ghost" size="sm" className="text-danger-600" onClick={() => handleDelete(eng.id)}>
                            Supprimer
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Aucune demande"
            description="Créez votre première demande d'engagement"
            action={
              <Button onClick={() => setShowForm(true)}>
                Créer une demande
              </Button>
            }
          />
        )}
      </Card>

      {/* Modal Formulaire */}
      {showForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-900">Nouvelle Demande d'Engagement</h3>
              <button
                onClick={() => setShowForm(false)}
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
                  Programme
                </label>
                <select
                  value={formData.programme_id}
                  onChange={(e) => {
                    setFormData({ ...formData, programme_id: e.target.value });
                    // Charger les lignes budgétaires du programme
                  }}
                  className="input-field"
                  required
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
                  Ligne Budgétaire
                </label>
                <select
                  value={formData.ligne_budgetaire_id}
                  onChange={(e) => setFormData({ ...formData, ligne_budgetaire_id: e.target.value })}
                  className="input-field"
                  required
                  disabled={!formData.programme_id}
                >
                  <option value="">Sélectionner une ligne</option>
                  {lignes
                    .filter(l => l.id_chapitre.toString() === formData.programme_id.toString())
                    .map((ligne) => (
                      <option key={ligne.id} value={ligne.id}>
                        {ligne.code} - {ligne.libelle}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Objet
                </label>
                <input
                  type="text"
                  value={formData.objet}
                  onChange={(e) => setFormData({ ...formData, objet: e.target.value })}
                  className="input-field"
                  placeholder="Ex: Formation 10k jeunes"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant (FCFA)
                </label>
                <input
                  type="number"
                  value={formData.montant}
                  onChange={(e) => setFormData({ ...formData, montant: e.target.value })}
                  className="input-field"
                  placeholder="Ex: 200000000"
                  required
                />
              </div>

              {/* Upload fichiers */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Pièces jointes
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <label
                    htmlFor="file-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-sm text-gray-600">
                      Cliquez pour télécharger ou glissez-déposez
                    </span>
                    <span className="text-xs text-gray-500 mt-1">Contrat, Proforma, etc.</span>
                  </label>
                </div>
                {uploadedFiles.length > 0 && (
                  <div className="mt-3 space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 bg-gray-50 rounded-lg"
                      >
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveFile(index)}
                          className="text-danger-600 hover:text-danger-700"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex space-x-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowForm(false)}
                >
                  Annuler
                </Button>
                <Button type="submit" className="flex-1">
                  Soumettre à la DAF
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Détails */}
      {showDetails && selectedEngagement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-6 border-b pb-4">
              <h3 className="text-xl font-bold text-gray-900">Détails de la demande {selectedEngagement.numero}</h3>
              <button onClick={() => setShowDetails(false)} className="text-gray-400 hover:text-gray-600">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="border-b bg-gray-50 px-6">
              <div className="flex space-x-2">
                {[
                  { key: 'infos', label: 'Informations' },
                  { key: 'progression', label: 'Progression' },
                  { key: 'pieces', label: 'Pièces jointes' },
                  { key: 'actions', label: 'Actions' },
                ].map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setDetailTab(tab.key)}
                    className={`px-4 py-3 text-sm font-medium border-b-2 ${
                      detailTab === tab.key
                        ? 'border-primary-500 text-primary-600 bg-white'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {detailTab === 'infos' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <p className="text-sm text-gray-500">Objet</p>
                      <p className="font-semibold text-gray-900">{selectedEngagement.objet}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Montant</p>
                      <p className="font-bold text-primary-600 text-lg">{formatMontant(selectedEngagement.montant)}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Statut</p>
                      {(() => {
                        const statusMeta = getStatusMeta(selectedEngagement.statut);
                        return <Badge variant={statusMeta.variant}>{statusMeta.label}</Badge>;
                      })()}
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Programme</p>
                      <p className="font-medium text-gray-900">{selectedEngagement.chapitre_code} - {selectedEngagement.chapitre_libelle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Ligne budgétaire</p>
                      <p className="font-medium text-gray-900">{selectedEngagement.article_code} - {selectedEngagement.article_libelle}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Créée le</p>
                      <p className="font-medium text-gray-900">{format(new Date(selectedEngagement.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                    </div>
                  </div>
                </div>
              )}

              {detailTab === 'progression' && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Suivi de la demande</h4>
                  <div className="border-l-2 border-primary-300 pl-4">
                    <p className="font-medium text-gray-900">Demande créée</p>
                    <p className="text-sm text-gray-500">{format(new Date(selectedEngagement.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                  </div>
                  {selectedEngagement.soumission_daf_date && (
                    <div className="border-l-2 border-primary-300 pl-4">
                      <p className="font-medium text-gray-900">Soumise au DAF</p>
                      <p className="text-sm text-gray-500">{format(new Date(selectedEngagement.soumission_daf_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                    </div>
                  )}
                  {selectedEngagement.transmission_controleur_date && (
                    <div className="border-l-2 border-primary-300 pl-4">
                      <p className="font-medium text-gray-900">Transmise au Contrôleur</p>
                      <p className="text-sm text-gray-500">{format(new Date(selectedEngagement.transmission_controleur_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                    </div>
                  )}
                  {selectedEngagement.transmission_dg_date && (
                    <div className="border-l-2 border-primary-300 pl-4">
                      <p className="font-medium text-gray-900">Transmise au DG</p>
                      <p className="text-sm text-gray-500">{format(new Date(selectedEngagement.transmission_dg_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                    </div>
                  )}
                  {selectedEngagement.validation_dg_date && (
                    <div className="border-l-2 border-primary-300 pl-4">
                      <p className="font-medium text-gray-900">Validée</p>
                      <p className="text-sm text-gray-500">{format(new Date(selectedEngagement.validation_dg_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}</p>
                    </div>
                  )}
                </div>
              )}

              {detailTab === 'pieces' && (
                <div className="space-y-3">
                  {selectedEngagement.pieces_jointes && selectedEngagement.pieces_jointes.length > 0 ? (
                    selectedEngagement.pieces_jointes.map((piece, index) => (
                      <div key={piece.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm text-gray-900">{piece.nom_fichier || `Document ${index + 1}`}</span>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => viewPiece(piece)}>Visualiser</Button>
                          <Button variant="outline" size="sm" onClick={() => downloadPiece(piece)}>Télécharger</Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-gray-500">Aucune pièce jointe disponible.</p>
                  )}
                </div>
              )}

              {detailTab === 'actions' && (
                <div className="space-y-4">
                  {(selectedEngagement.statut || '').toLowerCase() === 'brouillon' ? (
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-700">
                        Cette demande est encore au stade de brouillon. Soumettez-la pour démarrer le traitement.
                      </p>
                      <Button
                        className="mt-3"
                        onClick={async () => {
                          try {
                            await api.post(`/services/demandes-engagements/${selectedEngagement.id}/soumettre`);
                            setShowDetails(false);
                            fetchData();
                          } catch (error) {
                            alert(error.response?.data?.message || 'Erreur lors de la soumission');
                          }
                        }}
                      >
                        Soumettre maintenant
                      </Button>
                    </div>
                  ) : (
                    <p className="text-sm text-gray-600">Aucune action requise pour le statut actuel.</p>
                  )}
                </div>
              )}

              <div className="flex justify-end pt-6">
                <Button onClick={() => setShowDetails(false)}>Fermer</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
