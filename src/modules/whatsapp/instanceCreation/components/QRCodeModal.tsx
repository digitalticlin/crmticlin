
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Loader2, RefreshCw, QrCode, Smartphone, CheckCircle, AlertTriangle, Clock } from "lucide-react";
import { useQRCodeModal } from '../hooks/useQRCodeModal';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

// Estilos CSS customizados para as animações
const customStyles = `
  @keyframes scan {
    0% { transform: translateY(-100%); }
    100% { transform: translateY(500%); }
  }
  
  @keyframes orbit {
    0% { transform: rotate(0deg) translateX(40px) rotate(0deg); }
    100% { transform: rotate(360deg) translateX(40px) rotate(-360deg); }
  }
  
  @keyframes shine {
    0% { transform: translateX(-100%) skewX(-25deg); }
    100% { transform: translateX(200%) skewX(-25deg); }
  }
  
  @keyframes glow {
    0%, 100% { opacity: 0.3; transform: scale(0.8); }
    50% { opacity: 1; transform: scale(1.2); }
  }
  
  .qr-animation-container {
    position: relative;
  }
`;

// Injetar estilos no documento
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.type = 'text/css';
  styleSheet.innerText = customStyles;
  document.head.appendChild(styleSheet);
}

// CORREÇÃO: Componente para renderizar QR Code simplificado
const QRCodeDisplay = ({ qrCode }: { qrCode: string | null }) => {
  const [hasError, setHasError] = useState(false);
  
  // CORREÇÃO: Função de sanitização simplificada
  const sanitizeQRCode = (qrCode: string): string => {
    console.log('[QRCodeDisplay] 🔍 Sanitizando QR Code (primeiros 100 chars):', qrCode.substring(0, 100));
    
    try {
      // Se já é um data URL válido, retornar diretamente
      if (qrCode.startsWith('data:image/') && qrCode.includes('base64,')) {
        console.log('[QRCodeDisplay] ✅ QR Code já está no formato correto');
        return qrCode;
      }
      
      // Se contém base64, extrair e formatar
      if (qrCode.includes('base64,')) {
        const base64Part = qrCode.split('base64,')[1];
        if (base64Part) {
          const formatted = `data:image/png;base64,${base64Part}`;
          console.log('[QRCodeDisplay] ✅ QR Code formatado com sucesso');
          return formatted;
        }
      }
      
      // Se é base64 puro, adicionar prefixo
      if (qrCode.match(/^[A-Za-z0-9+/=]+$/)) {
        const formatted = `data:image/png;base64,${qrCode}`;
        console.log('[QRCodeDisplay] ✅ Adicionado prefixo ao base64 puro');
        return formatted;
      }
      
      console.log('[QRCodeDisplay] ⚠️ Formato não reconhecido, retornando original');
      return qrCode;
    } catch (error) {
      console.error('[QRCodeDisplay] ❌ Erro ao sanitizar QR code:', error);
      return qrCode;
    }
  };

  // Resetar erro quando QR code muda
  useEffect(() => {
    setHasError(false);
  }, [qrCode]);

  if (!qrCode) return null;

  const sanitizedQR = sanitizeQRCode(qrCode);

  return (
    <div className="flex flex-col items-center space-y-6">
      {hasError ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="w-64 h-64 bg-gradient-to-br from-red-50 to-red-100 rounded-2xl border border-red-200 flex flex-col items-center justify-center p-6">
            <AlertTriangle className="h-12 w-12 text-red-500 mb-4" />
            <p className="text-red-700 text-center text-sm">
              Erro ao exibir QR Code
            </p>
            <p className="text-red-600 text-center text-xs mt-2">
              Tente gerar um novo código
            </p>
          </div>
        </div>
      ) : (
        <>
          {/* QR Code Container com glassmorphism */}
          <div className="relative">
            <div className="w-72 h-72 bg-white/90 backdrop-blur-sm rounded-3xl border border-white/20 shadow-2xl p-6 flex items-center justify-center">
              <img
                src={sanitizedQR}
                alt="QR Code para conectar WhatsApp"
                className="w-full h-full object-contain rounded-xl"
                onLoad={() => {
                  console.log('[QRCodeDisplay] ✅ QR Code carregado com sucesso');
                  setHasError(false);
                }}
                onError={() => {
                  console.error('[QRCodeDisplay] ❌ Erro ao carregar QR Code');
                  setHasError(true);
                }}
              />
            </div>
            
            {/* Decorative elements */}
            <div className="absolute -top-2 -right-2 w-4 h-4 bg-green-500 rounded-full animate-pulse" />
            <div className="absolute -bottom-2 -left-2 w-3 h-3 bg-blue-500 rounded-full animate-pulse delay-300" />
          </div>

          {/* Instruções de uso */}
          <div className="bg-gradient-to-r from-blue-50/80 to-green-50/80 backdrop-blur-sm rounded-2xl border border-white/30 p-6 max-w-sm">
            <div className="flex items-start gap-3">
              <Smartphone className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-semibold text-gray-900 mb-3">Como conectar:</p>
                <ol className="text-gray-700 space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-500 text-white rounded-full text-xs flex items-center justify-center font-bold">1</span>
                    Abra o WhatsApp no celular
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-500 text-white rounded-full text-xs flex items-center justify-center font-bold">2</span>
                    Toque nos 3 pontos (menu)
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-500 text-white rounded-full text-xs flex items-center justify-center font-bold">3</span>
                    Aparelhos conectados
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-500 text-white rounded-full text-xs flex items-center justify-center font-bold">4</span>
                    Conectar um aparelho
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-5 h-5 bg-green-500 text-white rounded-full text-xs flex items-center justify-center font-bold">5</span>
                    Escaneie este código
                  </li>
                </ol>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export const QRCodeModal = () => {
  const { 
    isOpen, 
    qrCode, 
    instanceId, 
    instanceName, 
    isLoading, 
    error, 
    closeModal, 
    refreshQRCode,
    generateQRCode 
  } = useQRCodeModal();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  
  // CORREÇÃO: Contador de tempo simplificado
  useEffect(() => {
    let timer: number | null = null;
    
    if (isLoading && isOpen) {
      setLoadingTime(0);
      timer = window.setInterval(() => {
        setLoadingTime(prev => prev + 1);
      }, 1000);
    }
    
    return () => {
      if (timer !== null) {
        clearInterval(timer);
      }
    };
  }, [isLoading, isOpen]);
  
  const handleRefresh = () => {
    setRefreshing(true);
    console.log('[QRCodeModal] 🔄 Gerando novo QR code');
    refreshQRCode();
    
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  // CORREÇÃO: Log do estado do QR Code
  useEffect(() => {
    if (qrCode) {
      console.log('[QRCodeModal] 📱 QR Code recebido:', {
        length: qrCode.length,
        startsWithData: qrCode.startsWith('data:'),
        containsBase64: qrCode.includes('base64'),
        preview: qrCode.substring(0, 100)
      });
    }
  }, [qrCode]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) closeModal();
    }}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-white/95 to-blue-50/95 backdrop-blur-xl border border-white/20 shadow-2xl">
        <DialogHeader className="text-center">
          <DialogTitle className="flex items-center justify-center gap-3 text-xl font-semibold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            <QrCode className="h-6 w-6 text-green-600" />
            Conectar WhatsApp
          </DialogTitle>
          {instanceName && (
            <p className="text-sm text-gray-600 mt-1 font-medium">
              {instanceName}
            </p>
          )}
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-6">
          {/* Estado: Carregando com animação melhorada */}
          {isLoading && (
            <div className="flex flex-col items-center space-y-6">
              <div className="w-72 h-72 bg-gradient-to-br from-blue-50/80 to-purple-50/80 backdrop-blur-sm rounded-3xl border border-white/30 flex flex-col items-center justify-center p-8">
                
                {/* Animação de QR Code sendo gerado */}
                <div className="relative">
                  {/* QR Code base */}
                  <div className="w-20 h-20 bg-white/80 rounded-lg border-2 border-blue-300/50 flex items-center justify-center">
                    <div className="grid grid-cols-4 gap-1">
                      {[...Array(16)].map((_, i) => (
                        <div 
                          key={i}
                          className="w-2 h-2 bg-blue-500 rounded-sm animate-pulse"
                          style={{
                            animationDelay: `${i * 100}ms`,
                            animationDuration: '1.5s'
                          }}
                        />
                      ))}
                    </div>
                  </div>
                  
                  {/* Efeito de scanning */}
                  <div className="absolute inset-0 overflow-hidden rounded-lg">
                    <div className="w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent animate-pulse"></div>
                    <div 
                      className="absolute w-full h-1 bg-gradient-to-r from-transparent via-green-400 to-transparent"
                      style={{
                        animation: 'scan 2s linear infinite',
                      }}
                    ></div>
                  </div>
                  
                  {/* Partículas orbitando */}
                  <div className="absolute inset-0 -m-4">
                    <div className="w-2 h-2 bg-blue-400 rounded-full absolute animate-spin" 
                         style={{ 
                           animation: 'orbit 3s linear infinite',
                           transformOrigin: '60px 60px'
                         }}>
                    </div>
                    <div className="w-1.5 h-1.5 bg-green-400 rounded-full absolute animate-spin" 
                         style={{ 
                           animation: 'orbit 3s linear infinite reverse',
                           animationDelay: '1s',
                           transformOrigin: '60px 60px'
                         }}>
                    </div>
                  </div>
                </div>
                
                <div className="text-center mt-6 space-y-2">
                  <p className="text-lg font-semibold text-blue-900">
                    🔄 Gerando QR Code...
                  </p>
                  <p className="text-sm text-blue-700">
                    {loadingTime < 5 
                      ? 'Conectando com WhatsApp Web...' 
                      : loadingTime < 10 
                        ? 'Configurando autenticação...'
                        : loadingTime < 15
                          ? 'Preparando código QR...'
                          : 'Finalizando configuração...'
                    }
                  </p>
                  {loadingTime > 0 && (
                    <div className="flex items-center justify-center space-x-2 mt-3">
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                      <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <span className="text-xs text-blue-600 ml-2 font-mono">
                      {loadingTime}s
                      </span>
                    </div>
                  )}
                  
                  {/* Barra de progresso visual */}
                  <div className="w-full bg-blue-100 rounded-full h-2 mt-4">
                    <div 
                      className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-1000"
                      style={{ 
                        width: `${Math.min(100, (loadingTime / 20) * 100)}%` 
                      }}
                    ></div>
                  </div>
                </div>
              </div>
              
              {/* Dicas para o usuário */}
              <div className="bg-blue-50/50 backdrop-blur-sm rounded-xl p-4 border border-blue-200/30 max-w-md">
                <p className="text-xs text-blue-700 text-center">
                  💡 <strong>Dica:</strong> Mantenha o WhatsApp aberto no seu celular para uma conexão mais rápida
                </p>
              </div>
            </div>
          )}

          {/* Estado: Erro */}
          {error && !qrCode && (
            <div className="flex flex-col items-center space-y-6">
              <div className="w-72 h-72 bg-gradient-to-br from-red-50/80 to-orange-50/80 backdrop-blur-sm rounded-3xl border border-red-200/30 flex flex-col items-center justify-center p-8">
                <AlertTriangle className="h-16 w-16 text-red-500 mb-4" />
                <div className="text-center space-y-3">
                  <p className="text-lg font-semibold text-red-900">
                    Ops! Algo deu errado
                  </p>
                  <p className="text-sm text-red-700">
                    {error}
                  </p>
                  <p className="text-xs text-red-600 bg-red-100/50 px-3 py-1 rounded-full">
                    Vamos tentar novamente?
                  </p>
                </div>
              </div>
              
              <div className="flex gap-3">
                <Button 
                  onClick={() => generateQRCode()}
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white shadow-lg px-6 py-3 rounded-xl font-semibold"
                  disabled={refreshing}
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Gerando...
                    </>
                  ) : (
                    <>
                      <QrCode className="h-4 w-4 mr-2" />
                      Gerar QR Code
                    </>
                  )}
                </Button>
              
              <Button 
                onClick={handleRefresh}
                  variant="outline"
                  className="border-red-300 text-red-700 hover:bg-red-50 px-6 py-3 rounded-xl font-semibold"
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Tentando...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </>
                )}
              </Button>
              </div>
            </div>
          )}

          {/* Estado: QR Code disponível */}
          {qrCode && <QRCodeDisplay qrCode={qrCode} />}
          
          {/* Estado: Aguardando com animação melhorada */}
          {isOpen && !isLoading && !qrCode && !error && (
            <div className="flex flex-col items-center space-y-6">
              <div className="w-72 h-72 bg-gradient-to-br from-yellow-50/80 to-orange-50/80 backdrop-blur-sm rounded-3xl border border-yellow-200/30 flex flex-col items-center justify-center p-8">
                
                {/* Animação de QR Code quase pronto */}
                <div className="relative">
                  {/* QR Code em preparação */}
                  <div className="w-20 h-20 bg-white/90 rounded-lg border-2 border-yellow-300/50 flex items-center justify-center">
                    <QrCode className="h-12 w-12 text-yellow-600 animate-pulse" />
                  </div>
                  
                  {/* Efeito de brilho */}
                  <div className="absolute inset-0 rounded-lg overflow-hidden">
                    <div 
                      className="absolute w-full h-full bg-gradient-to-r from-transparent via-yellow-300/30 to-transparent"
                      style={{
                        animation: 'shine 2s ease-in-out infinite',
                        transform: 'skewX(-25deg)',
                      }}
                    ></div>
                  </div>
                  
                  {/* Indicadores de progresso */}
                  <div className="absolute -inset-6">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-2 h-2 bg-yellow-400 rounded-full opacity-60"
                        style={{
                          animation: `glow 1.5s ease-in-out infinite`,
                          animationDelay: `${i * 0.2}s`,
                          transform: `rotate(${i * 45}deg) translateY(-30px)`,
                          transformOrigin: '0 30px'
                        }}
                      />
                    ))}
                  </div>
                </div>
                
                <div className="text-center space-y-3">
                  <p className="text-lg font-semibold text-yellow-900">
                    ⚡ Quase pronto!
                  </p>
                  <p className="text-sm text-yellow-700">
                    A instância foi criada na VPS
                  </p>
                  <p className="text-xs text-yellow-600 bg-yellow-100/50 px-3 py-1 rounded-full">
                    Aguardando geração do QR Code...
                  </p>
                </div>
              </div>
              
              <Button 
                onClick={() => generateQRCode()}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white shadow-lg px-6 py-2 rounded-xl transition-all duration-300 transform hover:scale-105"
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Gerando...
                  </>
                ) : (
                  <>
                    <QrCode className="h-4 w-4 mr-2" />
                    Gerar QR Code
                  </>
                )}
              </Button>
              
              {/* Informação adicional */}
              <div className="bg-yellow-50/50 backdrop-blur-sm rounded-xl p-4 border border-yellow-200/30 max-w-md">
                <p className="text-xs text-yellow-700 text-center">
                  🔔 <strong>O que está acontecendo:</strong> Sua instância WhatsApp foi criada com sucesso na VPS e está aguardando a geração do código QR para conexão.
                </p>
              </div>
            </div>
          )}
        </div>
        
        <DialogFooter className="flex items-center justify-between pt-4 border-t border-white/20">
          <div className="text-xs text-gray-500">
            {qrCode ? '✅ Código pronto para escanear' : '⏳ Preparando código...'}
          </div>
          
          <div className="flex gap-3">
            {qrCode && !error && (
              <Button 
                onClick={handleRefresh}
                variant="outline"
                size="sm"
                className="border-green-300 text-green-700 hover:bg-green-50 rounded-lg"
                disabled={refreshing}
              >
                {refreshing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                    Gerando novo...
                  </>
                ) : (
                  <>
                    <RefreshCw className="h-4 w-4 mr-1" />
                    Gerar novo código
                  </>
                )}
              </Button>
            )}
            
            <Button 
              variant="ghost" 
              size="sm"
              onClick={closeModal}
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
