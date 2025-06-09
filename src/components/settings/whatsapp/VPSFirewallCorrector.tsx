
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Shield, 
  CheckCircle, 
  AlertTriangle, 
  Loader2, 
  Flame,
  Lock,
  Unlock,
  Network,
  AlertCircle
} from "lucide-react";

export const VPSFirewallCorrector = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [correctionResult, setCorrectionResult] = useState<any>(null);

  const runFirewallCorrection = async (action: string = 'complete') => {
    try {
      setIsRunning(true);
      toast.loading(`Executando correção de firewall: ${action}...`, { id: 'firewall-correction' });

      const { data, error } = await supabase.functions.invoke('vps_firewall_corrector', {
        body: { action }
      });

      if (error) {
        throw new Error(`Erro na edge function: ${error.message}`);
      }

      setCorrectionResult(data);
      
      if (data.success) {
        if (data.result.analysis?.ready) {
          toast.success('🔥 Firewall configurado com sucesso!', { id: 'firewall-correction' });
        } else {
          toast.warning('⚠️ Correção parcial - verificar resultados', { id: 'firewall-correction' });
        }
      } else {
        toast.error('❌ Falha na correção do firewall', { id: 'firewall-correction' });
      }

    } catch (error: any) {
      console.error('[Firewall Corrector] ❌ Erro:', error);
      toast.error(`Erro: ${error.message}`, { id: 'firewall-correction' });
      setCorrectionResult({
        success: false,
        error: error.message
      });
    } finally {
      setIsRunning(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? 
      <CheckCircle className="h-4 w-4 text-green-600" /> : 
      <AlertTriangle className="h-4 w-4 text-red-600" />;
  };

  const getStatusBadge = (success: boolean) => {
    return success ? 
      <Badge className="bg-green-100 text-green-800">SUCESSO</Badge> : 
      <Badge variant="destructive">FALHA</Badge>;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-red-200 bg-red-50/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-800">
            <Flame className="h-6 w-6" />
            Corretor de Firewall VPS
          </CardTitle>
          <p className="text-red-700 text-sm">
            <strong>PROBLEMA IDENTIFICADO:</strong> Todas as portas da VPS estão bloqueadas por firewall.
            <br />
            Esta ferramenta vai conectar via SSH e configurar as regras necessárias.
          </p>
        </CardHeader>
      </Card>

      {/* Botões de Ação */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button 
          onClick={() => runFirewallCorrection('check_firewall_status')}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          <Shield className="h-4 w-4 mr-1" />
          Verificar Status
        </Button>
        
        <Button 
          onClick={() => runFirewallCorrection('configure_firewall')}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          <Lock className="h-4 w-4 mr-1" />
          Configurar UFW
        </Button>
        
        <Button 
          onClick={() => runFirewallCorrection('whitelist_supabase_ips')}
          disabled={isRunning}
          variant="outline"
          size="sm"
        >
          <Network className="h-4 w-4 mr-1" />
          Whitelist IPs
        </Button>
        
        <Button 
          onClick={() => runFirewallCorrection('emergency_open_all')}
          disabled={isRunning}
          variant="destructive"
          size="sm"
        >
          <Unlock className="h-4 w-4 mr-1" />
          Abrir Tudo
        </Button>
      </div>

      {/* Botão Correção Completa */}
      <Button 
        onClick={() => runFirewallCorrection('complete')}
        disabled={isRunning}
        className="w-full"
        size="lg"
      >
        {isRunning ? (
          <>
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Corrigindo Firewall...
          </>
        ) : (
          <>
            <Flame className="h-5 w-5 mr-2" />
            🔥 CORREÇÃO COMPLETA DO FIREWALL
          </>
        )}
      </Button>

      {/* Resultados */}
      {correctionResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Resultado da Correção - {correctionResult.action}
              <Badge variant={correctionResult.success ? "default" : "destructive"}>
                {correctionResult.success ? "Sucesso" : "Erro"}
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {correctionResult.success ? (
              <>
                {/* Correção Completa */}
                {correctionResult.result.comprehensive && (
                  <>
                    <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                      <div className="text-center">
                        <div className="font-medium text-xs">Firewall Configurado</div>
                        {getStatusBadge(correctionResult.result.analysis.firewallConfigured)}
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-xs">IPs Whitelistados</div>
                        {getStatusBadge(correctionResult.result.analysis.ipsWhitelisted)}
                      </div>
                      <div className="text-center">
                        <div className="font-medium text-xs">Sistema Pronto</div>
                        {getStatusBadge(correctionResult.result.analysis.ready)}
                      </div>
                    </div>

                    {/* Recomendações */}
                    {correctionResult.result.recommendations && correctionResult.result.recommendations.length > 0 && (
                      <div className="p-4 bg-blue-50 border border-blue-200 rounded">
                        <h5 className="font-medium text-blue-800 mb-3">📋 Próximos Passos:</h5>
                        <div className="space-y-2">
                          {correctionResult.result.recommendations.map((rec: string, index: number) => (
                            <div key={index} className="flex items-start gap-2">
                              <CheckCircle className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                              <span className="text-blue-700 text-sm">{rec}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Status Check */}
                {correctionResult.result.summary && (
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h5 className="font-medium text-sm mb-3">Status do Sistema:</h5>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span>UFW Ativo:</span>
                        {getStatusBadge(correctionResult.result.summary.ufwActive)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>WhatsApp Rodando:</span>
                        {getStatusBadge(correctionResult.result.summary.whatsappRunning)}
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Portas Acessíveis:</span>
                        <Badge variant="outline">{correctionResult.result.summary.portsAccessible}/2</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span>Regras iptables:</span>
                        {getStatusBadge(correctionResult.result.summary.hasIptablesRules)}
                      </div>
                    </div>
                  </div>
                )}

                {/* Comandos Executados */}
                {correctionResult.result.commands && (
                  <div className="space-y-3">
                    <h5 className="font-medium">Comandos Executados:</h5>
                    {correctionResult.result.commands.map((cmd: any, index: number) => (
                      <div key={index} className="p-3 border border-gray-200 rounded">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{cmd.command}</span>
                          {getStatusBadge(cmd.success)}
                        </div>
                        {cmd.output && (
                          <pre className="text-xs bg-gray-100 p-2 rounded overflow-x-auto">
                            {cmd.output.substring(0, 300)}
                            {cmd.output.length > 300 && "..."}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-xs text-gray-500">
                  ID: {correctionResult.correctionId} | {correctionResult.timestamp}
                </div>
              </>
            ) : (
              <div className="text-center py-4">
                <AlertCircle className="h-8 w-8 text-red-600 mx-auto mb-2" />
                <p className="text-red-700">Falha na correção do firewall</p>
                <p className="text-sm text-gray-600">{correctionResult.error}</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
};
