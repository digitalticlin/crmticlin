import React, { useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { 
  Loader2, 
  RefreshCw, 
  QrCode, 
  Smartphone, 
  CheckCircle, 
  AlertTriangle,
  Clock
} from 'lucide-react';
import { useAutoQRPolling } from '@/hooks/whatsapp/useAutoQRPolling';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { DeleteInstanceButton } from '@/modules/whatsapp/instanceDeletion';

interface AutoQRModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string | null;
  instanceName: string | null;
}

export const AutoQRModal = ({ 
  isOpen, 
  onClose, 
  instanceId, 
  instanceName 
}: AutoQRModalProps) => {
  const {
    isPolling,
    currentAttempt,
    maxAttempts,
    qrCode,
    error,
    isWaitingForGeneration,
    status,
    progressPercentage,
    startPolling,
    stopPolling,
    reset
  } = useAutoQRPolling({
    maxAttempts: 15,
    intervalMs: 3000,
    timeoutMs: 45000,
    onSuccess: (qrCode) => {
      console.log('[AutoQRModal] ✅ QR Code recebido:', qrCode.substring(0, 50) + '...');
    },
    onError: (error) => {
      console.error('[AutoQRModal] ❌ Erro:', error);
      toast.error(`Erro ao gerar QR Code: ${error}`);
    },
    onTimeout: () => {
      console.log('[AutoQRModal] ⏰ Timeout');
      toast.error('Timeout: QR Code não foi gerado. Tente novamente.');
    },
    onProgress: (attempt, max) => {
      console.log(`[AutoQRModal] 📊 Progresso: ${attempt}/${max}`);
    },
    onConnected: () => {
      console.log('[AutoQRModal] 🎉 WhatsApp conectado! Fechando modal...');
      toast.success('WhatsApp conectado com sucesso!');
      handleClose(); // NOVO: Fechar modal automaticamente
    }
  });

  // Start polling when modal opens with instanceId
  useEffect(() => {
    if (isOpen && instanceId) {
      console.log('[AutoQRModal] 🚀 Modal aberto, iniciando polling para:', instanceId);
      startPolling(instanceId);
    } else if (!isOpen) {
      console.log('[AutoQRModal] 🚪 Modal fechado, parando polling');
      stopPolling();
    }
  }, [isOpen, instanceId, startPolling, stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  const handleClose = () => {
    stopPolling();
    reset();
    onClose();
  };

  const handleRetry = () => {
    if (instanceId) {
      reset();
      startPolling(instanceId);
    }
  };

  const handleGenerateNewQR = async () => {
    if (!instanceId) return;
    
    console.log('[AutoQRModal] 🔄 Gerando novo QR Code via whatsapp_qr_manager');
    
    try {
      reset();
      
      // Fazer chamada direta à VPS via whatsapp_qr_manager
      const { data, error } = await supabase.functions.invoke('whatsapp_qr_manager', {
        body: {
          instanceId: instanceId
        }
      });

      if (error) {
        console.error('[AutoQRModal] ❌ Erro na Edge Function:', error);
        toast.error(`Erro ao gerar novo QR Code: ${error.message}`);
        return;
      }

      if (data?.success && data.qrCode) {
        console.log('[AutoQRModal] ✅ Novo QR Code gerado com sucesso!');
        toast.success('Novo QR Code gerado!');
        // O polling detectará o novo QR Code automaticamente
      } else if (data?.success && data.connected) {
        console.log('[AutoQRModal] ✅ Instância já está conectada!');
        toast.success('WhatsApp já está conectado!');
        return; // Não reiniciar polling se já está conectado
      } else {
        console.log('[AutoQRModal] ⏳ Reiniciando polling para aguardar novo QR Code');
        toast.info('Gerando novo QR Code...');
      }
      
      // Sempre reiniciar o polling para detectar mudanças
      startPolling(instanceId);
      
    } catch (error: any) {
      console.error('[AutoQRModal] ❌ Erro ao gerar novo QR Code:', error);
      toast.error(`Erro ao gerar novo QR Code: ${error.message}`);
    }
  };

  const renderContent = () => {
    // QR Code disponível
    if (qrCode && status === 'success') {
      return (
        <div className="flex flex-col items-center space-y-6">
          {/* QR Code Container */}
          <div className="relative">
            <div className="w-72 h-72 bg-white/90 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl p-6 flex items-center justify-center">
              <img
                src={qrCode}
                alt="QR Code para conectar WhatsApp"
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            
            {/* Indicador de sucesso */}
            <div className="absolute -top-2 -right-2 w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Instruções */}
          <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-2xl border border-blue-200/50 w-full max-w-md">
            <div className="flex items-start gap-3">
              <Smartphone className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-blue-900 mb-2">Como conectar:</p>
                <ol className="text-blue-700 space-y-1">
                  <li>1. Abra o WhatsApp no seu celular</li>
                  <li>2. Vá em <strong>Configurações</strong> → <strong>Aparelhos conectados</strong></li>
                  <li>3. Toque em <strong>Conectar um aparelho</strong></li>
                  <li>4. Escaneie este QR Code</li>
                </ol>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Polling em andamento
    if (isPolling && status === 'polling') {
      return (
        <div className="flex flex-col items-center space-y-6">
          {/* Loading Container */}
          <div className="w-72 h-72 bg-gradient-to-br from-blue-50 to-green-50 rounded-3xl border border-blue-200/50 shadow-xl flex flex-col items-center justify-center space-y-4">
            <Loader2 className="h-16 w-16 animate-spin text-blue-600" />
            
            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-blue-900">
                Gerando QR Code...
              </h3>
              
              <div className="w-48 space-y-2">
                <Progress value={progressPercentage} className="w-full" />
                <p className="text-sm text-blue-700">
                  Tentativa {currentAttempt} de {maxAttempts}
                </p>
              </div>
              
              <p className="text-xs text-blue-600">
                {isWaitingForGeneration ? 'Aguardando VPS processar...' : 'Conectando com servidor...'}
              </p>
            </div>
          </div>

          {/* Status Info */}
          <div className="bg-blue-50/80 backdrop-blur-sm p-4 rounded-2xl border border-blue-200/50 w-full max-w-md">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-blue-600" />
              <div className="text-sm">
                <p className="font-medium text-blue-900">Status:</p>
                <p className="text-blue-700">
                  Sistema aguardando QR Code ser gerado pela VPS...
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    // Erro
    if (error || status === 'error' || status === 'timeout') {
      return (
        <div className="flex flex-col items-center space-y-6">
          {/* Error Container */}
          <div className="w-72 h-72 bg-red-50 rounded-3xl border border-red-200/50 shadow-xl flex flex-col items-center justify-center space-y-4">
            <AlertTriangle className="h-16 w-16 text-red-600" />
            
            <div className="text-center space-y-3">
              <h3 className="text-lg font-semibold text-red-900">
                {status === 'timeout' ? 'Timeout' : 'Erro'}
              </h3>
              
              <p className="text-sm text-red-700 max-w-48">
                {error || 'Não foi possível gerar o QR Code no tempo esperado'}
              </p>
              
              <Button 
                onClick={handleRetry}
                variant="outline"
                className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Tentar Novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    // Estado inicial
    return (
      <div className="flex flex-col items-center space-y-6">
        <div className="w-72 h-72 bg-gray-50 rounded-3xl border border-gray-200/50 shadow-xl flex flex-col items-center justify-center space-y-4">
          <QrCode className="h-16 w-16 text-gray-400" />
          
          <div className="text-center space-y-3">
            <h3 className="text-lg font-semibold text-gray-700">
              Preparando...
            </h3>
            
            <p className="text-sm text-gray-600">
              Aguarde enquanto preparamos sua conexão
            </p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-xl border border-white/20 shadow-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-3 text-xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            <QrCode className="h-6 w-6 text-green-600" />
            Conectar WhatsApp
          </DialogTitle>
          {instanceName && (
            <DialogDescription className="text-sm text-gray-600 mt-1 font-medium">
              Instância: {instanceName}
            </DialogDescription>
          )}
        </DialogHeader>

        <div className="py-6">
          {renderContent()}
        </div>

        <DialogFooter className="flex justify-center gap-3">
          {(status === 'error' || status === 'timeout') && (
            <Button 
              onClick={handleRetry}
              variant="outline"
              className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Tentar Novamente
            </Button>
          )}
          
          {/* NOVO: Botão gerar novo código quando QR Code está disponível */}
          {qrCode && status === 'success' && (
            <Button 
              onClick={handleGenerateNewQR}
              variant="outline"
              className="bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Gerar Novo Código
            </Button>
          )}
          
          {/* NOVO: Botão DELETE da instância */}
          {instanceId && (
            <DeleteInstanceButton
              instanceId={instanceId}
              instanceName={instanceName || 'esta instância'}
              onSuccess={handleClose}
              variant="outline"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            />
          )}
          
          <Button 
            onClick={handleClose}
            variant="outline"
            className="bg-gray-50 hover:bg-gray-100"
          >
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}; 