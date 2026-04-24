import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, EmptyState, Badge, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Select } from '../../components/ui';

export default function DGRapportsTutelle() {
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRapport, setSelectedRapport] = useState(null);
  const [showPreview, setShowPreview] = useState(false);
  const [filterType, setFilterType] = useState('tous');
  const [filterStatut, setFilterStatut] = useState('tous');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchRapports();
  }, []);

  const fetchRapports = async () => {
    try {
      const response = await api.get('/dg/rapports-tutelle');
      setRapports(response.data || []);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async (rapportId) => {
    try {
      window.open(`/api/dg/rapports/${rapportId}/export`, '_blank');
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export PDF');
    }
  };

  const handleTransmettreTutelle = async (rapportId) => {
    try {
      await api.post(`/dg/rapports/${rapportId}/transmettre`);
      alert('Rapport transmis à la tutelle avec succès');
      fetchRapports();
    } catch (error) {
      console.error('Erreur transmission:', error);
      alert('Erreur lors de la transmission');
    }
  };

  const handlePrevisualiser = (rapport) => {
    setSelectedRapport(rapport);
    setShowPreview(true);
  };

  const handleModifier = (rapport) => {
    // Logique de modification (redirection vers page d'édition)
    console.log('Modifier rapport:', rapport.id);
  };

  // Filtrer les rapports selon les critères
  const filteredRapports = rapports.filter(rapport => {
    const matchType = filterType === 'tous' || rapport.type === filterType;
    const matchStatut = filterStatut === 'tous' || rapport.statut === filterStatut;
    const matchSearch = searchTerm === '' || 
      rapport.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rapport.periode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rapport.epa_nom?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchType && matchStatut && matchSearch;
  });

  // Statistiques
  const stats = {
    total: rapports.length,
    brouillons: rapports.filter(r => r.statut === 'BROUILLON').length,
    valides: rapports.filter(r => r.statut === 'VALIDE' || r.statut === 'PRET').length,
    transmis: rapports.filter(r => r.statut === 'TRANSMIS').length,
    trimestriels: rapports.filter(r => r.type === 'RAP_TRIMESTRIEL').length,
    annuels: rapports.filter(r => r.type === 'COMPTES_ANNUELS').length
  };

  const getTypeLabel = (type) => {
    const types = {
      'RAP_TRIMESTRIEL': 'Rapport Trimestriel',
      'COMPTES_ANNUELS': 'Comptes Annuels',
      'RAPPORT_SPECIAL': 'Rapport Spécial'
    };
    return types[type] || type;
  };

  const getStatutBadge = (statut) => {
    switch(statut) {
      case 'BROUILLON':
        return <Badge variant="warning">BROUILLON</Badge>;
      case 'VALIDE':
      case 'PRET':
        return <Badge variant="success">VALIDE</Badge>;
      case 'TRANSMIS':
        return <Badge variant="info">TRANSMIS</Badge>;
      default:
        return <Badge>{statut}</Badge>;
    }
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des rapports..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">Rapports Tutelle</h1>
          <p className="text-gray-600 mt-1">Gestion et transmission des rapports à l'autorité de tutelle</p>
        </div>
        <Button>
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Nouveau Rapport
        </Button>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-4">
          <div className="text-center">
            <div className="text-xl font-semibold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">Total Rapports</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-xl font-semibold text-warning-600">{stats.brouillons}</div>
            <div className="text-sm text-gray-600">Brouillons</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-xl font-semibold text-success-600">{stats.valides}</div>
            <div className="text-sm text-gray-600">Validés</div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-center">
            <div className="text-xl font-semibold text-info-600">{stats.transmis}</div>
            <div className="text-sm text-gray-600">Transmis</div>
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Filtres et Recherche</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Recherche</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher un rapport..."
              className="w-full border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500 sm:text-sm px-3 py-2 border"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Type</label>
            <Select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full"
            >
              <option value="tous">Tous les types</option>
              <option value="RAP_TRIMESTRIEL">Rapports Trimestriels</option>
              <option value="COMPTES_ANNUELS">Comptes Annuels</option>
              <option value="RAPPORT_SPECIAL">Rapports Spéciaux</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Statut</label>
            <Select
              value={filterStatut}
              onChange={(e) => setFilterStatut(e.target.value)}
              className="w-full"
            >
              <option value="tous">Tous les statuts</option>
              <option value="BROUILLON">Brouillons</option>
              <option value="VALIDE">Validés</option>
              <option value="TRANSMIS">Transmis</option>
            </Select>
          </div>
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setFilterType('tous');
                setFilterStatut('tous');
                setSearchTerm('');
              }}
              className="w-full"
            >
              Réinitialiser
            </Button>
          </div>
        </div>
        <div className="mt-4 text-sm text-gray-600">
          {filteredRapports.length} rapport(s) trouvé(s) sur {rapports.length}
        </div>
      </Card>

      {/* Liste des Rapports - Tableau selon documentation */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900">Liste des Rapports</h2>
          <p className="text-sm text-gray-600 mt-1">
            {filteredRapports.length} rapport(s) affiché(s)
          </p>
        </div>
        {filteredRapports.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableHead>Type</TableHead>
                <TableHead>EPA</TableHead>
                <TableHead>Période</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Date création</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableHeader>
              <TableBody>
                {filteredRapports.map((rapport) => (
                  <TableRow key={rapport.id}>
                    <TableCell>
                      <span className="font-medium text-gray-900">
                        {getTypeLabel(rapport.type)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{rapport.epa_nom || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-700">{rapport.periode || 'N/A'}</span>
                    </TableCell>
                    <TableCell>
                      {getStatutBadge(rapport.statut)}
                    </TableCell>
                    <TableCell>
                      <span className="text-gray-600">
                        {format(new Date(rapport.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {rapport.statut === 'BROUILLON' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleModifier(rapport)}
                          >
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                            </svg>
                            Modifier
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handlePrevisualiser(rapport)}
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          Prévisualiser
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleExportPDF(rapport.id)}
                        >
                          <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          Télécharger PDF
                        </Button>
                        {rapport.statut === 'VALIDE' || rapport.statut === 'PRET' ? (
                          <Button
                            size="sm"
                            onClick={() => {
                              if (window.confirm('Êtes-vous sûr de vouloir transmettre ce rapport à la tutelle ?')) {
                                handleTransmettreTutelle(rapport.id);
                              }
                            }}
                          >
                            <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                            Transmettre à Tutelle
                          </Button>
                        ) : null}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <EmptyState
            title="Aucun rapport disponible"
            description="Les rapports générés apparaîtront ici"
          />
        )}
      </Card>

      {/* Modal de Prévisualisation */}
      {showPreview && selectedRapport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b p-6 flex items-center justify-between">
              <h3 className="text-xl font-semibold text-gray-900">
                Prévisualisation - {getTypeLabel(selectedRapport.type)}
              </h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Type</p>
                <p className="font-semibold text-gray-900">{getTypeLabel(selectedRapport.type)}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Période</p>
                <p className="font-semibold text-gray-900">{selectedRapport.periode || 'N/A'}</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Statut</p>
                <div className="mt-1">{getStatutBadge(selectedRapport.statut)}</div>
              </div>
              <div className="mt-6 pt-4 border-t">
                <p className="text-sm text-gray-600 mb-4">Aperçu du contenu du rapport...</p>
                {/* Contenu du rapport ici */}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
