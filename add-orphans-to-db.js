const axios = require("axios");

const orphanInstances = [
  "contatoluizantoniooliveira1",
  "contatoluizantoniooliveira2", 
  "contatoluizantoniooliveira3",
  "contatoluizantoniooliveira4",
  "digitalticlin1",
  "digitalticlin2"
];

async function addOrphansToDatabase() {
  console.log("📝 Adicionando instâncias órfãs ao banco temporariamente...");
  
  try {
    // Buscar user_id válido
    const getResponse = await axios.get(
      "https://rhjgagzstjzynvrakdyj.supabase.co/rest/v1/whatsapp_instances?select=created_by_user_id&limit=1",
      {
        headers: {
          "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM",
          "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM",
          "Content-Type": "application/json"
        }
      }
    );
    
    const validUserId = getResponse.data[0]?.created_by_user_id;
    console.log(`✅ User ID: ${validUserId}`);
    
    let added = 0;
    let alreadyExists = 0;
    
    for (const instanceName of orphanInstances) {
      try {
        const insertData = {
          instance_name: instanceName,
          vps_instance_id: instanceName,
          connection_status: "qr_ready",
          created_by_user_id: validUserId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        await axios.post(
          "https://rhjgagzstjzynvrakdyj.supabase.co/rest/v1/whatsapp_instances",
          insertData,
          {
            headers: {
              "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM",
              "apikey": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MDUxMzEwMCwiZXhwIjoyMDY2MDg5MTAwfQ.48XYhDq4XdVTqNhIHdskd6iMcJem38aHzk6U1psfRRM",
              "Content-Type": "application/json"
            }
          }
        );
        
        console.log(`✅ ${instanceName} adicionada`);
        added++;
        
      } catch (error) {
        if (error.response?.status === 409) {
          console.log(`⚠️ ${instanceName} já existe`);
          alreadyExists++;
        } else {
          console.error(`❌ Erro ao adicionar ${instanceName}:`, error.message);
        }
      }
      
      // Delay entre inserções
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log(`\n📊 Resultado:`);
    console.log(`   • Adicionadas: ${added}`);
    console.log(`   • Já existiam: ${alreadyExists}`);
    console.log(`\n🎯 Agora você pode deletar pelo frontend!`);
    console.log(`\n📋 Lista de instâncias órfãs no banco:`);
    orphanInstances.forEach(name => console.log(`   • ${name}`));
    
  } catch (error) {
    console.error("❌ Erro geral:", error.message);
  }
}

addOrphansToDatabase(); 