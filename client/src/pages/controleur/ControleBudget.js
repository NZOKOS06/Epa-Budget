import React, { useState, useEffect, useCallback } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge, Select, BarChart, KPICard } from '../../components/ui';

export default function ControleurControleBudget() {
  const [data, setData] = useState({
    articles: [],
    engagements: [],
    alertes: [],
    stats: {}
  });
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    programme: 'tous',
    statut: 'tous',
    seuil: 'tous'
  });
  const [viewMode, setViewMode] = useState('tableau');

  const fetchData = useCallback(async () => {
    try {
      // Récupérer les articles budgétaires
      const articlesResponse = await api.get('/services/articles-budgetaires');
      
      // Récupérer les engagements en attente
      const engagementsResponse = await api.get('/controleur/file-visas');
      
      // Récupérer les alertes de dérive
      const alertesResponse = await api.get('/controleur/alertes-derive');

      // Calculer les statistiques
      const stats = {
        totalArticles: articlesResponse.data?.length || 0,
        totalEngagements: engagementsResponse.data?.length || 0,
        totalAlertes: alertesResponse.data?.length || 0,
        montantTotalEngagements: engagementsResponse.data?.reduce((sum, item) => sum + parseFloat(item.montant || 0), 0) || 0,
        articlesCritiques: articlesResponse.data?.filter(article => 
          parseFloat(article.ae_disponible || 0) < (parseFloat(article.ae_initial || 0) * 0.1)
        ).length || 0
      };

      setData({
        articles: articlesResponse.data || [],
        engagements: engagementsResponse.data || [],
        alertes: alertesResponse.data || [],
        stats
      });
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  const getTauxExecution = (article) => {
    const initial = parseFloat(article.ae_initial || 0);
    const engage = parseFloat(article.ae_engage || 0);
    return initial > 0 ? Math.round((engage / initial) * 100) : 0;
  };

  const getStatutArticle = (article) => {
    const disponible = parseFloat(article.ae_disponible || 0);
    const initial = parseFloat(article.ae_initial || 0);
    
    if (disponible <= 0) return 'epuise';
    if (disponible < (initial * 0.1)) return 'critique';
    if (disponible < (initial * 0.3)) return 'alerte';
    return 'normal';
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'epuise': return <Badge variant="danger">Épuisé</Badge>;
      case 'critique': return <Badge variant="danger">Critique</Badge>;
      case 'alerte': return <Badge variant="warning">Alerte</Badge>;
      default: return <Badge variant="success">Normal</Badge>;
    }
  };

  // Filtrer les données
  const filteredArticles = data.articles.filter(article => {
    const matchProgramme = filters.programme === 'tous' || article.chapitre_libelle === filters.programme;
    const statut = getStatutArticle(article);
    const matchStatut = filters.statut === 'tous' || statut === filters.statut;
    
    return matchProgramme && matchStatut;
  });

  const filteredEngagements = data.engagements.filter(engagement => {
    const matchProgramme = filters.programme === 'tous' || engagement.programme_libelle === filters.programme;
    const montant = parseFloat(engagement.montant || 0);
    const matchSeuil = filters.seuil === 'tous' || 
      (filters.seuil === 'urgent' && montant > 5000000) ||
      (filters.seuil === 'normal' && montant <= 5000000);
    
    return matchProgramme && matchSeuil;
  });

  // Préparer les données pour le graphique
  const chartData = filteredArticles.map(article => ({
    name: article.code || article.libelle?.substring(0, 15),
    initial: parseFloat(article.ae_initial || 0),
    engage: parseFloat(article.ae_engage || 0),
    disponible: parseFloat(article.ae_disponible || 0)
  }));

  if (loading) {
    return <LoadingSpinner message="Chargement du contrôle budgétaire..." />;
  }

  // Icônes pour les KPIs
  const ArticlesIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );

  const EngagementsIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );

  const AlertesIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );

  const MoneyIcon = () => (
    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Contrôle Budgétaire</h1>
          <p className="text-gray-600 mt-1">Analyse détaillée des articles budgétaires et engagements</p>
        </div>
        <div className="flex items-center space-x-3">
          <Button
            variant={viewMode === 'tableau' ? 'primary' : 'outline'}
            onClick={() => setViewMode('tableau')}
          >
            Tableau
          </Button>
          <Button
            variant={viewMode === 'graphique' ? 'primary' : 'outline'}
            onClick={() => setViewMode('graphique')}
          >
            Graphiques
          </Button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard
          title="Articles Budgétaires"
          value={data.stats.totalArticles}
          subtitle={`${data.stats.articlesCritiques} critiques`}
          icon={<ArticlesIcon />}
          color={data.stats.articlesCritiques > 0 ? "warning" : "success"}
        />
        <KPICard
          title="Engagements en Attente"
          value={data.stats.totalEngagements}
          subtitle="À contrôler"
          icon={<EngagementsIcon />}
          color={data.stats.totalEngagements > 0 ? "warning" : "success"}
        />
        <KPICard
          title="Alertes de Dérive"
          value={data.stats.totalAlertes}
          subtitle="Risques détectés"
          icon={<AlertesIcon />}
          color={data.stats.totalAlertes > 0 ? "danger" : "primary"}
        />
        <KPICard
          title="Montant Total"
          value={formatMontant(data.stats.montantTotalEngagements)}
          subtitle="En attente de visa"
          icon={<MoneyIcon />}
          color="primary"
        />
      </div>

      {/* Filtres */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Filtres</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Programme</label>
            <Select
              value={filters.programme}
              onChange={(e) => setFilters({...filters, programme: e.target.value})}
              className="w-full"
            >
              <option value="tous">Tous les programmes</option>
              {[...new Set(data.articles.map(a => a.chapitre_libelle))].map(programme => (
                <option key={programme} value={programme}>{programme}</option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut Article</label>
            <Select
              value={filters.statut}
              onChange={(e) => setFilters({...filters, statut: e.target.value})}
              className="w-full"
            >
              <option value="tous">Tous les statuts</option>
              <option value="normal">Normal</option>
              <option value="alerte">Alerte</option>
              <option value="critique">Critique</option>
              <option value="epuise">Épuisé</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Seuil Montant</label>
            <Select
              value={filters.seuil}
              onChange={(e) => setFilters({...filters, seuil: e.target.value})}
              className="w-full"
            >
              <option value="tous">Tous les montants</option>
              <option value="urgent">Urgent (&gt;5M)</option>
              <option value="normal">Normal (&le;5M)</option>
            </Select>
          </div>
        </div>
      </Card>

      {viewMode === 'tableau' ? (
        <div className="space-y-6">
          {/* Articles Budgétaires */}
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Articles Budgétaires</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredArticles.length} article(s) affiché(s)
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Code</TableHead>
                  <TableHead>Libellé</TableHead>
                  <TableHead>Programme</TableHead>
                  <TableHead className="text-right">AE Initial</TableHead>
                  <TableHead className="text-right">AE Engagé</TableHead>
                  <TableHead className="text-right">AE Disponible</TableHead>
                  <TableHead className="text-center">Taux Exécution</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                </TableHeader>
                <TableBody>
                  {filteredArticles.map((article) => (
                    <TableRow key={article.id} className="hover:bg-gray-50">
                      <TableCell>
                        <span className="font-semibold text-gray-900">{article.code}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700 truncate max-w-xs" title={article.libelle}>
                          {article.libelle}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700">{article.chapitre_libelle}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        {formatMontant(article.ae_initial)}
                      </TableCell>
                      <TableCell className="text-right text-primary-600">
                        {formatMontant(article.ae_engage)}
                      </TableCell>
                      <TableCell className="text-right">
                        <span className={parseFloat(article.ae_disponible || 0) < parseFloat(article.ae_initial || 0) * 0.1 ? 'text-danger-600 font-semibold' : ''}>
                          {formatMontant(article.ae_disponible)}
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="font-medium">
                          {getTauxExecution(article)}%
                        </span>
                      </TableCell>
                      <TableCell className="text-center">
                        {getStatutBadge(getStatutArticle(article))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>

          {/* Engagements en Attente */}
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Engagements en Attente de Visa</h2>
              <p className="text-sm text-gray-600 mt-1">
                {filteredEngagements.length} engagement(s) affiché(s)
              </p>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableHead>Numéro</TableHead>
                  <TableHead>Objet</TableHead>
                  <TableHead>Demandeur</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Article</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableHeader>
                <TableBody>
                  {filteredEngagements.map((engagement) => (
                    <TableRow key={engagement.id} className="hover:bg-gray-50">
                      <TableCell>
                        <span className="font-semibold text-primary-600">{engagement.numero}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700 truncate max-w-xs" title={engagement.objet}>
                          {engagement.objet}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700">{engagement.demandeur_nom}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="font-semibold text-gray-900">
                          {formatMontant(engagement.montant)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span className="text-gray-700">{engagement.article_code}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          onClick={() => window.location.href = `/controleur/checklist/${engagement.id}`}
                        >
                          Contrôler
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Graphique des Articles */}
          <Card>
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Situation des Articles Budgétaires</h2>
            </div>
            <div className="h-96">
              <BarChart
                data={chartData}
                xKey="name"
                yKeys={['initial', 'engage', 'disponible']}
                colors={['#3B82F6', '#10B981', '#F59E0B']}
                height={400}
              />
            </div>
          </Card>
        </div>
      )}

      {/* Alertes de Dérive */}
      {data.alertes.length > 0 && (
        <Card className="border-l-4 border-l-danger-500">
          <div className="mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Alertes de Dérive Budgétaire</h2>
            <p className="text-sm text-gray-600 mt-1">
              Risques de dépassement détectés
            </p>
          </div>
          <div className="space-y-3">
            {data.alertes.slice(0, 5).map((alerte) => (
              <div
                key={alerte.id}
                className="flex items-start justify-between p-4 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Badge variant="danger">
                      {alerte.type_alerte}
                    </Badge>
                    <h3 className="font-semibold text-gray-900">{alerte.numero}</h3>
                  </div>
                  <p className="text-sm text-gray-700 mb-2">{alerte.objet}</p>
                  <div className="flex items-center space-x-4 text-xs text-gray-600">
                    <span>Montant: {formatMontant(alerte.montant)}</span>
                    <span>AE Disponible: {formatMontant(alerte.ae_disponible)}</span>
                    <span>Article: {alerte.article_code}</span>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="danger"
                  onClick={() => window.location.href = `/controleur/checklist/${alerte.id}`}
                >
                  Contrôler
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
