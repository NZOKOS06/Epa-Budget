import React, { useState, useEffect } from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import api from '../../services/api';

export default function TutelleRapportsSectoriels() {
  const [rapports, setRapports] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRapports();
  }, []);

  const fetchRapports = async () => {
    try {
      const response = await api.get('/tutelle/rapports-sectoriels');
      setRapports(response.data);
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

  if (loading) return <Typography>Chargement...</Typography>;

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Rapports Sectoriels
      </Typography>

      <Paper sx={{ p: 2, mt: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Secteur</TableCell>
                <TableCell>Nb EPA</TableCell>
                <TableCell>Nb Engagements</TableCell>
                <TableCell>Total Engagements</TableCell>
                <TableCell>Total Payés</TableCell>
                <TableCell>Total Recettes</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rapports.map((rapport) => (
                <TableRow key={rapport.secteur}>
                  <TableCell>{rapport.secteur}</TableCell>
                  <TableCell>{rapport.nb_epa}</TableCell>
                  <TableCell>{rapport.nb_engagements}</TableCell>
                  <TableCell>{formatMontant(rapport.total_engagements)}</TableCell>
                  <TableCell>{formatMontant(rapport.total_payes)}</TableCell>
                  <TableCell>{formatMontant(rapport.total_recettes)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
}

