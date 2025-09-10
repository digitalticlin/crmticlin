// Script para corrigir media_cache das mídias que falharam
const mediaData = [
  {
    message_id: 'fa98a478-cc6b-4bb5-b9c2-ad473977861c',
    external_message_id: '3F28B1773629F89852A3',
    original_url: 'https://mmg.whatsapp.net/o1/v/t24/f2/m239/AQPPxUStq17xgiROOZPOYVIfSl1kCUp_KInWAsXJ_NsPpNnsSn-FoX4yxPtntVo2_GdTnOzHdr2B8f1DiKOk7LsGxdBmaqXHhmABGvRXkw?ccb=9-4&oh=01_Q5Aa2AEPzQGzoykWNoUfzl9wBTBOOFugNlgp87tcnbe7GMCL-g&oe=68A85265&_nc_sid=e6ed6c&mms3=true',
    file_name: '3F28B1773629F89852A3_image',
    file_size: 132042,
    media_type: 'image'
  },
  {
    message_id: '4e86fb02-2daf-40b1-af29-2d54036b29cc',
    external_message_id: '3F526B0A71E135F58CE2',
    original_url: 'https://mmg.whatsapp.net/v/t62.7161-24/21426985_1162075525727772_5730359658516797203_n.enc?ccb=11-4&oh=01_Q5Aa2AFVTtNIaQjcpLLgT5f33qzIxAmhluZhF4TuqTVvhQVUfQ&oe=68A84838&_nc_sid=5e03e0&mms3=true',
    file_name: '3F526B0A71E135F58CE2_video',
    file_size: 1330634,
    media_type: 'video'
  }
];

async function processMediaFix() {
  const supabaseUrl = 'https://rhjgagzstjzynvrakdyj.supabase.co';
  const serviceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdhZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTQ4MTM1OSwiZXhwIjoyMDUxMDU3MzU5fQ.xvJDW0TBf8cEwZB_tOZYKnZWWCOsOGh0n6u6MKJLl8w';
  
  console.log('🔧 Corrigindo media_cache para as mídias que falharam...');
  
  for (const media of mediaData) {
    try {
      console.log(`\n📱 Processando ${media.media_type}: ${media.external_message_id}`);
      
      // 1. Download da mídia
      console.log('📥 Fazendo download...');
      const response = await fetch(media.original_url);
      if (!response.ok) {
        throw new Error(`Download falhou: ${response.status}`);
      }
      
      const arrayBuffer = await response.arrayBuffer();
      const bytes = new Uint8Array(arrayBuffer);
      const base64 = btoa(String.fromCharCode(...bytes));
      
      console.log(`✅ Download: ${(bytes.length / 1024).toFixed(1)}KB, Base64: ${base64.length} chars`);
      
      // 2. Inserir no media_cache via API
      const insertResponse = await fetch(`${supabaseUrl}/rest/v1/media_cache`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${serviceKey}`,
          'Content-Type': 'application/json',
          'apikey': serviceKey
        },
        body: JSON.stringify({
          message_id: media.message_id,
          external_message_id: media.external_message_id,
          original_url: media.original_url,
          base64_data: base64,
          file_name: media.file_name,
          file_size: media.file_size,
          media_type: media.media_type
        })
      });
      
      if (insertResponse.ok) {
        console.log(`✅ ${media.media_type} inserida no media_cache!`);
      } else {
        const error = await insertResponse.text();
        console.log(`❌ Erro na inserção: ${insertResponse.status} - ${error}`);
      }
      
      // Pausa entre processamentos
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.error(`❌ Erro ao processar ${media.external_message_id}:`, error.message);
    }
  }
  
  console.log('\n🎯 Verificação final - consultando media_cache...');
  
  // Verificar se foram inseridas
  for (const media of mediaData) {
    try {
      const checkResponse = await fetch(
        `${supabaseUrl}/rest/v1/media_cache?external_message_id=eq.${media.external_message_id}&select=id,message_id,external_message_id,media_type,base64_data`, 
        {
          headers: {
            'Authorization': `Bearer ${serviceKey}`,
            'apikey': serviceKey
          }
        }
      );
      
      const result = await checkResponse.json();
      if (result.length > 0) {
        console.log(`✅ ${media.external_message_id}: Cache ID ${result[0].id}, Base64: ${result[0].base64_data ? 'SIM' : 'NÃO'}`);
      } else {
        console.log(`❌ ${media.external_message_id}: NÃO encontrado no cache`);
      }
    } catch (error) {
      console.error(`❌ Erro na verificação:`, error.message);
    }
  }
  
  console.log('\n🎉 Processo concluído!');
}

// Executar
processMediaFix().catch(console.error); 