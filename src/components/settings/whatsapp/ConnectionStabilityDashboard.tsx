
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Shield, AlertTriangle, CheckCircle, Search, Info, Activity, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import { ConnectionStabilityService } from "@/hooks/whatsapp/services/connectionStabilityService";
import { OrphanInstanceRecoveryService } from "@/services/whatsapp/services/orphanInstanceRecoveryService";
import { StabilityService } from "@/services/whatsapp/services/stabilityService";
import { VPSHealthService } from "@/services/whatsapp/services/vpsHealthService";
import { useCompanyData } from "@/hooks/useCompanyData";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ConnectionStabilityDashboard() {
  const { companyId } = useCompanyData();
  const [isScanning, setIsScanning] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [lastScanResult, setLastScanResult] = useState<any>(null);
  const [systemStatus, setSystemStatus] = useState<any>(null);

  // Atualizar status do sistema
  useEffect(() => {
    const updateStatus = () => {
      const status = ConnectionStabilityService.getSystemStatus();
      setSystemStatus(status);
    };

    updateStatus();
    const interval = setInterval(updateStatus, 30000); // A cada 30 segundos

    return () => clearInterval(interval);
  }, []);

  const handleScanOrphans = async () => {
    if (!companyId) {
      toast.error('ID da empresa não encontrado');
      return;
    }

    setIsScanning(true);
    setLastScanResult(null);
    
    try {
      console.log('[StabilityDashboard] Iniciando busca por instâncias órfãs...');
      
      toast.info('Verificando saúde do VPS e buscando órfãs...', { duration: 2000 });
      
      const result = await OrphanInstanceRecoveryService.findAndRecoverOrphanInstances(companyId);
      setLastScanResult(result);

      console.log('[StabilityDashboard] Resultado da busca:', result);

      if (result.found.length === 0) {
        toast.success('✅ Nenhuma instância órfã encontrada! Tudo sincronizado.', { duration: 4000 });
      } else if (result.recovered > 0) {
        toast.success(`🎉 ${result.recovered} instância(s) órfã(s) recuperada(s) com sucesso!`, { duration: 5000 });
      }

      if (result.errors.length > 0) {
        toast.error(`❌ ${result.errors.length} erro(s) durante a busca/recuperação`, { duration: 5000 });
        console.error('[StabilityDashboard] Erros detalhados:', result.errors);
      }

    } catch (error) {
      console.error('[StabilityDashboard] Erro na busca:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro na busca: ${errorMessage}`, { duration: 5000 });
      
      setLastScanResult({
        found: [],
        recovered: 0,
        errors: [errorMessage]
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleVPSHealthCheck = async () => {
    try {
      toast.info('Verificando saúde do VPS...', { duration: 2000 });
      
      const health = await VPSHealthService.checkVPSHealth();
      
      if (health.isOnline) {
        toast.success(`✅ VPS online! Tempo de resposta: ${health.responseTime}ms`, { duration: 4000 });
      } else {
        toast.error(`❌ VPS offline: ${health.error}`, { duration: 6000 });
      }
    } catch (error) {
      toast.error('Erro ao verificar VPS');
    }
  };

  const handleForceRecovery = async () => {
    if (!companyId) {
      toast.error('ID da empresa não encontrado');
      return;
    }

    setIsRecovering(true);
    try {
      console.log('[StabilityDashboard] Forçando recuperação completa...');
      
      toast.info('Executando recuperação forçada...', { duration: 2000 });
      
      const result = await ConnectionStabilityService.forceRecovery(companyId);
      
      toast.success('Recuperação forçada concluída!');
      console.log('[StabilityDashboard] Resultado da recuperação forçada:', result);

    } catch (error) {
      console.error('[StabilityDashboard] Erro na recuperação forçada:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro na recuperação forçada: ${errorMessage}`);
    } finally {
      setIsRecovering(false);
    }
  };

  const handleStartStability = () => {
    if (!companyId) {
      toast.error('ID da empresa não encontrado');
      return;
    }

    ConnectionStabilityService.startStabilitySystem(companyId);
    toast.success('Sistema de estabilidade iniciado! 🛡️');
    
    // Atualizar status
    const status = ConnectionStabilityService.getSystemStatus();
    setSystemStatus(status);
  };

  const getVPSStatusBadge = () => {
    if (!systemStatus?.vpsHealth) return null;
    
    const { isOnline, responseTime, consecutiveFailures } = systemStatus.vpsHealth;
    
    if (isOnline) {
      return (
        <Badge variant="default" className="gap-1">
          <Wifi className="h-3 w-3" />
          Online ({responseTime}ms)
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="gap-1">
          <WifiOff className="h-3 w-3" />
          Offline ({consecutiveFailures} falhas)
        </Badge>
      );
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-blue-500" />
          Estabilidade de Conexão
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Sistema avançado para evitar quedas de conexão e recuperar instâncias perdidas
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Alerta informativo */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Diagnóstico:</strong> Use "Buscar Órfãs" para encontrar conexões ativas na VPS que sumiram do banco de dados. 
            O sistema verifica automaticamente a saúde do VPS antes de cada operação.
          </AlertDescription>
        </Alert>

        {/* Status do VPS */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium text-sm flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Status do VPS
            </h4>
            <div className="flex flex-wrap gap-2">
              {getVPSStatusBadge()}
              {systemStatus?.vpsHealth?.lastChecked && (
                <Badge variant="outline" className="text-xs">
                  Última verificação: {new Date(systemStatus.vpsHealth.lastChecked).toLocaleTimeString()}
                </Badge>
              )}
            </div>
            {systemStatus?.vpsHealth?.error && (
              <div className="text-xs text-red-600 mt-1">
                Erro: {systemStatus.vpsHealth.error}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Status do Sistema</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant={systemStatus?.recoveryActive ? "default" : "secondary"}>
                {systemStatus?.recoveryActive ? "Auto-recuperação Ativa" : "Auto-recuperação Inativa"}
              </Badge>
              <Badge variant={systemStatus?.stabilityActive ? "default" : "secondary"}>
                {systemStatus?.stabilityActive ? "Monitoramento Ativo" : "Monitoramento Inativo"}
              </Badge>
            </div>
          </div>
        </div>

        {/* Ações Principais */}
        <div className="flex flex-wrap gap-2">
          <Button 
            onClick={handleStartStability}
            className="gap-2"
            variant="default"
          >
            <Shield className="h-4 w-4" />
            Iniciar Sistema Estabilidade
          </Button>

          <Button 
            onClick={handleVPSHealthCheck}
            variant="outline"
            className="gap-2"
          >
            <Activity className="h-4 w-4" />
            Verificar VPS
          </Button>

          <Button 
            onClick={handleScanOrphans}
            disabled={isScanning}
            variant="outline"
            className="gap-2"
          >
            {isScanning ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Search className="h-4 w-4" />
            )}
            {isScanning ? 'Buscando...' : 'Buscar Órfãs'}
          </Button>

          <Button 
            onClick={handleForceRecovery}
            disabled={isRecovering}
            variant="outline"
            className="gap-2"
          >
            {isRecovering ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
            {isRecovering ? 'Recuperando...' : 'Recuperação Forçada'}
          </Button>
        </div>

        {/* Resultado da Última Busca */}
        {lastScanResult && (
          <div className="rounded-lg border p-4 bg-muted/30">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              {lastScanResult.errors.length > 0 ? (
                <AlertTriangle className="h-4 w-4 text-orange-500" />
              ) : (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
              Último Resultado da Busca
            </h4>
            <div className="grid gap-2 text-sm">
              <div className="flex justify-between">
                <span>Instâncias Órfãs Encontradas:</span>
                <Badge variant="outline">{lastScanResult.found.length}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Instâncias Recuperadas:</span>
                <Badge variant={lastScanResult.recovered > 0 ? "default" : "secondary"}>
                  {lastScanResult.recovered}
                </Badge>
              </div>
              {lastScanResult.errors.length > 0 && (
                <>
                  <div className="flex justify-between">
                    <span>Erros:</span>
                    <Badge variant="destructive">{lastScanResult.errors.length}</Badge>
                  </div>
                  <div className="mt-2 p-2 bg-red-50 rounded text-xs">
                    <strong>Detalhes dos erros:</strong>
                    <ul className="mt-1 space-y-1">
                      {lastScanResult.errors.map((error: string, index: number) => (
                        <li key={index} className="text-red-700">• {error}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Explicação */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Sistema de Estabilidade:</strong> Monitora VPS e recupera conexões automaticamente</p>
          <p><strong>Verificar VPS:</strong> Testa conectividade e saúde do servidor VPS</p>
          <p><strong>Buscar Órfãs:</strong> Encontra instâncias ativas na VPS mas perdidas no banco</p>
          <p><strong>Recuperação Forçada:</strong> Restaura todas as instâncias em quarentena</p>
        </div>
      </CardContent>
    </Card>
  );
}
