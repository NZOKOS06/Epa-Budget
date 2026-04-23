const axios = require('axios');

const BASE_URL = 'http://localhost:5001';

async function testControleurEndpoints() {
  let token = null;
  
  try {
    console.log('🔐 Connexion en tant que contrôleur...');
    
    // 1. Login pour obtenir le token
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/login`, {
      email: 'controleur@epa001.cg',
      password: 'password123'
    });
    
    token = loginResponse.data.token;
    console.log('✅ Connexion réussie');
    
    const authHeaders = {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };

    console.log('\n🧪 Test des endpoints du Contrôleur...');
    
    // 2. Test endpoint file-visas
    try {
      const fileVisasResponse = await axios.get(`${BASE_URL}/api/controleur/file-visas`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/controleur/file-visas - OK');
      console.log('   Engagements en attente:', fileVisasResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/controleur/file-visas - ERREUR:', error.response?.data || error.message);
    }

    // 3. Test endpoint alertes-derive
    try {
      const alertesResponse = await axios.get(`${BASE_URL}/api/controleur/alertes-derive`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/controleur/alertes-derive - OK');
      console.log('   Alertes dérive:', alertesResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/controleur/alertes-derive - ERREUR:', error.response?.data || error.message);
    }

    // 4. Test endpoint journal-controles
    try {
      const journalResponse = await axios.get(`${BASE_URL}/api/controleur/journal-controles`, {
        headers: authHeaders
      });
      console.log('✅ GET /api/controleur/journal-controles - OK');
      console.log('   Contrôles effectués:', journalResponse.data.length);
    } catch (error) {
      console.log('❌ GET /api/controleur/journal-controles - ERREUR:', error.response?.data || error.message);
    }

    console.log('\n🎯 Tests de workflow...');
    
    // 5. Test détail d'un engagement
    let engagementId = null;
    try {
      const fileVisasResponse = await axios.get(`${BASE_URL}/api/controleur/file-visas`, {
        headers: authHeaders
      });
      
      if (fileVisasResponse.data.length > 0) {
        engagementId = fileVisasResponse.data[0].id;
        
        const detailResponse = await axios.get(`${BASE_URL}/api/controleur/engagements/${engagementId}`, {
          headers: authHeaders
        });
        console.log('✅ GET /api/controleur/engagements/:id - OK');
        console.log('   Engagement:', detailResponse.data.numero);
        console.log('   Pièces jointes:', detailResponse.data.pieces_jointes?.length || 0);
        console.log('   Avis précédents:', detailResponse.data.avis?.length || 0);
      } else {
        console.log('⚠️  Pas d\'engagements en attente pour tester le détail');
      }
    } catch (error) {
      console.log('❌ GET /api/controleur/engagements/:id - ERREUR:', error.response?.data || error.message);
    }

    // 6. Test visa favorable
    if (engagementId) {
      try {
        const visaResponse = await axios.post(`${BASE_URL}/api/controleur/engagements/${engagementId}/visa`, 
          { 
            decision: 'favorable',
            commentaire: 'Test visa favorable Contrôleur',
            checklist: [
              { id: 1, label: 'Vérification des crédits disponibles', checked: true, required: true },
              { id: 2, label: 'Conformité avec le budget-programme', checked: true, required: true },
              { id: 3, label: 'Pièces justificatives complètes', checked: true, required: true }
            ]
          },
          { headers: authHeaders }
        );
        console.log('✅ POST /api/controleur/engagements/:id/visa (favorable) - OK');
        console.log('   Engagement visa favorable:', engagementId);
      } catch (error) {
        console.log('❌ POST /api/controleur/engagements/:id/visa (favorable) - ERREUR:', error.response?.data || error.message);
      }
    }

    // 7. Test création d'engagement pour visa défavorable
    let newEngagementId = null;
    try {
      // D'abord créer un engagement pour tester le visa défavorable
      const servicesResponse = await axios.get(`${BASE_URL}/api/services/articles-budgetaires`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (servicesResponse.data.length > 0) {
        const article = servicesResponse.data[0];
        const createResponse = await axios.post(`${BASE_URL}/api/services/demandes-engagements`, 
          {
            ligne_budgetaire_id: article.id,
            montant: 50000,
            objet: 'Test engagement pour visa contrôleur'
          },
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        newEngagementId = createResponse.data.id;
        console.log('✅ Création engagement pour test - OK (ID:', newEngagementId, ')');
      }
    } catch (error) {
      console.log('⚠️  Impossible de créer un engagement pour le test:', error.response?.data || error.message);
    }

    // 8. Test visa défavorable
    if (newEngagementId) {
      try {
        // D'abord soumettre l'engagement au contrôleur
        await axios.post(`${BASE_URL}/api/services/demandes-engagements/${newEngagementId}/soumettre`, 
          {},
          { headers: { 'Authorization': `Bearer ${token}` } }
        );
        
        // Puis tester le visa défavorable
        const visaDefavorableResponse = await axios.post(`${BASE_URL}/api/controleur/engagements/${newEngagementId}/visa`, 
          { 
            decision: 'defavorable',
            commentaire: 'Test visa défavorable - motif obligatoire',
            checklist: [
              { id: 1, label: 'Vérification des crédits disponibles', checked: false, required: true },
              { id: 2, label: 'Conformité avec le budget-programme', checked: false, required: true }
            ]
          },
          { headers: authHeaders }
        );
        console.log('✅ POST /api/controleur/engagements/:id/visa (defavorable) - OK');
        console.log('   Engagement rejeté:', newEngagementId);
      } catch (error) {
        console.log('❌ POST /api/controleur/engagements/:id/visa (defavorable) - ERREUR:', error.response?.data || error.message);
      }
    }

    console.log('\n🎉 Tests terminés!');
    
  } catch (error) {
    console.error('❌ Erreur critique:', error.message);
    if (error.response) {
      console.error('   Détails:', error.response.data);
    }
  }
}

testControleurEndpoints();
