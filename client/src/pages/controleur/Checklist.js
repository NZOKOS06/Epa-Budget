import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, LoadingSpinner, Badge } from '../../components/ui';

export default function ControleurChecklist() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [engagement, setEngagement] = useState(null);
  const [commentaire, setCommentaire] = useState('');
  const [showRefusModal, setShowRefusModal] = useState(false);
  const [motifRefus, setMotifRefus] = useState('');
  
  const [checklist, setChecklist] = useState([
    { id: 1, label: 'Vérification des crédits disponibles (AE/CP)', checked: false, required: true },
    { id: 2, label: 'Conformité avec le budget-programme', checked: false, required: true },
    { id: 3, label: 'Marché public conforme (Seuil > 10M)', checked: false, required: true },
    { id: 4, label: 'Pièces justificatives complètes et lisibles', checked: false, required: true },
    { id: 5, label: 'Imputation budgétaire correcte', checked: false, required: true },
  ]);
  
  const [loading, setLoading] = useState(true);

  const fetchEngagement = useCallback(async () => {
    try {
      const response = await api.get(`/controleur/engagements/${id}`);
      setEngagement(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      fetchEngagement();
    }
  }, [id, fetchEngagement]);

  const handleCheck = (id) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  const handleVisa = async () => {
    try {
      if (!window.confirm('Confirmer l\'apposition du visa favorable ?')) return;
      
      await api.post(`/controleur/engagements/${id}/visa`, { 
        decision: 'favorable',
        commentaire,
        checklist 
      });
      alert('Visa apposé avec succès');
      navigate('/controleur/file-visas');
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors de l\'apposition du visa');
    }
  };

  const handleConfirmRefus = async () => {
    if (!motifRefus || motifRefus.trim() === '') {
      alert('Le motif de refus est obligatoire (RG-07)');
      return;
    }
    
    try {
      await api.post(`/controleur/engagements/${id}/visa`, { 
        decision: 'defavorable',
        commentaire: motifRefus,
        checklist 
      });
      alert('Engagement rejeté avec succès');
      navigate('/controleur/file-visas');
    } catch (error) {
      console.error('Erreur:', error);
      alert(error.response?.data?.message || 'Erreur lors du rejet');
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const viewPiece = async (piece) => {
    if (!engagement) return;
    try {
      const response = await api.get(
        `/controleur/engagements/${engagement.id}/pieces/${piece.id}/view`,
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

  const downloadPiece = async (piece) => {
    if (!engagement) return;
    try {
      const response = await api.get(
        `/controleur/engagements/${engagement.id}/pieces/${piece.id}/download`,
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

  const allRequiredChecked = checklist.filter(item => item.required).every(item => item.checked);

  if (loading) {
    return <LoadingSpinner message="Chargement de l'engagement..." />;
  }

  if (!engagement) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Engagement introuvable</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Checklist Visa Contrôleur</h1>
          <p className="text-gray-600 mt-1">Engagement #{engagement.numero}</p>
        </div>
        <Button variant="outline" onClick={() => navigate('/controleur/file-visas')}>
          Retour à la file
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Informations engagement */}
          <Card>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <p className="text-sm text-gray-600">Numéro & Objet</p>
                <p className="text-lg font-bold text-primary-600">{engagement.numero}</p>
                <p className="text-gray-900 mt-1">{engagement.objet}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Montant de l'Engagement</p>
                <p className="text-xl font-semibold text-gray-900">{formatMontant(engagement.montant)}</p>
                <Badge variant={engagement.montant > 5000000 ? 'danger' : 'warning'} className="mt-1">
                  {engagement.montant > 5000000 ? 'PRIORITÉ HAUTE' : 'PRIORITÉ NORMALE'}
                </Badge>
              </div>
            </div>
            
            <div className="pt-4 border-t border-gray-100 grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Programme / Chapitre</p>
                <p className="font-medium">{engagement.programme_libelle}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Article / Ligne</p>
                <p className="font-medium">{engagement.article_code} - {engagement.article_libelle}</p>
              </div>
            </div>
          </Card>

          {/* Checklist */}
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Points de Contrôle Obligatoires</h2>
              <p className="text-sm text-gray-600 mt-1">Vérifiez chaque point avant de valider l'engagement</p>
            </div>

            <div className="space-y-3">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={`flex items-center p-4 rounded-lg border-2 transition-all ${
                    item.checked ? 'bg-success-50 border-success-200' : 'bg-white border-gray-200 shadow-sm'
                  }`}
                >
                  <input
                    type="checkbox"
                    id={`check-${item.id}`}
                    checked={item.checked}
                    onChange={() => handleCheck(item.id)}
                    className="w-5 h-5 text-primary-600 rounded focus:ring-primary-500 cursor-pointer"
                  />
                  <label htmlFor={`check-${item.id}`} className="ml-3 flex-1 cursor-pointer font-medium text-gray-900">
                    {item.label}
                  </label>
                  {item.checked && (
                    <svg className="w-5 h-5 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              ))}
            </div>
          </Card>

          {/* Commentaire de Visa */}
          <Card>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Commentaire du Contrôleur</h2>
            <textarea
              className="input-field min-h-[100px]"
              placeholder="Ajoutez vos observations ici..."
              value={commentaire}
              onChange={(e) => setCommentaire(e.target.value)}
            />
          </Card>
        </div>

        <div className="space-y-6">
          {/* État des Crédits */}
          <Card className="bg-primary-50 border-primary-100">
            <h2 className="text-lg font-bold text-primary-900 mb-4">Disponibilité Budgétaire</h2>
            <div className="space-y-4">
              <div>
                <p className="text-xs text-primary-700 uppercase font-semibold">AE Disponible (Avant)</p>
                <p className="text-xl font-semibold text-primary-900">{formatMontant(engagement.ae_disponible)}</p>
              </div>
              <div className="pt-2 border-t border-primary-200">
                <p className="text-xs text-primary-700 uppercase font-semibold">Montant Engagement</p>
                <p className="text-xl font-semibold text-danger-600">- {formatMontant(engagement.montant)}</p>
              </div>
              <div className="pt-2 border-t border-primary-200">
                <p className="text-xs text-primary-700 uppercase font-semibold">AE Résiduel (Prévision)</p>
                <p className={`text-xl font-semibold ${engagement.ae_disponible - engagement.montant < 0 ? 'text-danger-700' : 'text-success-700'}`}>
                  {formatMontant(engagement.ae_disponible - engagement.montant)}
                </p>
              </div>
            </div>
            {engagement.ae_disponible - engagement.montant < 0 && (
              <div className="mt-4 p-3 bg-danger-100 text-danger-800 rounded-lg text-sm font-bold flex items-center">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Dépassement Budgétaire !
              </div>
            )}
          </Card>

          {/* Pièces Jointes */}
          <Card>
            <h2 className="text-lg font-bold text-gray-900 mb-4">Documents Justificatifs</h2>
            <div className="space-y-2">
              {engagement.pieces_jointes && engagement.pieces_jointes.length > 0 ? (
                engagement.pieces_jointes.map((p, i) => (
                  <div key={i} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded border">
                    <span className="text-sm truncate mr-2">{p.nom_fichier}</span>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => viewPiece(p)}>
                        Visualiser
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => downloadPiece(p)}>
                        Télécharger
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-sm text-gray-500 italic">Aucune pièce jointe</p>
              )}
            </div>
          </Card>

          {/* Actions Finales */}
          <div className="space-y-3">
            <Button
              className={`w-full h-14 text-lg ${!allRequiredChecked ? 'opacity-50 grayscale' : 'shadow-lg shadow-primary-200'}`}
              onClick={handleVisa}
              disabled={!allRequiredChecked}
            >
              Apposer le Visa
            </Button>
            <Button
              variant="outline"
              className="w-full text-danger-600 border-danger-200 hover:bg-danger-50"
              onClick={() => setShowRefusModal(true)}
            >
              Refus Motivé
            </Button>
          </div>
        </div>
      </div>

      {/* Modal de Refus */}
      {showRefusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-semibold text-gray-900 mb-4">Motif de Refus (Obligatoire)</h3>
            <p className="text-sm text-gray-600 mb-4">Indiquez précisément la raison du rejet pour permettre au service de corriger la demande.</p>
            <textarea
              className="input-field min-h-[120px] mb-4"
              placeholder="Ex: Crédits insuffisants, Devis manquant..."
              value={motifRefus}
              onChange={(e) => setMotifRefus(e.target.value)}
              autoFocus
            />
            <div className="flex space-x-3">
              <Button variant="outline" className="flex-1" onClick={() => setShowRefusModal(false)}>
                Annuler
              </Button>
              <Button variant="danger" className="flex-1" onClick={handleConfirmRefus}>
                Confirmer le Rejet
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
