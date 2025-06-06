
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { QrCode, RefreshCw, Smartphone, Clock, CheckCircle } from "lucide-react";
import { ImprovedQRCodeModal } from "./ImprovedQRCodeModal";

interface QrCodeDisplayProps {
  qrCode: string | null;
  instanceName: string;
  webStatus?: string;
  onRefresh?: () => Promise<void>;
  isRefreshing?: boolean;
}

// CORREÇÃO FASE 3.1: Função para validar se QR Code é real
const isRealQRCode = (qrCode: string | null): boolean => {
  if (!qrCode || !qrCode.startsWith('data:image/')) {
    return false;
  }
  
  const base64Part = qrCode.split(',')[1];
  if (!base64Part || base64Part.length < 500) {
    return false;
  }
  
  // Check for known fake/placeholder patterns
  const knownFakePatterns = [
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
  ];
  
  return !knownFakePatterns.some(pattern => base64Part.includes(pattern));
};

export function QrCodeDisplay({ 
  qrCode, 
  instanceName, 
  webStatus, 
  onRefresh, 
  isRefreshing = false 
}: QrCodeDisplayProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [autoRefreshCount, setAutoRefreshCount] = useState(0);

  const isQRReal = isRealQRCode(qrCode);

  // CORREÇÃO FASE 3.1: Countdown timer para QR Code
  useEffect(() => {
    if (!isQRReal || webStatus !== 'waiting_scan') return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          // QR Code expirou - tentar refresh automático
          if (onRefresh && autoRefreshCount < 3) {
            console.log('[QR Display] 🔄 Auto-refresh QR Code expirado');
            onRefresh();
            setAutoRefreshCount(prev => prev + 1);
            return 300; // Reset timer
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isQRReal, webStatus, onRefresh, autoRefreshCount]);

  // Reset auto refresh count when QR changes
  useEffect(() => {
    setAutoRefreshCount(0);
    setTimeLeft(300);
  }, [qrCode]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = () => {
    switch (webStatus) {
      case 'waiting_scan':
        return <Badge variant="secondary">Aguardando Scan</Badge>;
      case 'connected':
        return <Badge variant="default">Conectado</Badge>;
      case 'disconnected':
        return <Badge variant="destructive">Desconectado</Badge>;
      default:
        return <Badge variant="outline">Iniciando</Badge>;
    }
  };

  const handleRefresh = async () => {
    if (onRefresh) {
      await onRefresh();
      setTimeLeft(300); // Reset timer
    }
  };

  // CORREÇÃO FASE 3.1: Exibir QR Code apenas se for real
  if (!isQRReal) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5" />
              QR Code WhatsApp
            </div>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="space-y-4">
            <div className="text-muted-foreground">
              {webStatus === 'connected' ? (
                <div className="flex items-center justify-center gap-2 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span>WhatsApp Conectado!</span>
                </div>
              ) : (
                <div>
                  <QrCode className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                  <p>QR Code não disponível</p>
                  <p className="text-sm">Clique em atualizar para gerar</p>
                </div>
              )}
            </div>
            
            {webStatus !== 'connected' && (
              <Button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Gerar QR Code
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-green-600" />
              QR Code WhatsApp
            </div>
            {getStatusBadge()}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Code Preview */}
          <div className="flex justify-center">
            <div 
              className="bg-white p-4 rounded-lg border-2 border-green-200 cursor-pointer hover:border-green-300 transition-colors"
              onClick={() => setIsModalOpen(true)}
            >
              <img 
                src={qrCode} 
                alt="QR Code para conexão do WhatsApp" 
                className="w-48 h-48 object-contain"
              />
            </div>
          </div>

          {/* Timer e instruções */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <Clock className="h-4 w-4" />
              <span className="font-medium">
                Expira em: {formatTime(timeLeft)}
              </span>
            </div>
            
            <div className="flex items-center justify-center gap-4">
              <Button 
                onClick={() => setIsModalOpen(true)}
                variant="outline"
                size="sm"
              >
                <Smartphone className="h-4 w-4 mr-1" />
                Ver Instruções
              </Button>
              
              <Button 
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
              >
                {isRefreshing ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    Atualizando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Atualizar
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Clique no QR Code para ver instruções detalhadas
            </p>
          </div>
        </CardContent>
      </Card>

      <ImprovedQRCodeModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        qrCodeUrl={qrCode}
        instanceName={instanceName}
      />
    </>
  );
}
