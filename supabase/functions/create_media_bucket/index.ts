import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('[Media Bucket Setup] 🚀 Iniciando configuração do bucket...');
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 1. Criar bucket
    console.log('[Media Bucket Setup] 📁 Criando bucket media-files...');
    
    const { data: bucketData, error: bucketError } = await supabase.storage.createBucket('media-files', {
      public: true,
      allowedMimeTypes: [
        'image/*',
        'video/*',
        'audio/*',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'text/plain'
      ],
      fileSizeLimit: 104857600 // 100MB
    });

    if (bucketError && !bucketError.message.includes('already exists')) {
      console.error('[Media Bucket Setup] ❌ Erro ao criar bucket:', bucketError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao criar bucket: ' + bucketError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Media Bucket Setup] ✅ Bucket criado/já existe:', bucketData);

    // 2. Verificar bucket
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('[Media Bucket Setup] ❌ Erro ao listar buckets:', listError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Erro ao verificar buckets'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const mediaBucket = buckets?.find(b => b.id === 'media-files');
    
    if (!mediaBucket) {
      console.error('[Media Bucket Setup] ❌ Bucket não foi criado');
      return new Response(JSON.stringify({
        success: false,
        error: 'Bucket não foi criado corretamente'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Media Bucket Setup] ✅ Bucket verificado:', {
      id: mediaBucket.id,
      name: mediaBucket.name,
      public: mediaBucket.public,
      allowedMimeTypes: mediaBucket.allowed_mime_types,
      fileSizeLimit: mediaBucket.file_size_limit
    });

    // 3. Teste de upload
    console.log('[Media Bucket Setup] 🧪 Testando upload...');
    
    const testContent = new TextEncoder().encode("Teste de configuração do bucket");
    const testFileName = `test_${Date.now()}.txt`;
    
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('media-files')
      .upload(testFileName, testContent, {
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.error('[Media Bucket Setup] ❌ Erro no teste de upload:', uploadError);
      return new Response(JSON.stringify({
        success: false,
        error: 'Bucket criado mas upload falhou: ' + uploadError.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    console.log('[Media Bucket Setup] ✅ Teste de upload realizado:', uploadData);

    // 4. Teste de URL pública
    const { data: urlData } = supabase.storage
      .from('media-files')
      .getPublicUrl(testFileName);

    console.log('[Media Bucket Setup] ✅ URL pública gerada:', urlData.publicUrl);

    // 5. Limpar arquivo de teste
    await supabase.storage
      .from('media-files')
      .remove([testFileName]);

    console.log('[Media Bucket Setup] 🧹 Arquivo de teste removido');

    return new Response(JSON.stringify({
      success: true,
      message: 'Bucket media-files configurado com sucesso!',
      data: {
        bucketId: mediaBucket.id,
        bucketName: mediaBucket.name,
        public: mediaBucket.public,
        allowedMimeTypes: mediaBucket.allowed_mime_types,
        fileSizeLimit: mediaBucket.file_size_limit,
        testUpload: uploadData,
        testUrl: urlData.publicUrl
      }
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('[Media Bucket Setup] ❌ Erro interno:', error);
    return new Response(JSON.stringify({
      success: false,
      error: 'Erro interno: ' + error.message
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
}); 