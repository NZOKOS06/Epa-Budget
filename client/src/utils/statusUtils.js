/**
 * Utilitaires pour la gestion et l'affichage des statuts de manière professionnelle.
 */

const STATUS_MAP = {
  brouillon: {
    label: 'Brouillon',
    variant: 'gray',
    description: 'Demande en cours de rédaction'
  },
  soumise_daf: {
    label: 'En attente de visa DAF',
    variant: 'warning',
    description: 'En attente de vérification par la Direction Administrative et Financière'
  },
  en_attente_cb: {
    label: 'En attente de visa budgétaire',
    variant: 'info',
    description: 'Transmis au Contrôleur Budgétaire pour contrôle et visa'
  },
  en_attente_dg: {
    label: 'En attente d\'approbation finale',
    variant: 'warning',
    description: 'En attente de la signature finale par le Directeur Général (Ordonnateur)'
  },
  valide: {
    label: 'Approuvé',
    variant: 'success',
    description: 'Engagement approuvé et signé par le DG'
  },
  rejete: {
    label: 'Rejeté',
    variant: 'danger',
    description: 'Demande refusée ou retournée'
  },
  liquide: {
    label: 'Liquidé',
    variant: 'success',
    description: 'Dépense liquidée, en attente de paiement'
  },
  paye: {
    label: 'Payé',
    variant: 'success',
    description: 'Paiement effectué'
  },
  // Statuts de liquidation
  en_attente: {
    label: 'En attente de validation',
    variant: 'warning',
    description: 'PV de réception en attente de validation comptable'
  },
  validee: {
    label: 'Validée',
    variant: 'success',
    description: 'Liquidation validée par le comptable'
  },
  payee: {
    label: 'Liquidée et payée',
    variant: 'success',
    description: 'Paiement effectué'
  },
  // Statuts génériques (souvent en majuscules dans certains composants)
  approuve: {
    label: 'Approuvé',
    variant: 'success',
  },
  refuse: {
    label: 'Refusé',
    variant: 'danger',
  },
  en_visa: {
    label: 'En Visa',
    variant: 'info',
  },
  // Statuts de budget
  preparation: {
    label: 'En préparation',
    variant: 'warning',
  },
  actif: {
    label: 'Actif',
    variant: 'success',
  },
  cloture: {
    label: 'Clôturé',
    variant: 'gray',
  }
};

/**
 * Récupère les métadonnées d'un statut (label, variante de couleur, etc.)
 * @param {string} statut - Le code du statut (ex: 'en_attente_dg')
 * @returns {object} Les métadonnées du statut
 */
export const getStatusMeta = (statut) => {
  const key = (statut || '').toLowerCase();
  return STATUS_MAP[key] || { 
    label: statut || 'Inconnu', 
    variant: 'gray',
    description: '' 
  };
};

/**
 * Formate un code de statut en label lisible
 * @param {string} statut 
 * @returns {string}
 */
export const formatStatus = (statut) => {
  return getStatusMeta(statut).label;
};

export default STATUS_MAP;
