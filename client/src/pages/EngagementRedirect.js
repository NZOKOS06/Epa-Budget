import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { authService } from '../services/auth';

/**
 * Composant de redirection pour les notifications d'engagements.
 * Redirige l'utilisateur vers la page appropriée selon son rôle.
 */
export default function EngagementRedirect() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = authService.getCurrentUser();

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Définition de la destination selon le rôle
    let targetPath = '/';

    switch (user.role) {
      case 'DAF':
        targetPath = `/daf/engagements?id=${id}`;
        break;
      case 'SERVICE':
        targetPath = `/services/demandes-engagements?id=${id}`;
        break;
      case 'DG':
        targetPath = `/dg/approbations?id=${id}`;
        break;
      case 'CONTROLEUR':
        targetPath = `/controleur/file-visas?id=${id}`;
        break;
      case 'COMPTABLE':
        targetPath = `/comptable/controle-regularite?id=${id}`;
        break;
      default:
        targetPath = '/';
    }

    navigate(targetPath, { replace: true });
  }, [id, user, navigate]);

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
    </div>
  );
}
