import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { 
  Loader2, 
  Smartphone, 
  QrCode, 
  CheckCircle, 
  Download,
  AlertCircle,
  X,
  Wifi,
  Database
} from "lucide-react";
import { usePuppeteerImport, PuppeteerStatus } from '@/hooks/chat/usePuppeteerQRPolling';

interface PuppeteerImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceId: string;
  instanceName: string;
}

export const PuppeteerImportModal: React.FC<PuppeteerImportModalProps> = ({
  isOpen,
  onClose,
  instanceId,
  instanceName
}) => {
  const { session, isLoading, createSession, closeSession } = usePuppeteerImport();

  const handleStart = () => {
    createSession(instanceId, instanceName);
  };

  const handleClose = () => {
    closeSession();
    onClose();
  };

  const getStatusConfig = (status: PuppeteerStatus) => {
    switch (status) {
      case 'preparing':
        return {
          icon: <Loader2 className="h-6 w-6 animate-spin text-blue-500" />,
          title: 'Preparando importação...',
          description: 'Configurando sistema para importação do histórico...',
          color: 'blue'
        };
      
      case 'creating':
        return {
          icon: <Loader2 className="h-6 w-6 animate-spin text-purple-500" />,
          title: 'Verificando todo histórico.',
          description: 'Estabelecendo conexão com servidor Puppeteer...',
          color: 'purple'
        };
      
      case 'generating_qr':
        return {
          icon: <QrCode className="h-6 w-6 animate-pulse text-orange-500" />,
          title: 'Gerando QR Code...',
          description: 'Preparando código QR para conexão com WhatsApp...',
          color: 'orange'
        };
      
      case 'qr_ready':
        return {
          icon: <Smartphone className="h-6 w-6 text-green-500" />,
          title: 'QR Code Pronto!',
          description: 'Conecte para importar, depois pode excluir esta conexão do seu celular',
          color: 'green'
        };
      
      case 'connected':
        return {
          icon: <Wifi className="h-6 w-6 text-green-500" />,
          title: 'WhatsApp Conectado!',
          description: 'Iniciando importação do histórico...',
          color: 'green'
        };
      
      case 'importing':
        return {
          icon: <Database className="h-6 w-6 animate-pulse text-blue-500" />,
          title: 'Importando Histórico',
          description: 'Você pode fechar este modal...',
          color: 'blue'
        };
      
      case 'completed':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-500" />,
          title: 'Importação Concluída!',
          description: 'Histórico do WhatsApp importado com sucesso.',
          color: 'green'
        };
      
      case 'error':
        return {
          icon: <AlertCircle className="h-6 w-6 text-red-500" />,
          title: 'Erro na Importação',
          description: session?.error || 'Ocorreu um erro durante o processo',
          color: 'red'
        };
      
      default:
        return {
          icon: <Loader2 className="h-6 w-6 animate-spin text-gray-500" />,
          title: 'Aguardando...',
          description: 'Processando...',
          color: 'gray'
        };
    }
  };

  const statusConfig = session ? getStatusConfig(session.status) : null;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-purple-600" />
            Importar Histórico via Puppeteer
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {!session ? (
            // Estado inicial - não iniciado
            <div className="text-center space-y-4">
              <div className="bg-purple-50 p-4 rounded-lg">
                <Smartphone className="h-12 w-12 mx-auto text-purple-600 mb-3" />
                <h3 className="font-semibold text-purple-900">Importação via Puppeteer</h3>
                <p className="text-sm text-purple-700 mt-2">
                  Este método consegue importar TODO o histórico do WhatsApp Web, 
                  incluindo mensagens anteriores à conexão atual.
                </p>
              </div>
              
              <div className="bg-amber-50 p-3 rounded border border-amber-200">
                <p className="text-sm text-amber-800">
                  <strong>⚠️ Importante:</strong> Será criada uma nova conexão temporária. 
                  Após a importação, você pode excluir essa conexão do seu celular.
                </p>
              </div>

              <Button
                onClick={handleStart}
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Download className="h-4 w-4 mr-2" />
                    Iniciar Importação
                  </>
                )}
              </Button>
            </div>
          ) : (
            // Estados do processo
            <div className="space-y-4">
              {/* Status atual */}
              <div className="text-center space-y-3">
                <div className="flex justify-center">
                  {statusConfig?.icon}
                </div>
                
                <div>
                  <h3 className={`font-semibold text-${statusConfig?.color}-900`}>
                    {statusConfig?.title}
                  </h3>
                  <p className={`text-sm text-${statusConfig?.color}-700 mt-1`}>
                    {session.message || statusConfig?.description}
                  </p>
                </div>
              </div>

              {/* QR Code */}
              {session.status === 'qr_ready' && session.qrCode && (
                <div className="text-center space-y-3">
                  <div className="bg-white p-4 rounded-lg border-2 border-green-200 inline-block">
                    <img 
                      src={session.qrCode} 
                      alt="QR Code WhatsApp" 
                      className="w-48 h-48 mx-auto"
                    />
                  </div>
                  <div className="bg-green-50 p-3 rounded border border-green-200">
                    <p className="text-sm text-green-800">
                      <strong>📱 Escaneie com seu celular:</strong><br />
                      WhatsApp → Menu (⋮) → Dispositivos conectados → Conectar dispositivo
                    </p>
                  </div>
                </div>
              )}

              {/* Barra de progresso para importação */}
              {session.status === 'importing' && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progresso da importação</span>
                    <span>{session.progress || 0}%</span>
                  </div>
                  <Progress value={session.progress || 0} className="w-full" />
                  
                  {(session.contactsImported || session.messagesImported) && (
                    <div className="text-xs text-blue-600 space-y-1">
                      <p>📋 {session.contactsImported || 0} contatos importados</p>
                      <p>💬 {session.messagesImported || 0} mensagens importadas</p>
                    </div>
                  )}
                </div>
              )}

              {/* Resultado final */}
              {session.status === 'completed' && (
                <div className="bg-green-50 p-4 rounded border border-green-200">
                  <div className="text-center space-y-2">
                    <CheckCircle className="h-8 w-8 text-green-600 mx-auto" />
                    <h4 className="font-semibold text-green-900">Importação Concluída!</h4>
                    <div className="text-sm text-green-700 space-y-1">
                      <p>📋 {session.contactsImported || 0} contatos importados</p>
                      <p>💬 {session.messagesImported || 0} mensagens importadas</p>
                      <p className="mt-2 font-medium">
                        ✅ Agora você pode excluir a conexão do seu celular!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Erro */}
              {session.status === 'error' && (
                <div className="bg-red-50 p-4 rounded border border-red-200">
                  <div className="text-center space-y-2">
                    <AlertCircle className="h-8 w-8 text-red-600 mx-auto" />
                    <h4 className="font-semibold text-red-900">Erro na Importação</h4>
                    <p className="text-sm text-red-700">{session.error}</p>
                  </div>
                </div>
              )}

              {/* Botões de ação */}
              <div className="flex gap-2 pt-4">
                {session.status === 'completed' || session.status === 'error' ? (
                  <Button onClick={handleClose} className="w-full">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Concluir
                  </Button>
                ) : session.status === 'importing' ? (
                  <Button variant="outline" onClick={handleClose} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Fechar (importação continua)
                  </Button>
                ) : (
                  <Button variant="outline" onClick={handleClose} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}; 