import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/auth';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await authService.login(email, password);
      const user = data.user;
      
      // Rediriger selon le rôle
      const rolePath = {
        DG: '/dg/dashboard',
        DAF: '/daf/programmes',
        CONTROLEUR: '/controleur/file-visas',
        COMPTABLE: '/comptable/controle-regularite',
        SERVICE: '/services/programmes',
        TUTELLE: '/tutelle/consolidation',
        CCDB: '/ccdb/piste-audit',
      };

      navigate(rolePath[user.role] || '/');
    } catch (err) {
      setError(err.response?.data?.message || 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          {/* Header institutionnel */}
          <div className="bg-slate-900 p-8 text-center">
            <div className="w-14 h-14 bg-primary-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">EB</span>
            </div>
            <h1 className="text-xl font-semibold text-white mb-1 tracking-tight">
              Contrôle et Suivi Budgétaire
            </h1>
            <p className="text-slate-400 text-sm">
              EPA Congo-Brazzaville
            </p>
          </div>

          {/* Formulaire */}
          <div className="p-8">
            {error && (
              <div className="mb-5 p-3 bg-danger-50 border border-danger-200 rounded-md">
                <p className="text-danger-700 text-sm">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input-field"
                  placeholder="votre.email@epa.cg"
                />
              </div>

              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Mot de passe
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Connexion en cours...
                  </>
                ) : (
                  'Se connecter'
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-gray-200">
              <p className="text-xs text-center text-gray-400">
                Système de gestion budgétaire sécurisé
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-400">
            Comptes de test : dg@epa001.cg / daf@epa001.cg / password123
          </p>
        </div>
      </div>
    </div>
  );
}
