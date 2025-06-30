import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface UseSmartQRGenerationProps {
  onSuccess?: () => void;
  onModalOpen?: (instanceId: string, instanceName: string) => void;
}

export const useSmartQRGeneration = ({ onSuccess, onModalOpen }: UseSmartQRGenerationProps = {}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [status, setStatus] = useState<string>('');

  const generateSmartQR = async (instanceId: string, instanceName: string) => {
    setIsGenerating(true);
    setStatus('Verificando instância...');
    
    try {
      console.log('[SmartQRGeneration] 🔄 Iniciando geração inteligente de QR para:', instanceName);
      
      // ETAPA 1: Tentar gerar QR para instância existente
      console.log('[SmartQRGeneration] 📡 Tentando whatsapp_qr_manager...');
      setStatus('Gerando QR Code...');
      
      const { data: qrData, error: qrError } = await supabase.functions.invoke('whatsapp_qr_manager', {
        body: { 
          instanceId,
          instanceName,
          action: 'generate_qr'
        }
      });

      console.log('[SmartQRGeneration] 📊 Resultado whatsapp_qr_manager:', { qrData, qrError });

      // Se conseguiu gerar QR para instância existente
      if (!qrError && qrData?.success && qrData?.qrCode) {
        console.log('[SmartQRGeneration] ✅ QR gerado para instância existente');
        
        // Atualizar QR no Supabase
        await updateQRInDatabase(instanceId, qrData.qrCode);
        
        // AGUARDAR um momento para o banco atualizar
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Abrir modal APENAS após atualizar QR
        if (onModalOpen) {
          console.log('[SmartQRGeneration] 🎯 Abrindo modal com QR FRESCO');
          onModalOpen(instanceId, instanceName);
        }
        
        if (onSuccess) onSuccess();
        toast.success('QR Code atualizado com sucesso!');
        return;
      }

      // ETAPA 2: Fallback - Criar nova instância
      console.log('[SmartQRGeneration] ⚠️ Instância não existe, criando nova...');
      setStatus('Criando nova instância...');
      
      const { data: createData, error: createError } = await supabase.functions.invoke('whatsapp_instance_manager', {
        body: { 
          action: 'create_instance',
          instanceData: {
            instanceName,
            instanceId
          }
        }
      });

      console.log('[SmartQRGeneration] 📊 Resultado whatsapp_instance_manager:', { createData, createError });

      if (createError || !createData?.success) {
        throw new Error(createData?.error || createError?.message || 'Falha ao criar instância');
      }

      console.log('[SmartQRGeneration] ✅ Nova instância criada com sucesso');
      
      // Atualizar QR no Supabase se disponível
      if (createData.qrCode) {
        await updateQRInDatabase(instanceId, createData.qrCode);
        
        // AGUARDAR um momento para o banco atualizar
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      
      // Abrir modal APENAS após criar instância e atualizar QR
      if (onModalOpen) {
        console.log('[SmartQRGeneration] 🎯 Abrindo modal com NOVA instância');
        onModalOpen(instanceId, instanceName);
      }
      
      if (onSuccess) onSuccess();
      toast.success('Nova instância criada! Escaneie o QR Code.');

    } catch (error: any) {
      console.error('[SmartQRGeneration] ❌ Erro na geração inteligente:', error);
      toast.error(`Erro ao gerar QR Code: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setStatus('');
    }
  };

  const updateQRInDatabase = async (instanceId: string, qrCode: string) => {
    try {
      console.log('[SmartQRGeneration] 💾 Atualizando QR no Supabase...');
      
      const { error } = await supabase
        .from('whatsapp_instances')
        .update({ 
          qr_code: qrCode,
          connection_status: 'qr_generated',
          updated_at: new Date().toISOString()
        })
        .eq('id', instanceId);

      if (error) {
        console.error('[SmartQRGeneration] ⚠️ Erro ao atualizar QR no banco:', error);
      } else {
        console.log('[SmartQRGeneration] ✅ QR atualizado no Supabase');
      }
    } catch (error) {
      console.error('[SmartQRGeneration] ❌ Erro inesperado ao atualizar QR:', error);
    }
  };

  return {
    generateSmartQR,
    isGenerating,
    status
  };
}; 