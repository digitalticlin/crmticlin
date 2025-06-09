
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Zap, Download, Terminal, CheckCircle2, AlertTriangle } from "lucide-react";
import { VPSFileInstaller } from "../vps/VPSFileInstaller";

export const AdvancedWebhookInstaller = () => {
  const [installerMode, setInstallerMode] = useState<'files' | 'ssh' | 'manual'>('files');

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-800">Instalador de Webhook Avançado</CardTitle>
            </div>
            <Badge className="bg-purple-100 text-purple-800">
              Recomendado
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700 mb-3">
              <strong>🚀 Instalador Completo:</strong> Corrige e instala servidores WhatsApp na VPS com webhooks automáticos.
            </p>
            <div className="space-y-2 text-sm text-purple-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Arquivo <code>vps-server-persistent.js</code> corrigido (porta 3002)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Arquivo <code>whatsapp-server-corrected.js</code> alternativo (porta 3001)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Script de instalação automática com PM2</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Webhook automático para Supabase</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span>Persistência de instâncias e QR codes</span>
              </div>
            </div>
          </div>

          {/* Seletor de Modo */}
          <div className="flex gap-2">
            <Button
              variant={installerMode === 'files' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInstallerMode('files')}
            >
              <Download className="h-4 w-4 mr-1" />
              Gerar Arquivos
            </Button>
            <Button
              variant={installerMode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInstallerMode('manual')}
            >
              <Terminal className="h-4 w-4 mr-1" />
              Manual
            </Button>
          </div>

          {/* Conteúdo baseado no modo */}
          {installerMode === 'files' && (
            <VPSFileInstaller />
          )}

          {installerMode === 'manual' && (
            <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-3">📝 Instalação Manual</h4>
              <div className="space-y-3 text-sm text-purple-700">
                <div>
                  <strong>1. Conectar na VPS:</strong>
                  <div className="bg-gray-900 text-green-400 p-2 rounded mt-1 font-mono text-xs">
                    ssh root@31.97.24.222
                  </div>
                </div>
                
                <div>
                  <strong>2. Parar processos existentes:</strong>
                  <div className="bg-gray-900 text-green-400 p-2 rounded mt-1 font-mono text-xs">
                    pm2 stop all<br/>
                    pm2 delete all
                  </div>
                </div>
                
                <div>
                  <strong>3. Instalar dependências:</strong>
                  <div className="bg-gray-900 text-green-400 p-2 rounded mt-1 font-mono text-xs">
                    npm install whatsapp-web.js express cors node-fetch
                  </div>
                </div>
                
                <div>
                  <strong>4. Copiar os arquivos corrigidos para /root/</strong>
                  <p className="text-xs text-purple-600 mt-1">
                    Use o botão "Gerar Arquivos" acima para obter os arquivos corrigidos
                  </p>
                </div>
                
                <div>
                  <strong>5. Iniciar serviços:</strong>
                  <div className="bg-gray-900 text-green-400 p-2 rounded mt-1 font-mono text-xs">
                    PORT=3002 pm2 start vps-server-persistent.js --name whatsapp-main-3002<br/>
                    PORT=3001 pm2 start whatsapp-server-corrected.js --name whatsapp-alt-3001<br/>
                    pm2 save<br/>
                    pm2 startup
                  </div>
                </div>
                
                <div>
                  <strong>6. Verificar:</strong>
                  <div className="bg-gray-900 text-green-400 p-2 rounded mt-1 font-mono text-xs">
                    pm2 list<br/>
                    curl http://localhost:3001/health<br/>
                    curl http://localhost:3002/health
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status da Correção */}
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">✅ Correções Implementadas</h4>
                <ul className="text-sm text-green-700 mt-1 space-y-1">
                  <li>• Edge functions corrigidas (whatsapp_instance_manager + whatsapp_qr_service)</li>
                  <li>• Servidor VPS com persistência e webhooks automáticos</li>
                  <li>• Descoberta automática de endpoints (3001 ↔ 3002)</li>
                  <li>• QR codes em tempo real via polling inteligente</li>
                  <li>• Sincronização bidirecional VPS ↔ Supabase</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
