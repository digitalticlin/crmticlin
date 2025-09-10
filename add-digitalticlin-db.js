// 📝 ADICIONAR DIGITALTICLIN AO BANCO VIA API
const axios = require('axios');

async function addDigitalticlinToDatabase() {
  console.log('📝 Adicionando digitalticlin ao banco de dados...');
  
  try {
    // Primeiro, verificar user_id válido das instâncias existentes
    const getResponse = await axios.get(
      'https://rhjgagzstjzynvrakdyj.supabase.co/rest/v1/whatsapp_instances?select=created_by_user_id&limit=1',
      {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM',
          'Content-Type': 'application/json'
        }
      }
    );
    
    const validUserId = getResponse.data[0]?.created_by_user_id;
    console.log(`✅ User ID válido encontrado: ${validUserId}`);
    
    // Agora inserir digitalticlin
    const insertData = {
      instance_name: 'digitalticlin',
      vps_instance_id: 'digitalticlin',
      connection_status: 'connected',
      created_by_user_id: validUserId,
      date_connected: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const response = await axios.post(
      'https://rhjgagzstjzynvrakdyj.supabase.co/rest/v1/whatsapp_instances',
      insertData,
      {
        headers: {
          'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM',
          'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM',
          'Content-Type': 'application/json',
          'Prefer': 'return=representation'
        }
      }
    );
    
    console.log('✅ digitalticlin adicionada ao banco com sucesso!');
    console.log(`   ID: ${response.data[0]?.id}`);
    console.log(`   Instance Name: ${response.data[0]?.instance_name}`);
    console.log(`   VPS ID: ${response.data[0]?.vps_instance_id}`);
    console.log(`   Status: ${response.data[0]?.connection_status}`);
    
    return response.data[0];
    
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️ digitalticlin já existe no banco de dados');
      return 'already_exists';
    } else {
      console.error('❌ Erro ao adicionar digitalticlin:', error.message);
      if (error.response?.data) {
        console.error('Detalhes:', error.response.data);
      }
      throw error;
    }
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  addDigitalticlinToDatabase()
    .then(() => console.log('🎉 Processo concluído!'))
    .catch(console.error);
}

module.exports = { addDigitalticlinToDatabase }; 