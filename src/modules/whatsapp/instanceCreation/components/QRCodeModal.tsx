import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Loader2, AlertCircle, RefreshCw, Info, ExternalLink, Bug, Copy } from 'lucide-react';
import { useQRCodeModal } from '../hooks/useQRCodeModal';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

// Componente para renderizar QR Code com tratamento de erro
const QRCodeDisplay = ({ qrCode }: { qrCode: string | null }) => {
  const [hasError, setHasError] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [imgSize, setImgSize] = useState({ width: 0, height: 0 });
  const [renderMethod, setRenderMethod] = useState<string>('original');
  const [renderAttempts, setRenderAttempts] = useState(0);
  
  // CORREÇÃO: Função sanitizeQRCode melhorada para lidar com mais formatos
  const sanitizeQRCode = (qrCode: string): string => {
    try {
      console.log('[QRCodeDisplay] 🛠️ Sanitizando QR code:', qrCode.substring(0, 30) + '...');
      
      // Caso 1: É um formato válido de imagem data URL
      if (qrCode.startsWith('data:image/') && qrCode.includes('base64,')) {
        console.log('[QRCodeDisplay] ✅ QR code já está em formato data URL válido');
        setRenderMethod('data-url');
        return qrCode;
      }
      
      // Caso 2: Contém base64, mas está com formato incompleto
      if (qrCode.includes('base64,')) {
        const base64Part = qrCode.split('base64,')[1];
        if (base64Part) {
          console.log('[QRCodeDisplay] 🔧 Corrigindo formato para data URL completo');
          setRenderMethod('extracted-base64');
          return `data:image/png;base64,${base64Part}`;
        }
      }
      
      // Caso 3: É um base64 puro sem prefixo
      if (qrCode.match(/^[A-Za-z0-9+/=]+$/)) {
        console.log('[QRCodeDisplay] 🔧 Convertendo base64 puro para data URL');
        setRenderMethod('pure-base64');
        return `data:image/png;base64,${qrCode}`;
      }
      
      // Caso 4: É uma string data:image/ truncada ou mal formatada
      if (qrCode.includes('data:image')) {
        console.log('[QRCodeDisplay] 🚨 Tentando corrigir data URL malformado');
        // Tenta extrair qualquer parte que pareça conteúdo base64 após "base64,"
        const match = qrCode.match(/base64,([A-Za-z0-9+/=]+)/);
        if (match && match[1]) {
          setRenderMethod('regex-extracted');
          return `data:image/png;base64,${match[1]}`;
        }
      }
      
      // Caso de último recurso: retornar o original
      console.log('[QRCodeDisplay] ⚠️ Não foi possível sanitizar, usando original');
      setRenderMethod('original-fallback');
      return qrCode;
    } catch (error) {
      console.error('[QRCodeDisplay] 🔧 Erro ao sanitizar QR code:', error);
      setRenderMethod('error-fallback');
      return qrCode; // Retornar original em caso de erro
    }
  };

  // Resetar o estado de erro quando o QR code muda
  useEffect(() => {
    setHasError(false);
    setRenderAttempts(a => a + 1);
    
    // CORREÇÃO: Logging mais detalhado do QR code recebido
    console.log('[QRCodeDisplay] 🖼️ QR Code recebido:',
      qrCode 
        ? `${qrCode.substring(0, 30)}... (${qrCode.length} caracteres)` 
        : 'nulo'
    );
    
    if (qrCode && typeof qrCode === 'string') {
      try {
        // DEBUG: Imprimir informações detalhadas do QR code
        console.log('[QRCodeDisplay] 🔍 Formato:', 
          qrCode.startsWith('data:image/png') 
            ? 'PNG data URL' 
            : qrCode.startsWith('data:image/') 
              ? qrCode.split(';')[0].replace('data:', '') + ' data URL'
              : qrCode.includes('base64,') 
                ? 'Contém base64, mas formato incompleto'
                : 'Formato desconhecido'
        );
        
        // Tentar corrigir o formato do QR code
        const sanitizedQR = sanitizeQRCode(qrCode);
        console.log('[QRCodeDisplay] 🔧 QR Code sanitizado:', sanitizedQR.substring(0, 40) + '...');
        
        // Forçar atualização da imagem adicionando um timestamp para evitar cache
        const timestamp = new Date().getTime();
        setImgSrc(`${sanitizedQR}?t=${timestamp}`);
        
        // Verificar diretamente na DOM após a renderização
        setTimeout(() => {
          const imgElement = document.querySelector('.qr-code-image') as HTMLImageElement;
          if (imgElement) {
            console.log('[QRCodeDisplay] 📏 Dimensões da imagem:', {
              width: imgElement.naturalWidth,
              height: imgElement.naturalHeight,
              complete: imgElement.complete,
              loaded: imgElement.complete && imgElement.naturalHeight !== 0
            });
            setImgSize({
              width: imgElement.naturalWidth,
              height: imgElement.naturalHeight
            });
          }
        }, 500);
      } catch (error) {
        console.error('[QRCodeDisplay] ❌ Erro ao preparar QR code:', error);
        setHasError(true);
      }
    } else {
      setImgSrc(null);
    }
  }, [qrCode]);

  // NOVO: Tentar abordagens alternativas caso a primeira falhe
  const tryAlternateRendering = () => {
    if (!qrCode) return;

    try {
      setRenderAttempts(a => a + 1);
      console.log('[QRCodeDisplay] 🔄 Tentativa alternativa de renderização:', renderAttempts + 1);
      
      let newSrc = '';
      
      // Tentar diferentes métodos dependendo do número de tentativas
      switch (renderAttempts % 3) {
        case 0:
          // Extrair base64 puro
          if (qrCode.includes('base64,')) {
            newSrc = `data:image/png;base64,${qrCode.split('base64,')[1]}`;
            setRenderMethod('alt-extracted');
          }
          break;
        case 1:
          // Tentar com base64 puro
          if (qrCode.match(/[A-Za-z0-9+/=]{100,}/)) {
            const match = qrCode.match(/([A-Za-z0-9+/=]{100,})/);
            if (match && match[1]) {
              newSrc = `data:image/png;base64,${match[1]}`;
              setRenderMethod('alt-regex');
            }
          }
          break;
        default:
          // Forçar como data URL
          if (!qrCode.startsWith('data:')) {
            newSrc = `data:image/png;base64,${qrCode}`;
            setRenderMethod('alt-forced');
          }
          break;
      }

      if (newSrc && newSrc !== imgSrc) {
        console.log('[QRCodeDisplay] 🔄 Tentando com método alternativo:', renderMethod);
        setImgSrc(newSrc);
        setHasError(false);
      } else {
        console.log('[QRCodeDisplay] ❌ Sem mais opções de renderização');
        // Se já tentamos tudo, mostrar interface para depuração manual
        setHasError(true);
        setShowDebug(true);
      }
    } catch (error) {
      console.error('[QRCodeDisplay] ❌ Erro na renderização alternativa:', error);
      setHasError(true);
    }
  };

  if (!qrCode) return null;

  return (
    <div className="flex flex-col items-center space-y-4">
      {hasError ? (
        <div className="flex flex-col items-center space-y-2">
          <AlertCircle className="w-8 h-8 text-amber-500" />
          <p className="text-sm text-muted-foreground text-center">
            Erro ao carregar o QR Code. Tente outro método de renderização.
          </p>
          <div className="w-64 h-64 border border-dashed flex flex-col items-center justify-center p-4">
            <p className="text-muted-foreground text-center">Imagem indisponível</p>
            
            <div className="mt-4 flex gap-2">
              <Button 
                size="sm"
                variant="outline"
                onClick={tryAlternateRendering}
                className="h-8"
              >
                Tentar outro método
              </Button>
              
              <Button 
                size="sm"
                variant="outline"
                onClick={() => setShowDebug(true)}
                className="h-8"
              >
                <Bug className="h-4 w-4 mr-1" />
                Diagnóstico
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative">
          <div className="w-64 h-64 bg-white flex items-center justify-center overflow-hidden">
            <img
              className="qr-code-image w-64 h-64 object-contain"
              src={imgSrc || qrCode}
              alt="QR Code WhatsApp"
              crossOrigin="anonymous"
              onLoad={(e) => {
                const img = e.target as HTMLImageElement;
                console.log('[QRCodeDisplay] ✅ Imagem carregada com sucesso', {
                  width: img.naturalWidth,
                  height: img.naturalHeight
                });
                setImgSize({
                  width: img.naturalWidth, 
                  height: img.naturalHeight
                });
              }}
              onError={(e) => {
                console.error('[QRCodeDisplay] ❌ Erro ao carregar imagem:', e);
                // CORREÇÃO: Tentar múltiplas abordagens
                let fallbackSrc = '';
                
                if (qrCode.includes('base64,')) {
                  fallbackSrc = `data:image/png;base64,${qrCode.split('base64,')[1]}`;
                  console.log('[QRCodeDisplay] 🔄 Tentando exibir apenas a parte base64');
                } else if (qrCode.match(/^[A-Za-z0-9+/=]+$/)) { 
                  fallbackSrc = `data:image/png;base64,${qrCode}`;
                  console.log('[QRCodeDisplay] 🔄 Tentando como base64 puro');
                } else {
                  fallbackSrc = qrCode;
                  console.log('[QRCodeDisplay] 🔄 Tentando com string original');
                }
                
                if (imgSrc !== fallbackSrc) {
                  setImgSrc(fallbackSrc);
                } else {
                  console.log('[QRCodeDisplay] ❌ Todas as tentativas falharam');
                  setHasError(true);
                }
              }}
            />
          </div>
          
          {/* Adicionar overlay com informações sobre a imagem */}
          {imgSize.width > 0 && (
            <div className="absolute bottom-0 left-0 bg-black bg-opacity-50 text-white text-xs px-1 rounded-tr">
              {imgSize.width}x{imgSize.height}
            </div>
          )}
          
          <div className="absolute top-2 right-2 flex gap-1">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-6 w-6 rounded-full bg-white bg-opacity-80"
                    onClick={() => window.open(imgSrc || qrCode, '_blank')}
                  >
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Abrir QR code em nova aba</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    size="icon" 
                    variant="outline" 
                    className="h-6 w-6 rounded-full bg-white bg-opacity-80"
                    onClick={() => setShowDebug(!showDebug)}
                  >
                    <Bug className="h-3 w-3" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Mostrar detalhes técnicos</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      )}
      
      <p className="text-sm text-muted-foreground text-center">
        Abra o WhatsApp no seu celular e escaneie o QR Code
      </p>

      {showDebug && (
        <div className="mt-2 p-2 rounded border border-dashed w-full max-w-[300px] overflow-auto text-xs">
          <h4 className="font-semibold mb-1 text-muted-foreground">Detalhes técnicos:</h4>
          <p className="text-muted-foreground">Tamanho: {qrCode.length} caracteres</p>
          <p className="text-muted-foreground">Formato: {qrCode.startsWith('data:image/png') ? 'PNG' : qrCode.startsWith('data:image/') ? qrCode.split(';')[0].replace('data:', '') : 'Desconhecido'}</p>
          <p className="text-muted-foreground">Método: {renderMethod}</p>
          <p className="text-muted-foreground">Tentativas: {renderAttempts}</p>
          <p className="text-muted-foreground">Status: {hasError ? 'Erro' : imgSize.width > 0 ? 'Carregado' : 'Em carregamento'}</p>
          <p className="text-muted-foreground break-all line-clamp-2">Início: {qrCode.substring(0, 30)}...</p>
          <p className="text-muted-foreground">Dimensões: {imgSize.width}x{imgSize.height}</p>
          <p className="text-muted-foreground">Origem: {imgSrc ? 'Sanitizado' : 'Original'}</p>
          <div className="mt-2 flex gap-2">
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-6 text-xs"
              onClick={() => {
                try {
                  navigator.clipboard.writeText(qrCode);
                  toast.success('QR code copiado para a área de transferência');
                } catch (e) {
                  const textarea = document.createElement('textarea');
                  textarea.value = qrCode;
                  document.body.appendChild(textarea);
                  textarea.select();
                  document.execCommand('copy');
                  document.body.removeChild(textarea);
                  toast.success('QR code copiado para a área de transferência');
                }
              }}
            >
              <Copy className="h-3 w-3 mr-1" />
              Copiar
            </Button>
            
            <Button 
              variant="ghost" 
              size="sm"
              className="h-6 text-xs"
              onClick={tryAlternateRendering}
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Outro método
            </Button>
          </div>
        </div>
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
    refreshQRCode 
  } = useQRCodeModal();
  
  const [refreshing, setRefreshing] = useState(false);
  const [loadingTime, setLoadingTime] = useState(0);
  const [qrCodeLength, setQrCodeLength] = useState(0);
  const [showTechnicalInfo, setShowTechnicalInfo] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Função para adicionar logs apenas no ambiente de dev
  const addLog = (message: string) => {
    console.log(`[QRCodeModal] ${message}`);
    setLogs(prev => [...prev.slice(-9), `[${new Date().toLocaleTimeString()}] ${message}`]);
  };
  
  // Diagnóstico quando o estado do modal muda
  useEffect(() => {
    if (isOpen) {
      addLog(`🔍 Modal aberto para instância: ${instanceId || 'Não especificada'}`);
      addLog(`🧩 Estado do QR code: ${qrCode ? 'disponível' : 'não disponível'}`);
      
      if (qrCode) {
        setQrCodeLength(qrCode.length);
        addLog(`📏 QR code tem ${qrCode.length} caracteres`);
        // CORREÇÃO: Adicionar log com início do conteúdo
        addLog(`🔍 Início QR code: ${qrCode.substring(0, 20)}...`);
      }
    }
  }, [isOpen, instanceId, qrCode]);
  
  // Contador de tempo de loading
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
    addLog('🔄 Solicitando atualização do QR code');
    refreshQRCode();
    
    // Reset refreshing state after animation
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      addLog(`🚪 ${open ? 'Abrindo' : 'Fechando'} modal`);
      if (!open) closeModal();
    }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Conectar WhatsApp</span>
            {instanceName && <span className="text-sm font-normal text-muted-foreground">({instanceName})</span>}
          </DialogTitle>
          {instanceId && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <span>ID: {instanceId}</span>
              {qrCodeLength > 0 && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Info className="w-3 h-3 cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Tamanho do QR Code: {qrCodeLength} caracteres</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
              <Button 
                variant="ghost" 
                size="icon" 
                className="h-5 w-5"
                onClick={() => {
                  setShowTechnicalInfo(!showTechnicalInfo);
                  addLog(showTechnicalInfo ? '🔍 Ocultando informações técnicas' : '🔍 Exibindo informações técnicas');
                }}
              >
                <Bug className="h-3 w-3" />
              </Button>
            </div>
          )}
          
          {showTechnicalInfo && (
            <div className="mt-2 rounded bg-slate-100 p-2 text-xs">
              <p><strong>Estado:</strong> {isLoading ? 'Carregando' : error ? 'Erro' : qrCode ? 'QR Code Carregado' : 'Aguardando'}</p>
              {qrCode && <p><strong>Tamanho QR:</strong> {qrCode.length} caracteres</p>}
              {qrCode && <p><strong>Formato:</strong> {qrCode.startsWith('data:image/png') ? 'PNG' : qrCode.startsWith('data:image/') ? qrCode.split(';')[0].replace('data:', '') : 'Desconhecido'}</p>}
              <p><strong>ID da Instância:</strong> {instanceId || 'Não definido'}</p>
              {error && <p><strong>Erro:</strong> {error}</p>}
            </div>
          )}
        </DialogHeader>

        <div className="flex flex-col items-center justify-center p-6 space-y-4">
          {isLoading && (
            <div className="flex flex-col items-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">
                Gerando QR Code...
              </p>
              <p className="text-xs text-slate-400">
                Verificando disponibilidade na instância {loadingTime}s
              </p>
            </div>
          )}

          {error && (
            <div className="text-center text-red-500 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p>{error}</p>
              <div className="flex gap-2 justify-center mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  className="flex items-center gap-1"
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Tentar Novamente
                </Button>
                
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => {
                    addLog('🚪 Fechando modal devido a erro');
                    closeModal();
                  }}
                >
                  Fechar
                </Button>

                {showTechnicalInfo && (
                  <Button 
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      addLog('📋 Verificando dados brutos');
                      // Tentar buscar dados brutos da instância para diagnóstico
                      if (instanceId) {
                        fetch(`/api/whatsapp/instance/debug?id=${instanceId}`)
                          .then(response => response.json())
                          .then(data => {
                            addLog(`🔍 Dados raw: ${JSON.stringify(data).substring(0, 100)}...`);
                            if (data.qr_code) {
                              addLog(`📱 QR encontrado: ${data.qr_code.substring(0, 30)}...`);
                            }
                          })
                          .catch(err => {
                            addLog(`❌ Erro ao buscar dados: ${err.message}`);
                          });
                      } else {
                        addLog('⚠️ Não é possível verificar sem ID de instância');
                      }
                    }}
                  >
                    Debug
                  </Button>
                )}
              </div>
            </div>
          )}

          {qrCode && <QRCodeDisplay qrCode={qrCode} />}
          
          {isOpen && !isLoading && !qrCode && !error && (
            <div className="text-center text-amber-500 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto" />
              <p>Aguardando QR Code...</p>
              <p className="text-xs text-slate-400">
                Se o QR Code não aparecer em alguns segundos, tente atualizar.
              </p>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={handleRefresh}
                  className="flex items-center gap-1"
                  disabled={refreshing}
                >
                  <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  Atualizar QR Code
                </Button>
                
                {showTechnicalInfo && instanceId && (
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => {
                      addLog('🔍 Verificando no banco de dados');
                      fetch(`/api/whatsapp/instance/qrcode?id=${instanceId}`)
                        .then(response => response.json())
                        .then(data => {
                          if (data.qr_code) {
                            addLog(`✅ QR code encontrado no banco!`);
                          } else {
                            addLog(`⚠️ QR code não disponível no banco`);
                          }
                        })
                        .catch(err => {
                          addLog(`❌ Erro ao verificar: ${err.message}`);
                        });
                    }}
                  >
                    Verificar Dados
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
        
        {showTechnicalInfo && (
          <div className="mt-4 p-2 rounded bg-gray-100 w-full text-xs">
            <div className="font-medium mb-1">Console de Logs:</div>
            <div className="max-h-40 overflow-y-auto space-y-1">
              {logs.length === 0 ? (
                <div className="text-gray-500">Nenhum log disponível</div>
              ) : (
                logs.map((log, i) => (
                  <div key={i} className="text-gray-700">{log}</div>
                ))
              )}
            </div>
          </div>
        )}
        
        <DialogFooter className="flex items-center justify-between">
          <div className="text-xs text-slate-500">
            {qrCode ? 'QR Code escaneável' : 'Aguardando QR Code...'}
          </div>
          
          {qrCode && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-1"
              disabled={refreshing}
            >
              <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              Atualizar
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
