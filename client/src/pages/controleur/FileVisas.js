import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, KPICard } from '../../components/ui';
import { getStatusMeta } from '../../utils/statusUtils';

export default function ControleurFileVisas() {
  const [visas, setVisas] = useState([]);
  const [stats, setStats] = useState({ total: 0, urgent: 0, montantTotal: 0 });
  const [loading, setLoading] = useState(true);
  const [filtres, setFiltres] = useState({
    recherche: '',
    priorite: '',
    montant: '',
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchVisas();
  }, []);

  const fetchVisas = async () => {
    try {
      const response = await api.get('/controleur/file-visas');
      const data = response.data || [];
      setVisas(data);
      
      // Calculer les statistiques réelles
      const total = data.length;
      const urgent = data.filter(v => parseFloat(v.montant) > 5000000).length;
      const montantTotal = data.reduce((acc, curr) => acc + parseFloat(curr.montant), 0);
      
      setStats({ total, urgent, montantTotal });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const handleVisa = (id) => {
    navigate(`/controleur/checklist/${id}`);
  };

  // Filtrer les visas
  const visasFiltres = visas.filter(visa => {
    if (filtres.priorite) {
      const isUrgent = parseFloat(visa.montant) > 5000000;
      if (filtres.priorite === 'URGENT' && !isUrgent) return false;
      if (filtres.priorite === 'NORMAL' && isUrgent) return false;
    }
    
    if (filtres.recherche) {
      const search = filtres.recherche.toLowerCase();
      return (
        visa.numero.toLowerCase().includes(search) ||
        visa.objet.toLowerCase().includes(search) ||
        visa.demandeur_nom.toLowerCase().includes(search)
      );
    }
    
    return true;
  }).sort((a, b) => {
    // Trier par montant décroissant (plus gros d'abord)
    return parseFloat(b.montant) - parseFloat(a.montant);
  });

  if (loading) {
    return <LoadingSpinner message="Chargement de la file visas..." />;
  }

  // Icônes pour KPIs
  const FileIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const UrgentIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const MoneyIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">File des Visas</h1>
          <p className="text-gray-600 mt-1">Contrôle de régularité et disponibilité des crédits</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Engagements en attente"
          value={stats.total}
          subtitle="Dossiers à viser"
          icon={<FileIcon />}
          color="primary"
        />
        <KPICard
          title="Dossiers Urgents"
          value={stats.urgent}
          subtitle="Montant > 5 000 000 FCFA"
          icon={<UrgentIcon />}
          color="danger"
        />
        <KPICard
          title="Volume à Viser"
          value={formatMontant(stats.montantTotal)}
          subtitle="Total des AE sollicitées"
          icon={<MoneyIcon />}
          color="success"
        />
      </div>

      {/* Filtres */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recherche rapide
            </label>
            <input
              type="text"
              placeholder="Numéro, objet, demandeur..."
              value={filtres.recherche}
              onChange={(e) => setFiltres({ ...filtres, recherche: e.target.value })}
              className="input-field"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Priorité Budgétaire
            </label>
            <select
              value={filtres.priorite}
              onChange={(e) => setFiltres({ ...filtres, priorite: e.target.value })}
              className="input-field"
            >
              <option value="">Tous les dossiers</option>
              <option value="URGENT">🔴 Urgents (&gt;5M FCFA)</option>
              <option value="NORMAL">🟢 Normaux (&le;5M FCFA)</option>
            </select>
          </div>
        </div>
      </Card>

      {/* Tableau des visas */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Liste des Engagements soumis</h2>
          <p className="text-sm text-gray-600 mt-1">
            {visasFiltres.length} dossier(s) en attente de visa
          </p>
        </div>

        {visasFiltres.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Numéro & Date</TableHead>
                <TableHead>Demandeur / Service</TableHead>
                <TableHead>Programme / Ligne</TableHead>
                <TableHead>Montant AE</TableHead>
                <TableHead>AE Disponible</TableHead>
                <TableHead>Priorité</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableHeader>
              <TableBody>
                {visasFiltres.map((visa) => {
                  const isUrgent = parseFloat(visa.montant) > 5000000;
                  const hasFunds = parseFloat(visa.ae_disponible) >= parseFloat(visa.montant);
                  
                  return (
                    <TableRow key={visa.id} className={isUrgent ? 'bg-danger-50/30' : ''}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-bold text-primary-700">{visa.numero}</span>
                          <span className="text-xs text-gray-500">
                            {format(new Date(visa.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{visa.demandeur_nom}</span>
                          <span className="text-xs text-gray-500">{visa.epa_nom}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col max-w-xs">
                          <span className="text-sm font-medium truncate" title={visa.programme_libelle}>
                            {visa.programme_libelle}
                          </span>
                          <span className="text-xs text-gray-500">Article: {visa.article_code}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="font-bold text-gray-900">
                          {formatMontant(visa.montant)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant={hasFunds ? 'success' : 'danger'}>
                          {formatMontant(visa.ae_disponible)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={isUrgent ? 'danger' : 'info'}>
                          {isUrgent ? 'URGENT' : 'NORMAL'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          onClick={() => handleVisa(visa.id)}
                          size="sm"
                          variant={hasFunds ? 'primary' : 'outline'}
                        >
                          Examiner
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
            title="File vide"
            description="Aucun engagement en attente de visa pour le moment."
          />
        )}
      </Card>
    </div>
  );
}
