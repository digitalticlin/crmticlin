
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Shield, AlertTriangle, CheckCircle, Search } from "lucide-react";
import { toast } from "sonner";
import { ConnectionStabilityService } from "@/hooks/whatsapp/services/connectionStabilityService";
import { OrphanInstanceRecoveryService } from "@/services/whatsapp/services/orphanInstanceRecoveryService";
import { StabilityService } from "@/services/whatsapp/services/stabilityService";
import { useCompanyData } from "@/hooks/useCompanyData";

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
    try {
      console.log('[StabilityDashboard] Iniciando busca por instâncias órfãs...');
      
      const result = await OrphanInstanceRecoveryService.findAndRecoverOrphanInstances(companyId);
      setLastScanResult(result);

      if (result.found.length === 0) {
        toast.success('Nenhuma instância órfã encontrada! 🎉');
      } else if (result.recovered > 0) {
        toast.success(`${result.recovered} instâncias órfãs recuperadas! ✅`);
      }

      if (result.errors.length > 0) {
        toast.error(`${result.errors.length} erros durante recuperação`);
        console.error('[StabilityDashboard] Erros:', result.errors);
      }

    } catch (error) {
      console.error('[StabilityDashboard] Erro na busca:', error);
      toast.error('Erro ao buscar instâncias órfãs');
    } finally {
      setIsScanning(false);
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
      
      const result = await ConnectionStabilityService.forceRecovery(companyId);
      
      toast.success('Recuperação forçada concluída!');
      console.log('[StabilityDashboard] Resultado da recuperação forçada:', result);

    } catch (error) {
      console.error('[StabilityDashboard] Erro na recuperação forçada:', error);
      toast.error('Erro na recuperação forçada');
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

      <CardContent className="space-y-4">
        {/* Status do Sistema */}
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Status do Sistema</h4>
            <div className="flex flex-wrap gap-2">
              <Badge variant={systemStatus?.recoveryActive ? "default" : "secondary"}>
                {systemStatus?.recoveryActive ? "Auto-recuperação Ativa" : "Auto-recuperação Inativa"}
              </Badge>
              <Badge variant={systemStatus?.stabilityActive ? "default" : "secondary"}>
                {systemStatus?.stabilityActive ? "Monitoramento Ativo" : "Monitoramento Inativo"}
              </Badge>
              <Badge variant={systemStatus?.removalDisabled ? "default" : "destructive"}>
                {systemStatus?.removalDisabled ? "Remoção Bloqueada" : "Remoção Permitida"}
              </Badge>
            </div>
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-sm">Instâncias em Quarentena</h4>
            <div className="text-sm text-muted-foreground">
              {systemStatus?.quarantinedInstances?.length || 0} instâncias em quarentena
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
              <CheckCircle className="h-4 w-4 text-green-500" />
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
                <div className="flex justify-between">
                  <span>Erros:</span>
                  <Badge variant="destructive">{lastScanResult.errors.length}</Badge>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Explicação */}
        <div className="text-xs text-muted-foreground space-y-1">
          <p><strong>Sistema de Estabilidade:</strong> Monitora e recupera conexões automaticamente</p>
          <p><strong>Buscar Órfãs:</strong> Encontra instâncias ativas na VPS mas perdidas no banco</p>
          <p><strong>Recuperação Forçada:</strong> Restaura todas as instâncias em quarentena</p>
        </div>
      </CardContent>
    </Card>
  );
}
