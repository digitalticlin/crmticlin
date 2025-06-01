
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  RefreshCw, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  Trash2
} from "lucide-react";
import { VPSAuditService, AuditResult } from "@/services/whatsapp/services/vpsAuditService";
import { toast } from "sonner";
import { useCompanyData } from "@/hooks/useCompanyData";

export function VPSMonitoringPanel() {
  const { companyId } = useCompanyData();
  const [auditResult, setAuditResult] = useState<AuditResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCleaningUp, setIsCleaningUp] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const performAudit = async () => {
    setIsLoading(true);
    try {
      const result = await VPSAuditService.performAudit(companyId);
      
      if (result.success) {
        setAuditResult(result.data);
        
        if (result.data.discrepancies.length > 0 || result.data.orphanedVPS.length > 0) {
          toast.warning(`Audit concluído: ${result.data.discrepancies.length} discrepâncias encontradas`);
        } else {
          toast.success('Audit concluído: Tudo sincronizado corretamente');
        }
      } else {
        toast.error(`Erro no audit: ${result.error}`);
      }
    } catch (error) {
      console.error('Error performing audit:', error);
      toast.error('Erro ao realizar audit');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanupOrphanedVPS = async () => {
    if (!auditResult?.orphanedVPS.length) return;

    setIsCleaningUp(true);
    try {
      const instanceIds = auditResult.orphanedVPS.map(vps => vps.instanceId);
      const result = await VPSAuditService.cleanupOrphanedVPS(instanceIds);
      
      if (result.success) {
        toast.success(`Limpeza concluída: ${result.data.successful} instâncias removidas`);
        await performAudit(); // Refresh data
      } else {
        toast.error(`Erro na limpeza: ${result.error}`);
      }
    } catch (error) {
      console.error('Error cleaning up:', error);
      toast.error('Erro ao limpar instâncias órfãs');
    } finally {
      setIsCleaningUp(false);
    }
  };

  const forceSyncDiscrepancies = async () => {
    if (!auditResult?.discrepancies.length) return;

    setIsSyncing(true);
    try {
      const instanceIds = auditResult.discrepancies
        .filter(d => d.instance.vps_instance_id)
        .map(d => d.instance.vps_instance_id);
      
      const result = await VPSAuditService.forceSyncInstances(instanceIds);
      
      if (result.success) {
        toast.success('Sincronização forçada concluída');
        await performAudit(); // Refresh data
      } else {
        toast.error(`Erro na sincronização: ${result.error}`);
      }
    } catch (error) {
      console.error('Error force syncing:', error);
      toast.error('Erro ao forçar sincronização');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    performAudit();
  }, [companyId]);

  const getStatusBadge = (status: string, isVPS = false) => {
    if (isVPS) {
      switch (status) {
        case 'CONNECTED':
          return <Badge className="bg-green-500 text-white">Conectado</Badge>;
        case 'CONNECTING':
          return <Badge className="bg-yellow-500 text-white">Conectando</Badge>;
        default:
          return <Badge className="bg-red-500 text-white">{status}</Badge>;
      }
    } else {
      switch (status) {
        case 'ready':
        case 'open':
          return <Badge className="bg-green-500 text-white">Conectado</Badge>;
        case 'connecting':
        case 'waiting_scan':
          return <Badge className="bg-yellow-500 text-white">Conectando</Badge>;
        case 'disconnected':
          return <Badge className="bg-red-500 text-white">Desconectado</Badge>;
        default:
          return <Badge className="bg-gray-500 text-white">{status}</Badge>;
      }
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <RefreshCw className="h-5 w-5" />
              Monitor VPS WhatsApp
            </CardTitle>
            <Button
              onClick={performAudit}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Atualizar Audit
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          {!auditResult ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-muted-foreground" />
              <p>Realizando audit...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Resumo */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">
                    {auditResult.vpsConnections.length}
                  </div>
                  <div className="text-sm text-blue-600">Conexões VPS</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {auditResult.dbInstances.length}
                  </div>
                  <div className="text-sm text-green-600">Instâncias DB</div>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl font-bold text-orange-600">
                    {auditResult.orphanedVPS.length}
                  </div>
                  <div className="text-sm text-orange-600">Órfãs VPS</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">
                    {auditResult.discrepancies.length}
                  </div>
                  <div className="text-sm text-red-600">Discrepâncias</div>
                </div>
              </div>

              {/* Alertas */}
              {auditResult.orphanedVPS.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      {auditResult.orphanedVPS.length} instâncias órfãs encontradas no VPS (sem correspondência no banco)
                    </span>
                    <Button
                      onClick={cleanupOrphanedVPS}
                      disabled={isCleaningUp}
                      size="sm"
                      variant="destructive"
                    >
                      {isCleaningUp ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4 mr-1" />
                      )}
                      Limpar
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {auditResult.discrepancies.length > 0 && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription className="flex items-center justify-between">
                    <span>
                      {auditResult.discrepancies.length} discrepâncias de status encontradas
                    </span>
                    <Button
                      onClick={forceSyncDiscrepancies}
                      disabled={isSyncing}
                      size="sm"
                      variant="outline"
                    >
                      {isSyncing ? (
                        <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                      ) : (
                        <RefreshCw className="h-4 w-4 mr-1" />
                      )}
                      Sincronizar
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Tabela de Comparação */}
              <div className="border rounded-lg">
                <div className="p-4 border-b bg-muted/50">
                  <h3 className="font-medium">Comparação VPS vs Banco de Dados</h3>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3">Instance ID</th>
                        <th className="text-left p-3">Telefone</th>
                        <th className="text-left p-3">Status VPS</th>
                        <th className="text-left p-3">Status DB</th>
                        <th className="text-left p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditResult.dbInstances.map((dbInst) => {
                        const vpsConn = auditResult.vpsConnections.find(
                          vps => vps.instanceId === dbInst.vps_instance_id
                        );
                        
                        const hasDiscrepancy = auditResult.discrepancies.some(
                          d => d.instance.id === dbInst.id
                        );

                        return (
                          <tr key={dbInst.id} className={`border-b ${hasDiscrepancy ? 'bg-red-50' : ''}`}>
                            <td className="p-3 font-mono text-xs">
                              {dbInst.vps_instance_id?.substring(0, 20)}...
                            </td>
                            <td className="p-3">
                              {vpsConn?.phone || dbInst.phone || '-'}
                            </td>
                            <td className="p-3">
                              {vpsConn ? (
                                getStatusBadge(vpsConn.state, true)
                              ) : (
                                <Badge variant="secondary">Não encontrado</Badge>
                              )}
                            </td>
                            <td className="p-3">
                              {getStatusBadge(dbInst.web_status || dbInst.connection_status)}
                            </td>
                            <td className="p-3">
                              {hasDiscrepancy ? (
                                <XCircle className="h-4 w-4 text-red-500" />
                              ) : (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              )}
                            </td>
                          </tr>
                        );
                      })}
                      
                      {/* Instâncias órfãs do VPS */}
                      {auditResult.orphanedVPS.map((vpsConn) => (
                        <tr key={vpsConn.instanceId} className="border-b bg-orange-50">
                          <td className="p-3 font-mono text-xs">
                            {vpsConn.instanceId.substring(0, 20)}...
                          </td>
                          <td className="p-3">{vpsConn.phone || '-'}</td>
                          <td className="p-3">{getStatusBadge(vpsConn.state, true)}</td>
                          <td className="p-3">
                            <Badge variant="secondary">Não encontrado</Badge>
                          </td>
                          <td className="p-3">
                            <XCircle className="h-4 w-4 text-orange-500" />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {auditResult.discrepancies.length === 0 && auditResult.orphanedVPS.length === 0 && (
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    ✅ Todas as instâncias estão sincronizadas corretamente entre VPS e banco de dados
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
