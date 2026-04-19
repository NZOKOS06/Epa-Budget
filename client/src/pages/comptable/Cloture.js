import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, KPICard } from '../../components/ui';

export default function ComptableCloture() {
  const [chapitres, setChapitres] = useState([]);
  const [etapes, setEtapes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [stats, setStats] = useState({ total_ae: 0, total_cp: 0, total_paye: 0 });

  useEffect(() => {
    fetchDonnees();
  }, []);

  const fetchDonnees = async () => {
    try {
      const [clotureRes, etapesRes] = await Promise.all([
        api.get('/comptable/cloture'),
        api.get('/comptable/cloture/etapes').catch(() => ({ data: [] })) // Mock si non implémenté
      ]);
      
      setChapitres(clotureRes.data || []);
      
      // Stats globales
      const ae = clotureRes.data.reduce((acc, curr) => acc + parseFloat(curr.montant_alloue || 0), 0);
      const cp = clotureRes.data.reduce((acc, curr) => acc + parseFloat(curr.cp_alloue || 0), 0);
      const paye = clotureRes.data.reduce((acc, curr) => acc + parseFloat(curr.montant_paye || 0), 0);
      setStats({ total_ae: ae, total_cp: cp, total_paye: paye });

      if (etapesRes.data && etapesRes.data.length > 0) {
        setEtapes(etapesRes.data);
      } else {
        setEtapes([
          { id: 1, nom: 'Génération Comptes Administratifs', statut: 'TERMINE', date: new Date() },
          { id: 2, nom: 'Génération Comptes Financiers', statut: 'TERMINE', date: new Date() },
          { id: 3, nom: 'Certification e-signature', statut: 'EN_COURS', date: null },
          { id: 4, nom: 'Soumission CCDB', statut: 'EN_ATTENTE', date: null },
        ]);
      }
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerer = async () => {
    setGenerating(true);
    try {
      await api.post('/comptable/cloture/generer', {});
      fetchDonnees();
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setGenerating(false);
    }
  };

  const handleCertifier = async () => {
    try {
      await api.post('/comptable/cloture/certifier', {});
      fetchDonnees();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const handleSoumettre = async () => {
    try {
      await api.post('/comptable/cloture/soumettre', {});
      fetchDonnees();
    } catch (error) {
      console.error('Erreur:', error);
    }
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const calcTaux = (paye, initial) => {
    if (!initial || initial === 0) return 0;
    return ((paye / initial) * 100).toFixed(1);
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des données de clôture..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Clôture Comptable</h1>
          <p className="text-gray-600 mt-1">Bilan d'exécution par programme et soumission CCDB</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPICard
          title="Total AE Initial"
          value={formatMontant(stats.total_ae)}
          subtitle="Autorisations d'Engagement"
          color="primary"
        />
        <KPICard
          title="Total CP Initial"
          value={formatMontant(stats.total_cp)}
          subtitle="Crédits de Paiement"
          color="info"
        />
        <KPICard
          title="Total Exécuté (Payé)"
          value={formatMontant(stats.total_paye)}
          subtitle={`Taux d'exécution: ${calcTaux(stats.total_paye, stats.total_cp)}%`}
          color={calcTaux(stats.total_paye, stats.total_cp) > 80 ? 'success' : 'warning'}
        />
      </div>

      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Situation d'Exécution par Programme</h2>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableHead>Programme</TableHead>
              <TableHead className="text-right">AE Initial</TableHead>
              <TableHead className="text-right">CP Initial</TableHead>
              <TableHead className="text-right">AE Engagé</TableHead>
              <TableHead className="text-right">CP Payé</TableHead>
              <TableHead className="text-right">CP Restant</TableHead>
              <TableHead className="text-right">Exécution</TableHead>
            </TableHeader>
            <TableBody>
              {chapitres.map((chap, idx) => {
                const aeInit = parseFloat(chap.montant_alloue || 0);
                const cpInit = parseFloat(chap.cp_alloue || 0);
                const aeEng = parseFloat(chap.montant_engage || 0);
                const cpPaye = parseFloat(chap.montant_paye || 0);
                const cpRestant = cpInit - cpPaye;
                const taux = calcTaux(cpPaye, cpInit);

                return (
                  <TableRow key={idx}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-bold text-gray-900">{chap.chapitre_code}</span>
                        <span className="text-sm text-gray-600">{chap.chapitre_libelle}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatMontant(aeInit)}</TableCell>
                    <TableCell className="text-right font-medium">{formatMontant(cpInit)}</TableCell>
                    <TableCell className="text-right">{formatMontant(aeEng)}</TableCell>
                    <TableCell className="text-right font-bold text-gray-900">{formatMontant(cpPaye)}</TableCell>
                    <TableCell className="text-right">{formatMontant(cpRestant)}</TableCell>
                    <TableCell className="text-right">
                      <Badge variant={taux > 80 ? 'success' : taux > 50 ? 'warning' : 'danger'}>
                        {taux}%
                      </Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </Card>

      {/* Étapes de clôture */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">Processus de Clôture</h2>
          <p className="text-sm text-gray-600 mt-1">Suivi des étapes de génération et certification</p>
        </div>

        <div className="space-y-4">
          {etapes.map((etape, index) => (
            <div
              key={etape.id}
              className={`p-4 rounded-lg border-2 ${
                etape.statut === 'TERMINE'
                  ? 'bg-success-50 border-success-200'
                  : etape.statut === 'EN_COURS'
                  ? 'bg-primary-50 border-primary-200'
                  : 'bg-gray-50 border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${
                    etape.statut === 'TERMINE'
                      ? 'bg-success-500 text-white'
                      : etape.statut === 'EN_COURS'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-300 text-gray-600'
                  }`}>
                    {etape.statut === 'TERMINE' ? '✓' : index + 1}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{etape.nom}</p>
                    {etape.date && (
                      <p className="text-xs text-gray-600 mt-1">
                        Terminé le {format(new Date(etape.date), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      </p>
                    )}
                  </div>
                </div>
                <Badge
                  variant={
                    etape.statut === 'TERMINE' ? 'success' :
                    etape.statut === 'EN_COURS' ? 'primary' :
                    'gray'
                  }
                >
                  {etape.statut}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-6 pt-6 border-t border-gray-200 space-y-3">
          {etapes.find(e => e.statut === 'EN_ATTENTE' && e.nom.includes('Génération')) && (
            <Button
              onClick={handleGenerer}
              disabled={generating}
              className="w-full"
            >
              {generating ? 'Génération en cours...' : 'Générer les Comptes'}
            </Button>
          )}
          {etapes.find(e => e.statut === 'EN_COURS' && e.nom.includes('Certification')) && (
            <Button
              onClick={handleCertifier}
              className="w-full btn-success"
            >
              Certifier avec e-signature
            </Button>
          )}
          {etapes.find(e => e.statut === 'EN_ATTENTE' && e.nom.includes('Soumission')) && (
            <Button
              onClick={handleSoumettre}
              className="w-full"
            >
              Soumettre à la CCDB (31 mars)
            </Button>
          )}
        </div>
      </Card>

      {/* Informations */}
      <Card className="bg-primary-50 border-primary-200">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-primary-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm font-medium text-primary-900">Échéance de soumission</p>
            <p className="text-xs text-primary-700 mt-1">
              Les comptes annuels doivent être soumis à la CCDB avant le 31 mars de l'année suivante.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
