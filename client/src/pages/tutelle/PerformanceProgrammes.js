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

export default function TutellePerformanceProgrammes() {
  const [performance, setPerformance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPerformance();
  }, []);

  const fetchPerformance = async () => {
    try {
      const response = await api.get('/tutelle/performance-programmes');
      setPerformance(response.data);
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
        Performance Programmes
      </Typography>

      <Paper sx={{ p: 2, mt: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>EPA</TableCell>
                <TableCell>Secteur</TableCell>
                <TableCell>Programme</TableCell>
                <TableCell>Budget Initial</TableCell>
                <TableCell>Nb Engagements</TableCell>
                <TableCell>Montant Exécuté</TableCell>
                <TableCell>Taux Exécution</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {performance.map((item) => (
                <TableRow key={`${item.epa_nom}-${item.programme_code}`}>
                  <TableCell>{item.epa_nom}</TableCell>
                  <TableCell>{item.secteur}</TableCell>
                  <TableCell>{item.programme_libelle}</TableCell>
                  <TableCell>{formatMontant(item.budget_initial)}</TableCell>
                  <TableCell>{item.nb_engagements}</TableCell>
                  <TableCell>{formatMontant(item.montant_execute)}</TableCell>
                  <TableCell>{item.taux_execution || 0}%</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
}

