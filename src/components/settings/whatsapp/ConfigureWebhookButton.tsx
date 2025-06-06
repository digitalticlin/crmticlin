
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ConfigureWebhookButtonProps {
  instanceId: string;
  instanceName: string;
  onSuccess?: () => void;
}

export const ConfigureWebhookButton = ({ 
  instanceId, 
  instanceName, 
  onSuccess 
}: ConfigureWebhookButtonProps) => {
  const [isConfiguring, setIsConfiguring] = useState(false);

  const handleConfigureWebhook = async () => {
    setIsConfiguring(true);
    
    try {
      console.log('[Configure Webhook] 🔧 Configurando webhook para:', instanceName);
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: {
          action: 'configure_webhook',
          instanceData: {
            instanceId
          }
        }
      });

      if (error) {
        throw new Error(error.message);
      }

      if (!data?.success) {
        throw new Error(data?.error || 'Erro ao configurar webhook');
      }

      toast.success(`Webhook configurado com sucesso para ${instanceName}!`, {
        description: 'A instância agora receberá atualizações de status automaticamente.'
      });

      console.log('[Configure Webhook] ✅ Webhook configurado:', data);
      
      if (onSuccess) {
        onSuccess();
      }

    } catch (error) {
      console.error('[Configure Webhook] ❌ Erro:', error);
      toast.error('Erro ao configurar webhook', {
        description: error.message
      });
    } finally {
      setIsConfiguring(false);
    }
  };

  return (
    <Button
      onClick={handleConfigureWebhook}
      disabled={isConfiguring}
      size="sm"
      variant="outline"
      className="gap-2 bg-blue-50/20 border-blue-300/30 text-blue-700 hover:bg-blue-50/30"
    >
      {isConfiguring ? (
        <>
          <Settings className="h-4 w-4 animate-spin" />
          Configurando...
        </>
      ) : (
        <>
          <Settings className="h-4 w-4" />
          Configurar Webhook
        </>
      )}
    </Button>
  );
};
