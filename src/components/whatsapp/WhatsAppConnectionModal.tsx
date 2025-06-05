
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { QrCode, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { WhatsAppWebService } from '@/services/whatsapp/whatsappWebService';
import { toast } from 'sonner';

interface WhatsAppConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const WhatsAppConnectionModal = ({ isOpen, onClose, onSuccess }: WhatsAppConnectionModalProps) => {
  const [instanceName, setInstanceName] = useState('');
  const [step, setStep] = useState<'name' | 'creating' | 'qr' | 'connected'>('name');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Reset modal state when opened
  useEffect(() => {
    if (isOpen) {
      setInstanceName('');
      setStep('name');
      setQrCode(null);
      setInstanceId(null);
      setError(null);
    }
  }, [isOpen]);

  // Poll for QR code updates
  useEffect(() => {
    if (step === 'qr' && instanceId) {
      const interval = setInterval(async () => {
        try {
          const result = await WhatsAppWebService.getQRCode(instanceId);
          
          if (result.success && result.qrCode) {
            setQrCode(result.qrCode);
          } else if (result.waiting) {
            console.log('QR Code still being generated...');
          }
        } catch (error) {
          console.error('Error polling QR code:', error);
        }
      }, 3000);

      return () => clearInterval(interval);
    }
  }, [step, instanceId]);

  const handleCreateInstance = async () => {
    if (!instanceName.trim()) {
      toast.error('Digite um nome para a instância');
      return;
    }

    setStep('creating');
    setError(null);

    try {
      const result = await WhatsAppWebService.createInstance(instanceName.trim());
      
      if (result.success && result.instance) {
        setInstanceId(result.instance.id);
        
        if (result.instance.qr_code) {
          setQrCode(result.instance.qr_code);
          setStep('qr');
        } else {
          // Wait for QR code
          setStep('qr');
          toast.info('Aguardando QR Code...');
        }
      } else {
        throw new Error(result.error || 'Falha ao criar instância');
      }
    } catch (error: any) {
      console.error('Error creating instance:', error);
      setError(error.message);
      setStep('name');
      toast.error(`Erro ao criar instância: ${error.message}`);
    }
  };

  const handleClose = () => {
    setStep('name');
    setQrCode(null);
    setInstanceId(null);
    setError(null);
    onClose();
  };

  const renderStep = () => {
    switch (step) {
      case 'name':
        return (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Instância</label>
              <Input
                value={instanceName}
                onChange={(e) => setInstanceName(e.target.value)}
                placeholder="Ex: MinhaEmpresa_WhatsApp"
                className="mt-1"
              />
              <p className="text-xs text-gray-500 mt-1">
                Digite um nome único para identificar esta conexão
              </p>
            </div>
            
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button onClick={handleClose} variant="outline" className="flex-1">
                Cancelar
              </Button>
              <Button onClick={handleCreateInstance} className="flex-1">
                Criar Instância
              </Button>
            </div>
          </div>
        );

      case 'creating':
        return (
          <div className="text-center space-y-4">
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-blue-500" />
            <div>
              <h3 className="font-medium">Criando instância...</h3>
              <p className="text-sm text-gray-500">Isso pode levar alguns segundos</p>
            </div>
          </div>
        );

      case 'qr':
        return (
          <div className="text-center space-y-4">
            <div className="flex items-center justify-center gap-2">
              <QrCode className="h-5 w-5 text-blue-500" />
              <h3 className="font-medium">Escaneie o QR Code</h3>
            </div>
            
            {qrCode ? (
              <div className="bg-white p-4 rounded-lg border">
                <img 
                  src={`data:image/png;base64,${qrCode}`} 
                  alt="QR Code WhatsApp" 
                  className="mx-auto max-w-full h-auto"
                  style={{ maxWidth: '300px' }}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-500">Gerando QR Code...</p>
              </div>
            )}
            
            <p className="text-sm text-gray-600">
              Abra o WhatsApp no seu celular, vá em "Dispositivos conectados" e escaneie este código
            </p>
            
            <Button onClick={handleClose} variant="outline">
              Cancelar
            </Button>
          </div>
        );

      case 'connected':
        return (
          <div className="text-center space-y-4">
            <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
            <div>
              <h3 className="font-medium text-green-700">WhatsApp Conectado!</h3>
              <p className="text-sm text-gray-600">Sua instância está pronta para uso</p>
            </div>
            <Button onClick={() => { handleClose(); onSuccess(); }} className="w-full">
              Concluir
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            Conectar WhatsApp
          </DialogTitle>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
};
