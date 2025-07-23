const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://rhjgagzstjzynvrakdyj.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJoamdnZ3pzdGp6eW52cmFrZHlqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczNTQ4MTM1OSwiZXhwIjoyMDUxMDU3MzU5fQ.xvJDW0TBf8cEwZB_tOZYKnZWWCOsOGh0n6u6MKJLl8w';

const supabase = createClient(supabaseUrl, supabaseKey);

async function processSpecificMedia() {
  console.log('🔄 Processando mídia específica que ficou faltando...');
  
  const messageId = '2740b624-049f-4cce-9687-398f83ae5af5';
  const externalMessageId = '3F0F27507AC2ABF9489F';
  const mediaUrl = 'https://mmg.whatsapp.net/o1/v/t24/f2/m239/AQPPxUStq17xgiROOZPOYVIfSl1kCUp_KInWAsXJ_NsPpNnsSn-FoX4yxPtntVo2_GdTnOzHdr2B8f1DiKOk7LsGxdBmaqXHhmABGvRXkw?ccb=9-4&oh=01_Q5Aa2AEPzQGzoykWNoUfzl9wBTBOOFugNlgp87tcnbe7GMCL-g&oe=68A85265&_nc_sid=e6ed6c&mms3=true';
  
  try {
    // 1. Download da mídia
    console.log('📥 Fazendo download da mídia...');
    const response = await fetch(mediaUrl);
    
    if (!response.ok) {
      throw new Error(`Download falhou: ${response.status}`);
    }
    
    const arrayBuffer = await response.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);
    const fileSizeBytes = bytes.length;
    
    console.log(`📊 Mídia baixada: ${(fileSizeBytes / 1024 / 1024).toFixed(2)}MB`);
    
    // 2. Converter para base64
    let binaryString = '';
    const chunkSize = 8192;
    for (let i = 0; i < bytes.length; i += chunkSize) {
      const chunk = bytes.slice(i, i + chunkSize);
      binaryString += String.fromCharCode.apply(null, Array.from(chunk));
    }
    const base64Data = btoa(binaryString);
    
    console.log(`🔄 Base64 gerado: ${base64Data.length} caracteres`);
    
    // 3. Tentar salvar no Storage
    const fileName = `${messageId}_${externalMessageId}_${Date.now()}.jpg`;
    
    console.log(`🗄️ Salvando no Storage: ${fileName}`);
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('whatsapp-media')
      .upload(fileName, bytes, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    let storageUrl = null;
    if (uploadError) {
      console.log(`⚠️ Storage falhou: ${uploadError.message}`);
    } else {
      const { data: urlData } = supabase.storage
        .from('whatsapp-media')
        .getPublicUrl(fileName);
      storageUrl = urlData.publicUrl;
      console.log(`✅ Storage URL: ${storageUrl}`);
    }
    
    // 4. Salvar no media_cache
    console.log('💾 Salvando no media_cache...');
    
    const { data: cacheData, error: cacheError } = await supabase
      .from('media_cache')
      .insert({
        message_id: messageId,
        external_message_id: externalMessageId,
        original_url: storageUrl || mediaUrl,
        base64_data: storageUrl ? null : base64Data, // Se tem Storage, não precisa base64
        file_name: `${externalMessageId}_image`,
        file_size: fileSizeBytes,
        media_type: 'image',
        created_at: new Date().toISOString()
      })
      .select('id')
      .single();

    if (cacheError) {
      throw new Error(`Cache save failed: ${cacheError.message}`);
    }

    console.log(`✅ Media cache salvo: ID ${cacheData.id}`);
    
    // 5. Atualizar URL na mensagem
    if (storageUrl) {
      const { error: updateError } = await supabase
        .from('messages')
        .update({ media_url: storageUrl })
        .eq('id', messageId);
        
      if (updateError) {
        console.log(`⚠️ Erro ao atualizar URL: ${updateError.message}`);
      } else {
        console.log(`✅ URL da mensagem atualizada`);
      }
    }
    
    console.log('\n✅ PROCESSO CONCLUÍDO COM SUCESSO!');
    console.log(`📋 Resumo:`);
    console.log(`- Message ID: ${messageId}`);
    console.log(`- External ID: ${externalMessageId}`);
    console.log(`- Cache ID: ${cacheData.id}`);
    console.log(`- Arquivo: ${fileSizeBytes} bytes`);
    console.log(`- Storage: ${storageUrl ? 'SIM' : 'NÃO'}`);
    console.log(`- Base64: ${storageUrl ? 'NÃO' : 'SIM'}`);
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

processSpecificMedia(); 