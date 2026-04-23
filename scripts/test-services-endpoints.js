const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testServicesEndpoints() {
  let token = null;
  
  try {
    console.log('🔐 Connexion en tant que service...');
    
    // 1. Login pour obtenir le token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'service@epa001.cg',
      password: 'password123'
    });
    
    token = loginResponse.data.token;
    console.log('✅ Connexion réussie');
    
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n🧪 Test des endpoints des Services Métiers...');
    
    // 2. Test endpoint programmes
    try {
      const programmesResponse = await axios.get(`${BASE_URL}/api/services/programmes`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/services/programmes - OK');
      console.log('   Programmes trouvés:', programmesResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/services/programmes - ERREUR:', error.response?.data || error.message);
    }

    // 3. Test endpoint articles-budgetaires
    try {
      const articlesResponse = await axios.get(`${BASE_URL}/api/services/articles-budgetaires`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/services/articles-budgetaires - OK');
      console.log('   Articles trouvés:', articlesResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/services/articles-budgetaires - ERREUR:', error.response?.data || error.message);
    }

    // 4. Test endpoint demandes-engagements
    try {
      const demandesResponse = await axios.get(`${BASE_URL}/api/services/demandes-engagements`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/services/demandes-engagements - OK');
      console.log('   Demandes trouvées:', demandesResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/services/demandes-engagements - ERREUR:', error.response?.data || error.message);
    }

    // 5. Test endpoint receptions
    try {
      const receptionsResponse = await axios.get(`${BASE_URL}/api/services/receptions`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/services/receptions - OK');
      console.log('   Réceptions trouvées:', receptionsResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/services/receptions - ERREUR:', error.response?.data || error.message);
    }

    // 6. Test endpoint indicateurs
    try {
      const indicateursResponse = await axios.get(`${BASE_URL}/api/services/indicateurs`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/services/indicateurs - OK');
      console.log('   Indicateurs trouvés:', indicateursResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/services/indicateurs - ERREUR:', error.response?.data || error.message);
    }

    // 7. Test endpoint engagements-receptionnables
    try {
      const engagementsResponse = await axios.get(`${BASE_URL}/api/services/engagements-receptionnables`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/services/engagements-receptionnables - OK');
      console.log('   Engagements réceptionnables:', engagementsResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/services/engagements-receptionnables - ERREUR:', error.response?.data || error.message);
    }

    console.log('\n🎯 Tests de création...');
    
    // 8. Test création d'engagement
    try {
      const articlesResponse = await axios.get(`${BASE_URL}/api/services/articles-budgetaires`, {
        headers: authHeaders
      });
      
      if (articlesResponse.data.length > 0) {
        const article = articlesResponse.data[0];
        const newEngagement = {
          ligne_budgetaire_id: article.id,
          montant: 100000,
          objet: 'Test engagement Services Métiers'
        };
        
        const createResponse = await axios.post(`${BASE_URL}/api/services/demandes-engagements`, newEngagement, {
          headers: authHeaders
        });
        console.log('✅ POST /api/services/demandes-engagements - OK');
        console.log('   Engagement créé ID:', createResponse.data.id);
      } else {
        console.log('⚠️  Pas d\'articles budgétaires disponibles pour tester la création');
      }
    } catch (error) {
      console.log('❌ POST /api/services/demandes-engagements - ERREUR:', error.response?.data || error.message);
    }

    // 9. Test création de réception
    try {
      const engagementsResponse = await axios.get(`${BASE_URL}/api/services/engagements-receptionnables`, {
        headers: authHeaders
      });
      
      if (engagementsResponse.data.length > 0) {
        const engagement = engagementsResponse.data[0];
        const receptionData = {
          date_reception: new Date().toISOString().split('T')[0],
          observations: 'Test réception Services Métiers'
        };
        
        const createReceptionResponse = await axios.post(`${BASE_URL}/api/services/engagements/${engagement.id}/reception`, receptionData, {
          headers: authHeaders
        });
        console.log('✅ POST /api/services/engagements/:id/reception - OK');
        console.log('   Réception créée ID:', createReceptionResponse.data.liquidation?.id);
      } else {
        console.log('⚠️  Pas d\'engagements réceptionnables disponibles pour tester la création de réception');
      }
    } catch (error) {
      console.log('❌ POST /api/services/engagements/:id/reception - ERREUR:', error.response?.data || error.message);
    }

    console.log('\n🎉 Tests terminés!');
    
  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
    if (error.response) {
      console.error('   Détails:', error.response.data);
    }
  }
}

testServicesEndpoints();
