
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Zap, Download, CheckCircle2, AlertTriangle, Server, Terminal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const QuickVPSCorrection = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [installStep, setInstallStep] = useState<'ready' | 'completed'>('completed'); // Já foi aplicada
  const [serverCode, setServerCode] = useState<string>('vps-server-corrected.js instalado');

  const testVPSConnection = async () => {
    setIsGenerating(true);
    
    try {
      console.log('[Quick VPS] 🧪 Testando conexão com VPS corrigida...');
      
      const response = await fetch('http://31.97.24.222:3002/health');
      const data = await response.json();
      
      if (data.success && data.version === '3.1.0-CHROME-FIXED') {
        toast.success('✅ VPS corrigida funcionando perfeitamente!', {
          description: `Servidor: ${data.server} | Puppeteer: ${data.puppeteerConfig}`
        });
        
        console.log('[Quick VPS] ✅ Dados do servidor:', data);
      } else {
        throw new Error('Servidor não retornou versão corrigida');
      }
      
    } catch (error: any) {
      console.error('[Quick VPS] ❌ Erro no teste:', error);
      toast.error(`Erro ao testar VPS: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <CardTitle className="text-green-800">Correção VPS Aplicada</CardTitle>
          </div>
          <Badge className="bg-green-600 text-white">
            Concluído
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Status da Operação */}
        <div className="bg-white/80 p-4 rounded-lg border border-green-200">
          <h4 className="font-medium text-green-800 mb-2">🎯 Correção Aplicada com Sucesso!</h4>
          <div className="space-y-2 text-sm text-green-700">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Google Chrome instalado na VPS</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>vps-server-corrected.js implantado</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>Puppeteer configurado para VPS</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span>PM2 reiniciado: whatsapp-main-3002</span>
            </div>
          </div>
        </div>

        {/* Botão de Teste */}
        <div className="flex gap-3">
          <Button
            onClick={testVPSConnection}
            disabled={isGenerating}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            {isGenerating ? (
              <>
                <Download className="h-4 w-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              <>
                <Server className="h-4 w-4 mr-2" />
                Testar Conexão VPS
              </>
            )}
          </Button>
        </div>

        {/* Resultado Final */}
        <div className="bg-green-100 border border-green-300 p-3 rounded-lg">
          <h4 className="font-medium text-green-800 mb-2">🎯 Status Atual</h4>
          <div className="text-sm text-green-700 space-y-1">
            <div>• <strong>Servidor:</strong> vps-server-corrected.js (v3.1.0-CHROME-FIXED)</div>
            <div>• <strong>Porta:</strong> 3002 (ativa)</div>
            <div>• <strong>Puppeteer:</strong> VPS_CHROME_OPTIMIZED</div>
            <div>• <strong>Chrome:</strong> Instalado com dependências headless</div>
            <div>• <strong>Status:</strong> ✅ Online e pronto para receber requisições</div>
          </div>
        </div>

        {/* Comandos de Verificação */}
        <div className="bg-gray-900 text-green-400 p-3 rounded text-xs font-mono">
          <div className="mb-2 text-green-300"># Comandos para monitorar:</div>
          <div>pm2 logs whatsapp-main-3002</div>
          <div>curl http://31.97.24.222:3002/health</div>
          <div>pm2 status</div>
        </div>
      </CardContent>
    </Card>
  );
};
