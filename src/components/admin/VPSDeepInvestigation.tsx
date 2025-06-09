
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, CheckCircle, XCircle, AlertTriangle, Wrench, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvestigationResult {
  investigation: {
    basicConnectivity: any;
    portScan: any;
    whatsappAnalysis: any;
    recommendation: any;
  };
  steps: string[];
}

export const VPSDeepInvestigation = () => {
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isFixing, setIsFixing] = useState(false);
  const [result, setResult] = useState<InvestigationResult | null>(null);
  const [installationScript, setInstallationScript] = useState<string>('');
  const [fixScript, setFixScript] = useState<string>('');

  const runInvestigation = async () => {
    setIsInvestigating(true);
    setResult(null);
    
    try {
      console.log('[VPS Deep Investigation] 🕵️ Iniciando investigação profunda...');
      
      const { data, error } = await supabase.functions.invoke('vps_deep_investigation', {
        body: { action: 'investigate_vps' }
      });

      if (error) {
        throw new Error(error.message);
      }

      setResult(data);
      
      if (data.success) {
        toast.success('Investigação concluída com sucesso!');
      } else {
        toast.error(`Investigação falhou: ${data.error}`);
      }

    } catch (error: any) {
      console.error('[VPS Deep Investigation] ❌ Erro:', error);
      toast.error(`Erro na investigação: ${error.message}`);
    } finally {
      setIsInvestigating(false);
    }
  };

  const installCompleteServer = async () => {
    setIsInstalling(true);
    
    try {
      console.log('[VPS Deep Investigation] 🚀 Instalando servidor completo...');
      
      const { data, error } = await supabase.functions.invoke('vps_deep_investigation', {
        body: { action: 'install_complete_server' }
      });

      if (error) {
        throw new Error(error.message);
      }

      setInstallationScript(data.installationScript);
      
      if (data.success) {
        toast.success('Script de instalação preparado!');
      } else {
        toast.error(`Falha na preparação: ${data.error}`);
      }

    } catch (error: any) {
      console.error('[VPS Deep Investigation] ❌ Erro:', error);
      toast.error(`Erro na instalação: ${error.message}`);
    } finally {
      setIsInstalling(false);
    }
  };

  const fixExistingServer = async () => {
    setIsFixing(true);
    
    try {
      console.log('[VPS Deep Investigation] 🔧 Corrigindo servidor existente...');
      
      const { data, error } = await supabase.functions.invoke('vps_deep_investigation', {
        body: { action: 'fix_existing_server' }
      });

      if (error) {
        throw new Error(error.message);
      }

      setFixScript(data.fixScript);
      
      if (data.success) {
        toast.success('Script de correção preparado!');
      } else {
        toast.error(`Falha na correção: ${data.error}`);
      }

    } catch (error: any) {
      console.error('[VPS Deep Investigation] ❌ Erro:', error);
      toast.error(`Erro na correção: ${error.message}`);
    } finally {
      setIsFixing(false);
    }
  };

  const downloadScript = (script: string, filename: string) => {
    const blob = new Blob([script], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );
  };

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-500">SUCESSO</Badge>
    ) : (
      <Badge variant="destructive">FALHA</Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search className="h-5 w-5 text-blue-600" />
          Investigação Profunda da VPS
        </CardTitle>
        <p className="text-sm text-gray-600">
          Análise completa da VPS para identificar problemas e aplicar correções
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={runInvestigation}
            disabled={isInvestigating}
            className="flex items-center gap-2"
          >
            {isInvestigating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Investigando...
              </>
            ) : (
              <>
                <Search className="h-4 w-4" />
                Investigar VPS
              </>
            )}
          </Button>
          
          {result?.investigation?.recommendation?.action === 'install_complete_server' && (
            <Button 
              onClick={installCompleteServer}
              disabled={isInstalling}
              variant="default"
              className="flex items-center gap-2"
            >
              {isInstalling ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  Instalar Servidor Completo
                </>
              )}
            </Button>
          )}
          
          {result?.investigation?.recommendation?.action === 'fix_existing_server' && (
            <Button 
              onClick={fixExistingServer}
              disabled={isFixing}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isFixing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Preparando...
                </>
              ) : (
                <>
                  <Wrench className="h-4 w-4" />
                  Corrigir Servidor Existente
                </>
              )}
            </Button>
          )}
        </div>

        {result && (
          <div className="space-y-4">
            {/* Resumo da Investigação */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-blue-800">Resultado da Investigação</h3>
                  {getStatusBadge(result.investigation.basicConnectivity.success)}
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.investigation.basicConnectivity.success)}
                    <span>Conectividade: {result.investigation.basicConnectivity.message}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.investigation.portScan.activePorts.length > 0)}
                    <span>Portas ativas: {result.investigation.portScan.activePorts.join(', ') || 'Nenhuma'}</span>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {getStatusIcon(result.investigation.whatsappAnalysis.isWhatsAppServer)}
                    <span>WhatsApp Server: {result.investigation.whatsappAnalysis.message}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recomendação */}
            <Card className="bg-orange-50 border-orange-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  <div>
                    <h3 className="font-medium text-orange-800">Recomendação</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      {result.investigation.recommendation.message}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Passos da Investigação */}
            <div className="space-y-2">
              <h4 className="font-medium text-sm">Passos da Investigação:</h4>
              <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                {result.steps.map((step, index) => (
                  <div key={index} className="text-sm font-mono flex items-center gap-2">
                    {step.startsWith('✅') ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : step.startsWith('❌') ? (
                      <XCircle className="h-3 w-3 text-red-500" />
                    ) : step.startsWith('🔍') || step.startsWith('🧪') ? (
                      <Search className="h-3 w-3 text-blue-500" />
                    ) : (
                      <div className="h-3 w-3 rounded-full bg-gray-400" />
                    )}
                    <span>{step}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Scripts de Instalação/Correção */}
        {installationScript && (
          <Card className="bg-green-50 border-green-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-green-800">Script de Instalação Preparado</h3>
                <Button 
                  onClick={() => downloadScript(installationScript, 'install-whatsapp-complete.sh')}
                  size="sm"
                  variant="outline"
                  className="border-green-500 text-green-600"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Baixar Script
                </Button>
              </div>
              <div className="text-sm text-green-700 space-y-1">
                <p><strong>Instruções:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Baixe o script de instalação</li>
                  <li>Conecte na VPS: <code>ssh root@31.97.24.222</code></li>
                  <li>Execute: <code>chmod +x install-whatsapp-complete.sh && ./install-whatsapp-complete.sh</code></li>
                  <li>Aguarde a instalação completa</li>
                  <li>Teste: <code>curl http://31.97.24.222:3002/health</code></li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        {fixScript && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-medium text-yellow-800">Script de Correção Preparado</h3>
                <Button 
                  onClick={() => downloadScript(fixScript, 'fix-whatsapp-server.sh')}
                  size="sm"
                  variant="outline"
                  className="border-yellow-500 text-yellow-600"
                >
                  <Download className="h-3 w-3 mr-1" />
                  Baixar Script
                </Button>
              </div>
              <div className="text-sm text-yellow-700 space-y-1">
                <p><strong>Instruções:</strong></p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Baixe o script de correção</li>
                  <li>Conecte na VPS: <code>ssh root@31.97.24.222</code></li>
                  <li>Execute: <code>chmod +x fix-whatsapp-server.sh && ./fix-whatsapp-server.sh</code></li>
                  <li>Verifique o resultado</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
          <h4 className="font-medium text-blue-800 mb-1">Como Usar:</h4>
          <div className="text-sm text-blue-700 space-y-1">
            <p>1. <strong>Investigar:</strong> Analisa o estado atual da VPS</p>
            <p>2. <strong>Instalar/Corrigir:</strong> Prepara script baseado na análise</p>
            <p>3. <strong>Executar SSH:</strong> Execute o script manualmente via SSH</p>
            <p>4. <strong>Testar:</strong> Valide o funcionamento após execução</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
