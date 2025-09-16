// Executar workers para processar filas
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://nruwnhcqhcdtxlqhygis.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im5ydXduaGNxaGNkdHhscWh5Z2lzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjUzOTc1NTYsImV4cCI6MjA0MDk3MzU1Nn0.iKHNRE5LCGvMqoD_7gksI5kKsX6s8Xj8y6TS7lEU7_E';

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeWorkers() {
    console.log('🔄 Executando workers para processar filas...');
    
    try {
        // 1. Verificar filas antes
        console.log('📦 Verificando status das filas...');
        const { data: beforeData, error: beforeError } = await supabase.rpc('webhook_media_worker');
        
        if (beforeError) {
            console.error('❌ Erro executando webhook_media_worker:', beforeError);
        } else {
            console.log('✅ webhook_media_worker executado:', beforeData);
        }

        // 2. Executar múltiplas vezes
        for (let i = 1; i <= 10; i++) {
            console.log(`🔄 Executando worker webhook ${i}/10...`);
            
            const { data, error } = await supabase.rpc('webhook_media_worker');
            
            if (error) {
                console.error(`❌ Erro na execução ${i}:`, error);
                break;
            } else if (data) {
                console.log(`✅ Worker ${i} processou:`, data);
            } else {
                console.log(`⚠️ Worker ${i} retornou null (fila vazia)`);
                break;
            }
            
            // Pequena pausa entre execuções
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        // 3. Verificar resultados
        console.log('📊 Verificando mensagens processadas...');
        const { data: messages, error: messagesError } = await supabase
            .from('messages')
            .select('id, text, media_type, media_url, created_at')
            .eq('created_by_user_id', '712e7708-2299-4a00-9128-577c8f113ca4')
            .neq('media_type', 'text')
            .not('media_url', 'is', null)
            .like('media_url', 'https://%')
            .gte('created_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()) // últimas 2 horas
            .order('created_at', { ascending: false })
            .limit(5);

        if (messagesError) {
            console.error('❌ Erro consultando mensagens:', messagesError);
        } else {
            console.log('✅ Mensagens com Storage URL após workers:', messages?.length || 0);
            if (messages && messages.length > 0) {
                messages.forEach(msg => {
                    console.log(`- ${msg.text} (${msg.media_type}): ${msg.media_url}`);
                });
            }
        }

        console.log('✅ Processamento concluído!');
        
    } catch (error) {
        console.error('❌ Erro geral:', error);
    }
}

executeWorkers();