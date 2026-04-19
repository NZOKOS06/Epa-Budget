import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, Button, LoadingSpinner, Table, TableHeader, TableBody, TableRow, TableHead, TableCell, Badge } from '../../components/ui';

export default function ComptableComptesAnnuels() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComptes();
  }, []);

  const fetchComptes = async () => {
    try {
      await api.get('/comptable/comptes-annuels');
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportCCDB = async () => {
    try {
      console.log('Export format CCDB');
      // window.open('/api/comptable/comptes-annuels/export-ccdb', '_blank');
    } catch (error) {
      console.error('Erreur export:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Chargement des comptes annuels..." />;
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Comptes Annuels</h1>
          <p className="text-gray-600 mt-1">États financiers certifiés et annexes</p>
        </div>
        <Button onClick={handleExportCCDB} variant="secondary">
          <svg className="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export Format CCDB
        </Button>
      </div>

      {/* Liste des comptes */}
      <Card>
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">États Financiers</h2>
          <p className="text-sm text-gray-600 mt-1">Comptes annuels certifiés</p>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableHead>Année</TableHead>
              <TableHead>Type de Compte</TableHead>
              <TableHead>Date de Certification</TableHead>
              <TableHead>Statut</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableHeader>
            <TableBody>
              {[
                { id: 1, annee: 2025, type: 'Comptes Administratifs', date_certification: new Date(), statut: 'CERTIFIE' },
                { id: 2, annee: 2025, type: 'Comptes Financiers', date_certification: new Date(), statut: 'CERTIFIE' },
                { id: 3, annee: 2025, type: 'Annexes', date_certification: new Date(), statut: 'CERTIFIE' },
              ].map((compte) => (
                <TableRow key={compte.id}>
                  <TableCell>
                    <span className="font-semibold text-gray-900">{compte.annee}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-700">{compte.type}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600">
                      {format(new Date(compte.date_certification), 'dd/MM/yyyy', { locale: fr })}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="success">{compte.statut}</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm">
                      Télécharger
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
}
