
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConnectionStabilityService } from "@/hooks/whatsapp/services/connectionStabilityService";
import { OrphanInstanceRecoveryService } from "@/services/whatsapp/services/orphanInstanceRecoveryService";
import { VPSHealthMonitor } from "@/services/whatsapp/services/vpsHealthMonitor";
import { useCompanyData } from "@/hooks/useCompanyData";
import { VPSStatusCard } from "./stability/VPSStatusCard";
import { StabilityActionButtons } from "./stability/StabilityActionButtons";
import { ScanResultsCard } from "./stability/ScanResultsCard";
import { SystemHealthDashboard } from "./stability/SystemHealthDashboard";

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
      console.log('[StabilityDashboard] Iniciando busca OTIMIZADA por instâncias órfãs...');
      
      toast.info('🔍 Verificando VPS e buscando órfãs (processo otimizado)...', { duration: 3000 });
      
      const result = await OrphanInstanceRecoveryService.findAndRecoverOrphanInstances(companyId);
      setLastScanResult(result);

      console.log('[StabilityDashboard] Resultado da busca otimizada:', result);

      if (result.found.length === 0) {
        toast.success('✅ Nenhuma instância órfã encontrada! Sistema sincronizado.', { duration: 4000 });
      } else if (result.recovered > 0) {
        toast.success(`🎉 ${result.recovered} instância(s) órfã(s) recuperada(s) automaticamente!`, { duration: 6000 });
      }

      if (result.errors.length > 0) {
        toast.error(`⚠️ ${result.errors.length} problema(s) detectado(s) - verificar logs`, { duration: 5000 });
        console.error('[StabilityDashboard] Problemas detalhados:', result.errors);
      }

    } catch (error) {
      console.error('[StabilityDashboard] Erro na busca otimizada:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`❌ Erro na busca: ${errorMessage}`, { duration: 6000 });
      
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
      toast.info('🏥 Verificando saúde completa do VPS...', { duration: 2000 });
      
      const health = await VPSHealthMonitor.checkVPSHealth();
      
      if (health.isOnline) {
        const loadInfo = health.vpsLoad ? 
          ` (CPU: ${health.vpsLoad.cpu}%, Mem: ${health.vpsLoad.memory}%, Conexões: ${health.vpsLoad.activeConnections})` : '';
        toast.success(`✅ VPS saudável! Latência: ${health.responseTime}ms${loadInfo}`, { duration: 5000 });
      } else {
        toast.error(`❌ VPS com problemas: ${health.error} (${health.consecutiveFailures} falhas consecutivas)`, { duration: 8000 });
      }
    } catch (error) {
      toast.error('❌ Erro ao verificar VPS - servidor pode estar inacessível');
    }
  };

  const handleForceRecovery = async () => {
    if (!companyId) {
      toast.error('ID da empresa não encontrado');
      return;
    }

    setIsRecovering(true);
    try {
      console.log('[StabilityDashboard] Forçando recuperação COMPLETA do sistema...');
      
      toast.info('🔧 Executando recuperação completa do sistema...', { duration: 3000 });
      
      const result = await ConnectionStabilityService.forceRecovery(companyId);
      
      const orphanCount = result.orphanRecovery?.recovered || 0;
      const quarantineCount = result.quarantineRecovery?.recovered || 0;
      
      toast.success(`✅ Recuperação concluída! Órfãs: ${orphanCount}, Quarentena: ${quarantineCount}`, { duration: 6000 });
      console.log('[StabilityDashboard] Resultado da recuperação completa:', result);

    } catch (error) {
      console.error('[StabilityDashboard] Erro na recuperação completa:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`❌ Erro na recuperação completa: ${errorMessage}`, { duration: 6000 });
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
    toast.success('🛡️ Sistema de estabilidade OTIMIZADO iniciado!', { duration: 4000 });
    
    // Atualizar status
    const status = ConnectionStabilityService.getSystemStatus();
    setSystemStatus(status);
  };

  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-blue-500" />
            Sistema de Estabilidade Avançado
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Sistema robusto para manter conexões WhatsApp estáveis com monitoramento inteligente e recuperação automática
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Alerta informativo melhorado */}
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Sistema Otimizado:</strong> Timeouts aumentados, circuit breaker ativo, 
              monitoramento conservador (30min), quarentena de 24h, e auto-recovery a cada 1h. 
              Rate limiting protege o VPS de sobrecarga.
            </AlertDescription>
          </Alert>

          {/* Status Cards */}
          <VPSStatusCard 
            vpsHealth={systemStatus?.vpsHealth}
            systemStatus={systemStatus}
          />

          {/* Ações Principais */}
          <StabilityActionButtons
            isScanning={isScanning}
            isRecovering={isRecovering}
            onStartStability={handleStartStability}
            onVPSHealthCheck={handleVPSHealthCheck}
            onScanOrphans={handleScanOrphans}
            onForceRecovery={handleForceRecovery}
          />

          {/* Resultado da Última Busca */}
          <ScanResultsCard lastScanResult={lastScanResult} />

          {/* Explicação atualizada */}
          <div className="text-xs text-muted-foreground space-y-1 bg-muted/30 p-3 rounded">
            <p><strong>🛡️ Sistema de Estabilidade:</strong> Monitora VPS com circuit breaker e rate limiting</p>
            <p><strong>🏥 Verificar VPS:</strong> Health check completo com métricas de performance</p>
            <p><strong>🔍 Buscar Órfãs:</strong> Encontra e recupera instâncias perdidas automaticamente</p>
            <p><strong>🔧 Recuperação Completa:</strong> Restaura órfãs + limpa quarentena + reset sistema</p>
            <p><strong>⏱️ Configurações:</strong> Timeout 30s, monitoramento 30min, quarentena 24h, auto-recovery 1h</p>
          </div>
        </CardContent>
      </Card>

      {/* Dashboard de saúde do sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Monitoramento do Sistema</CardTitle>
          <p className="text-sm text-muted-foreground">
            Status detalhado dos componentes de estabilidade
          </p>
        </CardHeader>
        <CardContent>
          <SystemHealthDashboard />
        </CardContent>
      </Card>
    </div>
  );
}
