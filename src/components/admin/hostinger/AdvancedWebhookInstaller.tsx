
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Zap, Download, Terminal, CheckCircle2, AlertTriangle, Server } from "lucide-react";
import { VPSFileInstaller } from "../vps/VPSFileInstaller";

export const AdvancedWebhookInstaller = () => {
  const [installerMode, setInstallerMode] = useState<'files' | 'manual'>('files');

  return (
    <div className="space-y-6">
      <Card className="border-purple-200 bg-purple-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <CardTitle className="text-purple-800">Sistema WhatsApp Unificado</CardTitle>
            </div>
            <Badge className="bg-purple-100 text-purple-800">
              ✅ Corrigido
            </Badge>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-700 mb-3">
              <strong>🎯 Sistema Corrigido:</strong> Servidor único e unificado na porta 3002 sem conflitos.
            </p>
            <div className="space-y-2 text-sm text-purple-600">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span><strong>Porta 3002:</strong> Servidor WhatsApp principal (vps-server-persistent.js)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span><strong>Porta 3001:</strong> Livre (sem conflitos)</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span><strong>Edge Functions:</strong> Conectam apenas na porta 3002</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span><strong>Webhook:</strong> Automático para Supabase</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span><strong>PM2:</strong> Auto-restart e persistência de sessões</span>
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
              Correção Automática
            </Button>
            <Button
              variant={installerMode === 'manual' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setInstallerMode('manual')}
            >
              <Terminal className="h-4 w-4 mr-1" />
              Comandos Manuais
            </Button>
          </div>

          {/* Conteúdo baseado no modo */}
          {installerMode === 'files' && (
            <VPSFileInstaller />
          )}

          {installerMode === 'manual' && (
            <div className="bg-white/80 p-4 rounded-lg border border-purple-200">
              <h4 className="font-medium text-purple-800 mb-3">📝 Comandos de Correção Manual</h4>
              <div className="space-y-3 text-sm text-purple-700">
                <div>
                  <strong>1. Conectar na VPS:</strong>
                  <div className="bg-gray-900 text-green-400 p-2 rounded mt-1 font-mono text-xs">
                    ssh root@31.97.24.222
                  </div>
                </div>
                
                <div>
                  <strong>2. Parar processos conflitantes:</strong>
                  <div className="bg-gray-900 text-green-400 p-2 rounded mt-1 font-mono text-xs">
                    pm2 stop all<br/>
                    pm2 delete all<br/>
                    lsof -ti:3001 | xargs -r kill -9<br/>
                    lsof -ti:3002 | xargs -r kill -9
                  </div>
                </div>
                
                <div>
                  <strong>3. Limpar arquivos antigos:</strong>
                  <div className="bg-gray-900 text-green-400 p-2 rounded mt-1 font-mono text-xs">
                    rm -f /root/whatsapp-server.js<br/>
                    rm -f /root/vps-server-persistent.js<br/>
                    rm -f /root/whatsapp-server-corrected.js
                  </div>
                </div>
                
                <div>
                  <strong>4. Gerar arquivo corrigido:</strong>
                  <p className="text-xs text-purple-600 mt-1">
                    Use o botão "Correção Automática" acima para gerar o arquivo vps-server-persistent.js atualizado
                  </p>
                </div>
                
                <div>
                  <strong>5. Instalar dependências:</strong>
                  <div className="bg-gray-900 text-green-400 p-2 rounded mt-1 font-mono text-xs">
                    cd /root<br/>
                    npm install whatsapp-web.js express cors node-fetch
                  </div>
                </div>
                
                <div>
                  <strong>6. Iniciar servidor único:</strong>
                  <div className="bg-gray-900 text-green-400 p-2 rounded mt-1 font-mono text-xs">
                    PORT=3002 AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" pm2 start vps-server-persistent.js --name whatsapp-main-3002<br/>
                    pm2 save<br/>
                    pm2 startup
                  </div>
                </div>
                
                <div>
                  <strong>7. Verificar sistema:</strong>
                  <div className="bg-gray-900 text-green-400 p-2 rounded mt-1 font-mono text-xs">
                    pm2 list<br/>
                    curl http://localhost:3002/health<br/>
                    curl http://31.97.24.222:3002/health
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Status da Arquitetura */}
          <div className="bg-green-50 border border-green-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <Server className="h-5 w-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-800">🏗️ Arquitetura Final</h4>
                <ul className="text-sm text-green-700 mt-1 space-y-1">
                  <li>• <strong>VPS:</strong> Servidor único na porta 3002 (sem conflitos)</li>
                  <li>• <strong>Edge Functions:</strong> whatsapp_instance_manager + whatsapp_qr_service</li>
                  <li>• <strong>Comunicação:</strong> HTTP direto VPS ↔ Supabase</li>
                  <li>• <strong>Webhook:</strong> Sincronização automática bidirecional</li>
                  <li>• <strong>Persistência:</strong> Sessões WhatsApp mantidas entre restarts</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Diagnóstico de Conflitos */}
          <div className="bg-yellow-50 border border-yellow-200 p-3 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-800">⚠️ Problemas Resolvidos</h4>
                <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                  <li>• <strong>Conflito de Portas:</strong> 3001 vs 3002 eliminado</li>
                  <li>• <strong>Múltiplos Servidores:</strong> Unificado em um só</li>
                  <li>• <strong>Edge Functions:</strong> Agora conectam na porta correta</li>
                  <li>• <strong>Configuração VPS:</strong> Simplificada e consistente</li>
                </ul>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
