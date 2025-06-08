
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const executeDigitalticlinImport = async () => {
  try {
    console.log('[Digitalticlin Import] 🚀 Iniciando importação automática...');
    
    // Buscar a instância digitalticlin
    const { data: instances, error: fetchError } = await supabase
      .from('whatsapp_instances')
      .select('*')
      .eq('instance_name', 'digitalticlin')
      .eq('connection_status', 'ready')
      .single();

    if (fetchError || !instances) {
      console.error('[Digitalticlin Import] ❌ Instância não encontrada ou não conectada');
      toast.error('Instância "digitalticlin" não encontrada ou não está conectada');
      return;
    }

    console.log('[Digitalticlin Import] ✅ Instância encontrada:', instances.id);

    // Executar importação
    const { data, error } = await supabase.functions.invoke('whatsapp_chat_import', {
      body: {
        action: 'import_data',
        instanceId: instances.id,
        importType: 'both',
        batchSize: 50 // Últimas 50 mensagens por chat
      }
    });

    if (error) {
      throw new Error(error.message);
    }

    console.log('[Digitalticlin Import] 📊 Resultado:', data);

    if (data.success) {
      const { contactsImported, messagesImported } = data.summary || {};
      toast.success(
        `✅ Importação concluída!\n📋 ${contactsImported || 0} contatos\n💬 ${messagesImported || 0} mensagens`,
        { duration: 10000 }
      );
      
      console.log('[Digitalticlin Import] 🎉 Importação concluída com sucesso!');
      return data;
    } else {
      throw new Error(data.error || 'Erro desconhecido na importação');
    }

  } catch (error: any) {
    console.error('[Digitalticlin Import] ❌ Erro:', error);
    toast.error(`❌ Erro na importação: ${error.message}`, { duration: 8000 });
    throw error;
  }
};
