import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Import, Loader2, CheckCircle, Clock } from 'lucide-react';
import { TwoStepImportModal } from '../TwoStepImportModal';
import { useImportHistoryStatus } from '@/hooks/whatsapp/useImportHistoryStatus';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ImportHistoryButtonProps {
  instanceId: string;
  instanceName: string;
  connectionStatus: string;
}

export const ImportHistoryButton = ({ 
  instanceId, 
  instanceName, 
  connectionStatus 
}: ImportHistoryButtonProps) => {
  const [showModal, setShowModal] = useState(false);
  const { isImporting, hasBeenImported, startImport } = useImportHistoryStatus(instanceId);

  // Verificar se está conectada
  const isConnected = ['ready', 'connected', 'open'].includes(connectionStatus?.toLowerCase() || '');
  
  const handleImportClick = async () => {
    if (!isConnected) {
      // ✅ NOVA LÓGICA: Registrar intenção de importação no banco
      try {
        const { data: { user } } = await supabase.auth.getUser();
        
        if (!user) {
          toast.error('Usuário não autenticado');
          return;
        }

        // Verificar se já existe uma intenção pendente
        const { data: existingIntent } = await (supabase as any)
          .from('import_intentions')
          .select('id')
          .eq('instance_id', instanceId)
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();

        if (existingIntent) {
          toast.info(
            `📋 Importação já agendada para ${instanceName}`,
            {
              description: 'Já existe uma importação pendente para esta instância. Ela será executada automaticamente quando conectar.',
              duration: 6000,
            }
          );
          return;
        }

        // Registrar nova intenção de importação
        const { error: intentError } = await (supabase as any)
          .from('import_intentions')
          .insert({
            instance_id: instanceId,
            user_id: user.id,
            status: 'pending',
            metadata: {
              instance_name: instanceName,
              requested_via: 'import_button',
              timestamp: new Date().toISOString()
            }
          });

        if (intentError) {
          console.error('[Import] ❌ Erro ao registrar intenção:', intentError);
          toast.error('Erro ao agendar importação');
          return;
        }

        toast.success(
          `📋 Importação agendada para ${instanceName}`,
          {
            description: 'A importação iniciará automaticamente assim que a instância conectar. Você receberá uma notificação quando o processo começar.',
            duration: 6000,
          }
        );
        
        console.log(`[Import] ✅ Intenção de importação registrada para: ${instanceId}`);
        
      } catch (error: any) {
        console.error('[Import] ❌ Erro ao processar intenção:', error);
        toast.error(`Erro ao agendar importação: ${error.message}`);
      }
      
      return;
    }
    
    // Instância conectada → Abrir modal normalmente
    setShowModal(true);
  };

  // ✅ SEMPRE MOSTRAR O BOTÃO (mesmo quando desconectada)
  return (
    <>
      <Button
        variant={hasBeenImported ? "outline" : "default"}
        size="sm"
        onClick={handleImportClick}
        disabled={isImporting}
        className={`flex items-center gap-2 ${
          hasBeenImported 
            ? 'text-green-600 border-green-200 hover:bg-green-50' 
            : isConnected
              ? 'bg-blue-500 hover:bg-blue-600 text-white'
              : 'bg-orange-500 hover:bg-orange-600 text-white'
        }`}
      >
        {isImporting ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : hasBeenImported ? (
          <CheckCircle className="h-4 w-4" />
        ) : !isConnected ? (
          <Clock className="h-4 w-4" />
        ) : (
          <Import className="h-4 w-4" />
        )}
        
        {isImporting 
          ? 'Importando...' 
          : hasBeenImported 
            ? 'Reimportar' 
            : !isConnected
              ? 'Iniciar Importação'
              : 'Importar Histórico'
        }
      </Button>

      {/* Modal só abre quando conectada */}
      <TwoStepImportModal
        instanceId={instanceId}
        instanceName={instanceName}
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </>
  );
};
