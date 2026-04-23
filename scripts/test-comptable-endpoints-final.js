const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testComptableEndpoints() {
  let token = null;
  
  try {
    console.log('🔐 Connexion en tant que comptable...');
    
    // 1. Login pour obtenir le token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'comptable@epa001.cg',
      password: 'password123'
    });
    
    token = loginResponse.data.token;
    console.log('✅ Connexion réussie');
    
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n🧪 Test des endpoints du Comptable...');
    
    // 2. Test endpoint clôture
    try {
      const clotureResponse = await axios.get(`${BASE_URL}/api/comptable/cloture`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/comptable/cloture - OK');
      console.log('   Chapitres trouvés:', clotureResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/comptable/cloture - ERREUR:', error.response?.data || error.message);
    }

    // 3. Test endpoint etapes clôture
    try {
      const etapesResponse = await axios.get(`${BASE_URL}/api/comptable/cloture/etapes`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/comptable/cloture/etapes - OK');
      console.log('   Étapes trouvées:', etapesResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/comptable/cloture/etapes - ERREUR:', error.response?.data || error.message);
    }

    // 4. Test endpoint comptes annuels
    try {
      const comptesResponse = await axios.get(`${BASE_URL}/api/comptable/comptes-annuels`, {
        headers: authHeaders,
        params: { annee: 2026 }
      });
      console.log('✅ GET /api/comptable/comptes-annuels - OK');
      console.log('   Comptes trouvés:', comptesResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/comptable/comptes-annuels - ERREUR:', error.response?.data || error.message);
    }

    // 5. Test endpoint recettes
    try {
      const recettesResponse = await axios.get(`${BASE_URL}/api/comptable/recettes`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/comptable/recettes - OK');
      console.log('   Recettes trouvées:', recettesResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/comptable/recettes - ERREUR:', error.response?.data || error.message);
    }

    // 6. Test endpoint trésorerie
    try {
      const tresorerieResponse = await axios.get(`${BASE_URL}/api/comptable/tresorerie`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/comptable/tresorerie - OK');
      console.log('   Soldes trouvés:', tresorerieResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/comptable/tresorerie - ERREUR:', error.response?.data || error.message);
    }

    // 7. Test endpoint controle regularite
    try {
      const controleResponse = await axios.get(`${BASE_URL}/api/comptable/controle-regularite`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/comptable/controle-regularite - OK');
      console.log('   Dossiers trouvés:', controleResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/comptable/controle-regularite - ERREUR:', error.response?.data || error.message);
    }

    console.log('\n🎯 Tests de workflow...');
    
    // 8. Test génération clôture
    try {
      const genererResponse = await axios.post(`${BASE_URL}/api/comptable/cloture/generer`, 
        {},
        { headers: authHeaders }
      );
      console.log('✅ POST /api/comptable/cloture/generer - OK');
      console.log('   Clôture générée');
    } catch (error) {
      console.log('❌ POST /api/comptable/cloture/generer - ERREUR:', error.response?.data || error.message);
    }

    // 9. Test certification clôture
    try {
      const certifierResponse = await axios.post(`${BASE_URL}/api/comptable/cloture/certifier`, 
        {},
        { headers: authHeaders }
      );
      console.log('✅ POST /api/comptable/cloture/certifier - OK');
      console.log('   Clôture certifiée');
    } catch (error) {
      console.log('❌ POST /api/comptable/cloture/certifier - ERREUR:', error.response?.data || error.message);
    }

    // 10. Test export CCDB
    try {
      const exportResponse = await axios.get(`${BASE_URL}/api/comptable/comptes-annuels/export-ccdb`, {
        headers: authHeaders,
        params: { annee: 2026 }
      });
      console.log('✅ GET /api/comptable/comptes-annuels/export-ccdb - OK');
      console.log('   Export CCDB généré');
    } catch (error) {
      console.log('❌ GET /api/comptable/comptes-annuels/export-ccdb - ERREUR:', error.response?.data || error.message);
    }

    console.log('\n🎉 Tests terminés!');
    
  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
    if (error.response) {
      console.error('   Détails:', error.response.data);
    }
  }
}

testComptableEndpoints();
