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
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CCDBComptesAnnuels() {
  const [comptes, setComptes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchComptes();
  }, []);

  const fetchComptes = async () => {
    try {
      const response = await api.get('/ccdb/comptes-annuels');
      setComptes(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Typography>Chargement...</Typography>;

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Comptes Annuels
      </Typography>

      <Paper sx={{ p: 2, mt: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>EPA</TableCell>
                <TableCell>Secteur</TableCell>
                <TableCell>Année</TableCell>
                <TableCell>Période</TableCell>
                <TableCell>Statut</TableCell>
                <TableCell>Date création</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {comptes.map((compte) => (
                <TableRow key={compte.id} hover>
                  <TableCell>{compte.epa_nom}</TableCell>
                  <TableCell>{compte.secteur}</TableCell>
                  <TableCell>{compte.annee}</TableCell>
                  <TableCell>{compte.periode}</TableCell>
                  <TableCell>{compte.statut}</TableCell>
                  <TableCell>
                    {format(new Date(compte.created_at), 'dd/MM/yyyy', { locale: fr })}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </div>
  );
}

