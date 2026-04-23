const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testDGEndpoints() {
  let token = null;
  
  try {
    console.log('🔐 Connexion en tant que DG...');
    
    // 1. Login pour obtenir le token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'dg@epa001.cg',
      password: 'password123'
    });
    
    token = loginResponse.data.token;
    console.log('✅ Connexion réussie');
    
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n🧪 Test des endpoints du DG...');
    
    // 2. Test endpoint dashboard
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/api/dg/dashboard`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/dg/dashboard - OK');
      console.log('   Engagements en attente:', dashboardResponse.data.engagements?.length || 0);
      console.log('   Alertes:', dashboardResponse.data.alertes?.length || 0);
      console.log('   Programmes:', dashboardResponse.data.programmes?.length || 0);
    } catch (error) {
      console.log('❌ GET /api/dg/dashboard - ERREUR:', error.response?.data || error.message);
    }

    // 3. Test endpoint engagements-approuves
    try {
      const approuvesResponse = await axios.get(`${BASE_URL}/api/dg/engagements-approuves`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/dg/engagements-approuves - OK');
      console.log('   Engagements approuvés:', approuvesResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/dg/engagements-approuves - ERREUR:', error.response?.data || error.message);
    }

    // 4. Test endpoint sessions
    try {
      const sessionsResponse = await axios.get(`${BASE_URL}/api/dg/sessions`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/dg/sessions - OK');
      console.log('   Sessions trouvées:', sessionsResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/dg/sessions - ERREUR:', error.response?.data || error.message);
    }

    // 5. Test endpoint rapports-tutelle
    try {
      const rapportsResponse = await axios.get(`${BASE_URL}/api/dg/rapports-tutelle`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/dg/rapports-tutelle - OK');
      console.log('   Rapports trouvés:', rapportsResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/dg/rapports-tutelle - ERREUR:', error.response?.data || error.message);
    }

    console.log('\n🎯 Tests de workflow...');
    
    // 6. Test approbation d'engagement
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/api/dg/dashboard`, {
        headers: authHeaders
      });
      
      if (dashboardResponse.data.engagements?.length > 0) {
        const engagement = dashboardResponse.data.engagements[0];
        const approverResponse = await axios.post(`${BASE_URL}/api/dg/engagements/${engagement.id}/approver`, 
          { commentaire: 'Test approbation DG' },
          { headers: authHeaders }
        );
        console.log('✅ POST /api/dg/engagements/:id/approver - OK');
        console.log('   Engagement approuvé:', engagement.numero);
      } else {
        console.log('⚠️  Pas d\'engagements en attente pour tester l\'approbation');
      }
    } catch (error) {
      console.log('❌ POST /api/dg/engagements/:id/approver - ERREUR:', error.response?.data || error.message);
    }

    // 7. Test batch approbation
    try {
      const dashboardResponse = await axios.get(`${BASE_URL}/api/dg/dashboard`, {
        headers: authHeaders
      });
      
      if (dashboardResponse.data.engagements?.length >= 2) {
        const engagementIds = dashboardResponse.data.engagements.slice(0, 2).map(e => e.id);
        const batchResponse = await axios.post(`${BASE_URL}/api/dg/engagements/batch-approver`, 
          { 
            engagementIds: engagementIds,
            commentaire: 'Test batch approbation DG'
          },
          { headers: authHeaders }
        );
        console.log('✅ POST /api/dg/engagements/batch-approver - OK');
        console.log('   Engagements approuvés en batch:', engagementIds.length);
      } else {
        console.log('⚠️  Pas assez d\'engagements pour tester le batch');
      }
    } catch (error) {
      console.log('❌ POST /api/dg/engagements/batch-approver - ERREUR:', error.response?.data || error.message);
    }

    // 8. Test transmission rapport
    try {
      const rapportsResponse = await axios.get(`${BASE_URL}/api/dg/rapports-tutelle`, {
        headers: authHeaders
      });
      
      if (rapportsResponse.data.length > 0) {
        const rapport = rapportsResponse.data[0];
        const transmitResponse = await axios.post(`${BASE_URL}/api/dg/rapports/${rapport.id}/transmettre`, 
          {},
          { headers: authHeaders }
        );
        console.log('✅ POST /api/dg/rapports/:id/transmettre - OK');
        console.log('   Rapport transmis:', rapport.type);
      } else {
        console.log('⚠️  Pas de rapports pour tester la transmission');
      }
    } catch (error) {
      console.log('❌ POST /api/dg/rapports/:id/transmettre - ERREUR:', error.response?.data || error.message);
    }

    console.log('\n🎉 Tests terminés!');
    
  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
    if (error.response) {
      console.error('   Détails:', error.response.data);
    }
  }
}

testDGEndpoints();
