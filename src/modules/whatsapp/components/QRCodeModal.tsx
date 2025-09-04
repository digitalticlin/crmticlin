import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, AlertTriangle, Clock, X } from "lucide-react";
import { useQRModal } from '../hooks/useQRModal';

// Componente QRCodeDisplay inline 
const QRCodeDisplay = ({ qrCode }: { qrCode: string }) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      {/* QR Code Container */}
      <div className="w-64 h-64 sm:w-72 sm:h-72 bg-white rounded-3xl shadow-2xl p-4 sm:p-6 flex items-center justify-center border border-gray-100">
        <img 
          src={qrCode} 
          alt="QR Code WhatsApp" 
          className="max-w-full max-h-full object-contain rounded-xl"
        />
      </div>
      
      {/* Instruções */}
      <div className="text-center space-y-3 max-w-md">
        <h3 className="text-lg font-semibold text-gray-900">
          📱 Escaneie este código
        </h3>
        <div className="space-y-2 text-sm text-gray-600">
          <p>1. Abra o WhatsApp no seu celular</p>
          <p>2. Toque em <strong>Menu</strong> ⋮ ou <strong>Configurações</strong></p>
          <p>3. Toque em <strong>Aparelhos conectados</strong></p>
          <p>4. Toque em <strong>Conectar um aparelho</strong></p>
          <p>5. Aponte a câmera para este código</p>
        </div>
        <div className="bg-green-50 p-3 rounded-xl">
          <p className="text-xs text-green-700">
            ✅ <strong>Conexão segura:</strong> Este código expira em poucos minutos por segurança
          </p>
        </div>
      </div>
    </div>
  );
};

interface QRCodeModalProps {
  instanceId: string;
  instanceName?: string;
  onClose?: () => void;
}

/**
 * Modal QR Code usando hook direto - substitui o modal baseado em Provider
 * Mantém a mesma interface visual mas com performance otimizada
 */
export const QRCodeModal = ({ instanceId, instanceName, onClose }: QRCodeModalProps) => {
  const { 
    isOpen, 
    qrCode, 
    isLoading, 
    error,
    closeModal, 
    refreshQRCode,
    openModal
  } = useQRModal({ 
    instanceId, 
    instanceName,
    onConnectionDetected: () => {
      console.log('[QRCodeModal] 🎉 Conexão detectada, modal será fechado automaticamente');
      if (onClose) onClose();
    }
  });

  // Função personalizada para fechar com callback
  const handleClose = () => {
    console.log('[QRCodeModal] 🚪 Fechando modal e notificando pai');
    closeModal();
    if (onClose) onClose();
  };

  // Auto-open modal quando instanceId é fornecido
  React.useEffect(() => {
    if (instanceId && !isOpen) {
      console.log('[QRCodeModal] 🚀 Auto-opening modal for instanceId:', instanceId);
      openModal(instanceId, instanceName || 'WhatsApp');
    }
  }, [instanceId, instanceName, isOpen, openModal]);

  const [refreshing, setRefreshing] = React.useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshQRCode();
    setRefreshing(false);
  };

  if (!isOpen) return null;

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={() => {}} // Desabilita fechamento por clique externo
    >
      <DialogContent className="max-w-lg w-[95vw] max-h-[90vh] overflow-y-auto bg-white/95 backdrop-blur-xl border border-white/20 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold text-gray-900">
            🔗 Conectar WhatsApp
          </DialogTitle>
          {instanceName && (
            <p className="text-center text-sm text-gray-600 mt-1">
              Instância: {instanceName}
            </p>
          )}
        </DialogHeader>

        <div className="flex flex-col items-center space-y-4 py-6">
          {/* Estado: Loading (Aguardando QR Code) */}
          {isLoading && !qrCode && !error && (
            <div className="flex flex-col items-center space-y-6">
              <div className="w-64 h-64 sm:w-72 sm:h-72 bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-3xl border border-blue-200/30 flex flex-col items-center justify-center p-6 sm:p-8">
                <div className="relative">
                  <div className="w-20 h-20 bg-white/90 rounded-lg border-2 border-blue-300/50 flex items-center justify-center">
                    <Clock className="h-12 w-12 text-blue-600 animate-pulse" />
                  </div>
                  <div className="absolute inset-0 rounded-lg">
                    <div className="absolute inset-0 rounded-lg border-2 border-blue-400/30 animate-ping"></div>
                    <div className="absolute inset-2 rounded-lg border-2 border-blue-300/20 animate-ping" style={{animationDelay: '1s'}}></div>
                  </div>
                </div>
                
                <div className="text-center space-y-3">
                  <p className="text-lg font-semibold text-blue-900">
                    📡 Aguardando QR Code
                  </p>
                  <p className="text-sm text-blue-700">
                    A VPS enviará o código automaticamente
                  </p>
                  <p className="text-xs text-blue-600 bg-blue-100/50 px-3 py-1 rounded-full">
                    Isso pode levar até 30 segundos...
                  </p>
                </div>
              </div>
              
              <div className="bg-blue-50/50 backdrop-blur-sm rounded-xl p-4 border border-blue-200/30 max-w-md">
                <p className="text-xs text-blue-700 text-center">
                  ⏱️ <strong>Processo automático:</strong> A instância foi criada na VPS e o QR Code será enviado via webhook. Mantenha esta janela aberta!
                </p>
              </div>
            </div>
          )}

          {/* Estado: Erro */}
          {error && !qrCode && (
            <div className="flex flex-col items-center space-y-6">
              <div className="w-64 h-64 sm:w-72 sm:h-72 bg-gradient-to-br from-red-50/80 to-orange-50/80 backdrop-blur-sm rounded-3xl border border-red-200/30 flex flex-col items-center justify-center p-6 sm:p-8">
                <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                <div className="text-center space-y-3">
                  <p className="text-lg font-semibold text-red-900">
                    Ops! Algo deu errado
                  </p>
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                  <p className="text-xs text-red-600 bg-red-100/50 px-3 py-1 rounded-full">
                    Verificar se a instância foi criada corretamente
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={handleRefresh}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg px-6 py-3 rounded-xl font-semibold"
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Verificando...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Verificar Status
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Estado: QR Code disponível */}
          {qrCode && <QRCodeDisplay qrCode={qrCode} />}
        </div>
        
        <DialogFooter className="flex items-center justify-between pt-4 border-t border-white/20">
          <div className="text-xs text-gray-500">
            {instanceName ? `Conectando: ${instanceName}` : 'Conectando WhatsApp'}
          </div>
          
          <div className="flex items-center gap-2">
            {(qrCode || error) && (
              <Button 
                onClick={handleRefresh}
                variant="outline" 
                size="sm"
                className="bg-white/50 border-gray-200 text-gray-700 hover:bg-gray-50 hover:text-gray-900 text-xs px-3 py-1 h-7"
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Solicitando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Solicitar QR Code
                  </>
                )}
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => {
                console.log('[QRCodeModal] 🚪 Clique no botão Fechar - fechando modal');
                handleClose();
              }}
              className="text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg px-4"
            >
              Fechar
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};