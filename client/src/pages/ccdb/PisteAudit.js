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
  TextField,
  Button,
  Box,
} from '@mui/material';
import api from '../../services/api';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export default function CCDBPisteAudit() {
  const [engagements, setEngagements] = useState([]);
  const [filters, setFilters] = useState({
    numero_engagement: '',
    epa_id: '',
    date_debut: '',
    date_fin: '',
    montant_min: '',
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEngagements();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchEngagements = async () => {
    setLoading(true);
    try {
      const response = await api.get('/ccdb/piste-audit', { params: filters });
      setEngagements(response.data);
    } catch (error) {
      console.error('Erreur:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    fetchEngagements();
  };

  const formatMontant = (montant) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0,
    }).format(montant || 0);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Piste Audit
      </Typography>

      <Paper sx={{ p: 2, mt: 2 }}>
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
          <TextField
            label="Numéro engagement"
            value={filters.numero_engagement}
            onChange={(e) => setFilters({ ...filters, numero_engagement: e.target.value })}
            size="small"
          />
          <TextField
            label="Date début"
            type="date"
            value={filters.date_debut}
            onChange={(e) => setFilters({ ...filters, date_debut: e.target.value })}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Date fin"
            type="date"
            value={filters.date_fin}
            onChange={(e) => setFilters({ ...filters, date_fin: e.target.value })}
            size="small"
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Montant min"
            type="number"
            value={filters.montant_min}
            onChange={(e) => setFilters({ ...filters, montant_min: e.target.value })}
            size="small"
          />
          <Button variant="contained" onClick={handleSearch}>
            Rechercher
          </Button>
        </Box>

        {loading ? (
          <Typography>Chargement...</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Numéro</TableCell>
                  <TableCell>EPA</TableCell>
                  <TableCell>Programme</TableCell>
                  <TableCell>Montant</TableCell>
                  <TableCell>Statut</TableCell>
                  <TableCell>Date</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {engagements.map((eng) => (
                  <TableRow key={eng.id} hover>
                    <TableCell>{eng.numero}</TableCell>
                    <TableCell>{eng.epa_nom}</TableCell>
                    <TableCell>{eng.programme_libelle}</TableCell>
                    <TableCell>{formatMontant(eng.montant)}</TableCell>
                    <TableCell>{eng.statut}</TableCell>
                    <TableCell>
                      {format(new Date(eng.created_at), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </div>
  );
}

