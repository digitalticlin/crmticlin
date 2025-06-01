
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Info } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ConnectionStabilityService } from "@/hooks/whatsapp/services/connectionStabilityService";
import { OrphanInstanceRecoveryService } from "@/services/whatsapp/services/orphanInstanceRecoveryService";
import { VPSHealthService } from "@/services/whatsapp/services/vpsHealthService";
import { useCompanyData } from "@/hooks/useCompanyData";
import { VPSStatusCard } from "./stability/VPSStatusCard";
import { StabilityActionButtons } from "./stability/StabilityActionButtons";
import { ScanResultsCard } from "./stability/ScanResultsCard";

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

      <CardContent className="space-y-6">
        {/* Alerta informativo */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <strong>Diagnóstico:</strong> Use "Buscar Órfãs" para encontrar conexões ativas na VPS que sumiram do banco de dados. 
            O sistema verifica automaticamente a saúde do VPS antes de cada operação.
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
