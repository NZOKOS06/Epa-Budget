import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, Badge, PageHeader } from '../../components/ui';
import { getStatusMeta } from '../../utils/statusUtils';

export default function DAFEngagements() {
  const [engagements, setEngagements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEngagement, setSelectedEngagement] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [activeTab, setActiveTab] = useState(1);

  useEffect(() => {
    fetchEngagements();
  }, []);

  const fetchEngagements = async () => {
    try {
      const response = await api.get('/daf/engagements');
      setEngagements(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMove = async (itemId, fromColumn, toColumn) => {
    try {
      // Mapper les colonnes aux statuts selon documentation
      const statutMap = {
        'brouillon': 'brouillon',
        'soumise-daf': 'soumise_daf',
        'en-visa': 'en_attente_cb',
        'visa-ok': 'en_attente_dg'
      };

      const newStatut = statutMap[toColumn];

      await api.post(`/daf/engagements/${itemId}/changer-statut`, { 
        statut: newStatut,
        commentaire: 'Changement de statut via Kanban'
      });
      fetchEngagements();
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du changement de statut');
    }
  };

  const handleCardClick = async (item) => {
    try {
      const response = await api.get(`/daf/engagements/${item.id}`);
      setSelectedEngagement(response.data);
      setShowModal(true);
      setActiveTab(1);
    } catch (error) {
      console.error('Erreur:', error);
      // Si l'API n'existe pas, utiliser les données de base
      const engagement = engagements.find(e => e.id === item.id);
      setSelectedEngagement(engagement);
      setShowModal(true);
      setActiveTab(1);
    }
  };

  const handleEnvoyerVisa = async () => {
    if (!selectedEngagement) return;
    try {
      const commentaire = prompt('Commentaire (optionnel):') || '';
      await api.post(`/daf/engagements/${selectedEngagement.id}/transmettre`, { commentaire });
      setShowModal(false);
      fetchEngagements();
      alert('Engagement transmis au contrôleur');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors de la transmission');
    }
  };

  const handleRetournerService = async () => {
    if (!selectedEngagement) return;
    const motif = prompt('Motif du retour (obligatoire):');
    if (!motif || motif.trim() === '') {
      alert('Le motif est obligatoire');
      return;
    }
    try {
      await api.post(`/daf/engagements/${selectedEngagement.id}/retourner`, { commentaire: motif });
      setShowModal(false);
      fetchEngagements();
      alert('Engagement retourné au service');
    } catch (error) {
      console.error('Erreur:', error);
      alert('Erreur lors du retour');
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const toNumber = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
  };

  const buildBudgetMeta = (disponible, montantEngagement) => {
    const dispo = toNumber(disponible);
    const montant = toNumber(montantEngagement);
    const ratio = dispo > 0 ? (montant / dispo) * 100 : (montant > 0 ? 100 : 0);
    const safeRatio = Math.max(0, Math.min(ratio, 100));
    const reste = dispo - montant;
    const isAvailable = reste >= 0;

    let color = 'bg-success-500';
    if (!isAvailable) {
      color = 'bg-danger-500';
    } else if (safeRatio >= 80) {
      color = 'bg-warning-500';
    }

    return { dispo, montant, ratio: safeRatio, reste, isAvailable, color };
  };

  const downloadPiece = async (piece) => {
    if (!selectedEngagement) return;
    try {
      const response = await api.get(
        `/daf/engagements/${selectedEngagement.id}/pieces/${piece.id}/download`,
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
      console.error('Erreur téléchargement:', error);
      alert('Impossible de télécharger la pièce jointe');
    }
  };

  const viewPiece = async (piece) => {
    if (!selectedEngagement) return;
    try {
      const response = await api.get(
        `/daf/engagements/${selectedEngagement.id}/pieces/${piece.id}/view`,
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
      console.error('Erreur visualisation:', error);
      alert('Impossible de visualiser la pièce jointe');
    }
  };

  // Organiser les engagements par statut selon documentation
  const columns = [
    {
      id: 'brouillon',
      title: '📝 BROUILLON',
      subtitle: 'Demandes créées par les services, non encore soumises',
      items: engagements
        .filter(eng => eng.statut === 'brouillon')
        .map(eng => ({
          id: eng.id,
          numero: eng.numero,
          objet: eng.objet || eng.programme_libelle || 'N/A',
          montant: eng.montant,
          programme: eng.programme_libelle || 'N/A',
          service: eng.service_nom || eng.demandeur_nom || 'N/A',
          date: eng.created_at,
          pieces: Number(eng.pieces_count || eng.pieces_jointes?.length || 0),
          priorite: eng.montant > 5000000 ? 'URGENT' : null,
        })),
    },
    {
      id: 'soumise-daf',
      title: '⏳ SOUMIS DAF',
      subtitle: 'Demandes soumises, en attente de validation DAF',
      items: engagements
        .filter(eng => eng.statut === 'soumise_daf')
        .map(eng => ({
          id: eng.id,
          numero: eng.numero,
          objet: eng.objet || eng.programme_libelle || 'N/A',
          montant: eng.montant,
          programme: eng.programme_libelle || 'N/A',
          service: eng.service_nom || eng.demandeur_nom || 'N/A',
          date: eng.created_at,
          pieces: Number(eng.pieces_count || eng.pieces_jointes?.length || 0),
          priorite: eng.montant > 5000000 ? 'URGENT' : null,
        })),
    },
    {
      id: 'en-visa',
      title: '🔍 EN VISA',
      subtitle: 'Engagements transmis au contrôleur pour visa',
      items: engagements
        .filter(eng => eng.statut === 'en_attente_cb')
        .map(eng => ({
          id: eng.id,
          numero: eng.numero,
          objet: eng.objet || eng.programme_libelle || 'N/A',
          montant: eng.montant,
          programme: eng.programme_libelle || 'N/A',
          service: eng.service_nom || eng.demandeur_nom || 'N/A',
          date: eng.created_at,
          pieces: Number(eng.pieces_count || eng.pieces_jointes?.length || 0),
          priorite: eng.montant > 5000000 ? 'URGENT' : null,
        })),
    },
    {
      id: 'visa-ok',
      title: '✅ VISA OK',
      subtitle: 'Engagements visés, en cours de traitement comptable',
      items: engagements
        .filter(eng => eng.statut === 'en_attente_dg' || eng.statut === 'valide')
        .map(eng => ({
          id: eng.id,
          numero: eng.numero,
          objet: eng.objet || eng.programme_libelle || 'N/A',
          montant: eng.montant,
          programme: eng.programme_libelle || 'N/A',
          service: eng.service_nom || eng.demandeur_nom || 'N/A',
          date: eng.created_at,
          pieces: Number(eng.pieces_count || eng.pieces_jointes?.length || 0),
          priorite: eng.montant > 5000000 ? 'URGENT' : null,
        })),
    },
  ];

  // Créer un composant Kanban personnalisé qui gère les clics
  const CustomKanbanBoard = ({ columns, onMove, onCardClick }) => {
    const [draggedItem, setDraggedItem] = React.useState(null);
    const [draggedColumn, setDraggedColumn] = React.useState(null);

    const handleDragStart = (item, columnId) => {
      setDraggedItem(item);
      setDraggedColumn(columnId);
    };

    const handleDragOver = (e) => {
      e.preventDefault();
    };

    const handleDrop = (targetColumnId) => {
      if (draggedItem && draggedColumn !== targetColumnId && onMove) {
        if (window.confirm('Confirmer le changement de statut ?')) {
          onMove(draggedItem.id, draggedColumn, targetColumnId);
        }
      }
      setDraggedItem(null);
      setDraggedColumn(null);
    };

    return (
      <div className="flex space-x-4 overflow-x-auto pb-4">
        {columns.map((column) => (
          <div
            key={column.id}
            className="flex-shrink-0 w-72 bg-gray-50 rounded-lg border border-gray-200"
            onDragOver={handleDragOver}
            onDrop={() => handleDrop(column.id)}
          >
            <div className="p-4 border-b border-gray-200 bg-white rounded-t-lg">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">{column.title}</h3>
                <span className="bg-gray-200 text-gray-700 text-xs font-medium px-2 py-1 rounded-full">
                  {column.items.length}
                </span>
              </div>
              {column.subtitle && (
                <p className="text-xs text-gray-500 mt-1">{column.subtitle}</p>
              )}
            </div>
            <div className="p-3 space-y-3 min-h-[400px]">
              {column.items.map((item) => (
                <div
                  key={item.id}
                  draggable
                  onDragStart={() => handleDragStart(item, column.id)}
                  onClick={() => onCardClick && onCardClick(item)}
                  className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <span className="text-sm font-semibold text-primary-600">{item.numero}</span>
                    {item.priorite === 'URGENT' && (
                      <Badge variant="danger" size="sm">URGENT</Badge>
                    )}
                  </div>
                  <p className="text-sm text-gray-900 mb-2 line-clamp-2">{item.objet}</p>
                  <p className="text-lg font-bold text-gray-900 mb-2">{formatMontant(item.montant)}</p>
                  <div className="space-y-1 text-xs text-gray-500">
                    <div>Programme: {item.programme}</div>
                    <div>Service: {item.service}</div>
                    <div>{format(new Date(item.date), 'dd/MM/yyyy', { locale: fr })}</div>
                  </div>
                  {item.pieces > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <span className="text-xs text-gray-500">
                        {item.pieces} pièce(s) jointe(s)
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des engagements..." />;
  }

  return (
    <div className="space-y-6">
      {/* Header premium */}
      <PageHeader
        title="Engagements"
        subtitle="Gestion des engagements via un tableau Kanban"
        kpis={[
          {
            label: 'Total engagements',
            value: engagements.length,
            sub: 'tous statuts',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
          },
          {
            label: 'En brouillon',
            value: engagements.filter(e => e.statut === 'brouillon').length,
            sub: 'à finaliser',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V7a2 2 0 00-2-2h-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
          },
          {
            label: 'En visa',
            value: engagements.filter(e => e.statut === 'en_attente_cb').length,
            sub: 'contrôleur',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" /></svg>,
          },
          {
            label: 'Montant total',
            value: formatMontant(engagements.reduce((s, e) => s + (e.montant || 0), 0)),
            sub: 'engagé',
            icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
          },
        ]}
      />

      {/* Kanban Board */}
      <Card className="p-0 overflow-hidden">
        <CustomKanbanBoard 
          columns={columns} 
          onMove={handleMove}
          onCardClick={handleCardClick}
        />
      </Card>

      {/* Instructions */}
      <Card className="bg-primary-50 border-primary-200">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-primary-900">Utilisation du Kanban</p>
            <p className="text-xs text-primary-700 mt-1">
              Glissez-déposez les cartes entre les colonnes pour changer leur statut. 
              Cliquez sur une carte pour voir les détails. Les engagements &gt;5M sont marqués comme urgents.
            </p>
          </div>
        </div>
      </Card>

      {/* Modal de Détails - Selon documentation */}
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
                  { id: 2, label: 'Historique' },
                  { id: 3, label: 'Pièces Jointes' },
                  { id: 4, label: 'Disponibilité AE/CP' },
                  { id: 5, label: 'Actions' }
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
                      <p className="text-sm text-gray-600">Numéro</p>
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
                        {selectedEngagement.programme_libelle || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Ligne budgétaire</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEngagement.ligne_budgetaire_libelle || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Service demandeur</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEngagement.service_nom || selectedEngagement.demandeur_nom || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Statut</p>
                      <Badge variant={getStatusMeta(selectedEngagement.statut).variant}>
                        {getStatusMeta(selectedEngagement.statut).label}
                      </Badge>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-2">Objet</p>
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
                      <p className="text-sm text-gray-600">Date de soumission</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEngagement.soumission_daf_date 
                          ? format(new Date(selectedEngagement.soumission_daf_date), 'dd/MM/yyyy', { locale: fr })
                          : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Date de transmission</p>
                      <p className="font-semibold text-gray-900">
                        {selectedEngagement.transmission_controleur_date 
                          ? format(new Date(selectedEngagement.transmission_controleur_date), 'dd/MM/yyyy', { locale: fr })
                          : 'N/A'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Onglet 2 : Historique */}
              {activeTab === 2 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Timeline des Actions</h4>
                  <div className="space-y-3">
                    <div className="border-l-2 border-primary-500 pl-4 pb-4">
                      <div className="flex items-center space-x-2 mb-1">
                        <Badge variant="info">Créé</Badge>
                        <span className="text-sm text-gray-600">
                          {format(new Date(selectedEngagement.created_at), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700">Création par le service demandeur</p>
                    </div>
                    {selectedEngagement.soumission_daf_date && (
                      <div className="border-l-2 border-primary-500 pl-4 pb-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="warning">Soumis DAF</Badge>
                          <span className="text-sm text-gray-600">
                            {format(new Date(selectedEngagement.soumission_daf_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">Soumission au DAF</p>
                      </div>
                    )}
                    {selectedEngagement.transmission_controleur_date && (
                      <div className="border-l-2 border-primary-500 pl-4 pb-4">
                        <div className="flex items-center space-x-2 mb-1">
                          <Badge variant="info">Transmis</Badge>
                          <span className="text-sm text-gray-600">
                            {format(new Date(selectedEngagement.transmission_controleur_date), 'dd/MM/yyyy à HH:mm', { locale: fr })}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700">Transmission au contrôleur</p>
                      </div>
                    )}
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
                            <span className="text-sm text-gray-900">{piece.nom_fichier || piece.nom || `Document ${index + 1}`}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm" onClick={() => viewPiece(piece)}>
                              Visualiser
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => downloadPiece(piece)}>
                              Télécharger
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Aucune pièce jointe</p>
                  )}
                </div>
              )}

              {/* Onglet 4 : Disponibilité AE / CP */}
              {activeTab === 4 && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900">Analyse de disponibilité budgétaire</h4>
                  {(() => {
                    const aeMeta = buildBudgetMeta(selectedEngagement.ae_disponible, selectedEngagement.montant);
                    const cpMeta = buildBudgetMeta(selectedEngagement.cp_disponible, selectedEngagement.montant);
                    const canProceed = aeMeta.isAvailable && cpMeta.isAvailable;
                    const decisionTitle = canProceed ? 'Transmission possible' : 'Complément budgétaire requis';
                    const decisionClass = canProceed
                      ? 'bg-success-50 border-success-200 text-success-800'
                      : 'bg-danger-50 border-danger-200 text-danger-800';
                    const decisionHint = canProceed
                      ? 'Les crédits AE et CP couvrent le montant de l’engagement.'
                      : 'Le montant dépasse la disponibilité sur AE ou CP. Ajustez le montant ou réalisez un réaménagement budgétaire.';

                    const BudgetGaugeCard = ({ title, meta }) => (
                      <div className="rounded-lg border p-4 bg-white">
                        <div className="flex items-center justify-between mb-3">
                          <p className="text-sm font-semibold text-gray-900">{title}</p>
                          <Badge variant={meta.isAvailable ? 'success' : 'danger'}>
                            {meta.isAvailable ? 'Disponible' : 'Insuffisant'}
                          </Badge>
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Disponible</span>
                            <span className="font-semibold text-gray-900">{formatMontant(meta.dispo)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Montant engagement</span>
                            <span className="font-semibold text-gray-900">{formatMontant(meta.montant)}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-gray-600">Reste après engagement</span>
                            <span className={`font-semibold ${meta.reste >= 0 ? 'text-success-700' : 'text-danger-700'}`}>
                              {formatMontant(meta.reste)}
                            </span>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                            <span>Taux d'utilisation</span>
                            <span>{meta.ratio.toFixed(1)}%</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden">
                            <div
                              className={`h-2.5 ${meta.color}`}
                              style={{ width: `${meta.ratio}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    );

                    return (
                      <div className="space-y-4">
                        <div className={`rounded-lg border p-4 ${decisionClass}`}>
                          <p className="text-sm font-semibold">{decisionTitle}</p>
                          <p className="text-sm mt-1">{decisionHint}</p>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <BudgetGaugeCard title="AE disponible" meta={aeMeta} />
                          <BudgetGaugeCard title="CP disponible" meta={cpMeta} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Onglet 5 : Actions */}
              {activeTab === 5 && selectedEngagement.statut === 'soumise_daf' && (
                <div className="space-y-4">
                  <h4 className="font-semibold text-gray-900 mb-4">Actions Disponibles</h4>
                  <div className="space-y-3">
                    <Button
                      className="w-full"
                      onClick={handleEnvoyerVisa}
                    >
                      Envoyer pour visa
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={handleRetournerService}
                    >
                      Retourner au service
                    </Button>
                    <Button
                      variant="ghost"
                      className="w-full"
                      onClick={() => {
                        // Navigation vers lignes budgétaires avec filtre
                        window.location.href = `/daf/lignes-budgetaires?ligne=${selectedEngagement.ligne_budgetaire_id}`;
                      }}
                    >
                      Voir la ligne budgétaire
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
