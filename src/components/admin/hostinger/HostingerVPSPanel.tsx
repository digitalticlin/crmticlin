
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useHostingerVPS } from "@/hooks/hostinger/useHostingerVPS";
import { WhatsAppStatusCard } from "./WhatsAppStatusCard";
import { VPSSelector } from "./VPSSelector";
import { VPSActions } from "./VPSActions";
import { VPSLogs } from "./VPSLogs";
import { DirectDeployButton } from "./DirectDeployButton";
import { Server, Loader2, Zap, AlertTriangle } from "lucide-react";

export const HostingerVPSPanel = () => {
  const {
    vpsList,
    selectedVPS,
    setSelectedVPS,
    loading,
    operationState,
    logs,
    whatsappStatus,
    serverHealth,
    loadVPSList,
    deployWhatsAppServer,
    checkServerHealth,
    executeCommand,
    installWhatsAppServer,
    applyWhatsAppFixes,
    restartVPS,
    createBackup,
    loadLogs
  } = useHostingerVPS();

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-2">Carregando VPS...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Deploy Direto - Sempre visível */}
      <DirectDeployButton />

      {/* API Status Warning - Removido o alerta de erro 530 */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            <CardTitle className="text-blue-800">Deploy Inteligente</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <p className="text-sm text-blue-700">
              ✅ <strong>Deploy via SSH direto</strong> - Método mais confiável
            </p>
            <p className="text-xs text-blue-600">
              • Instala automaticamente Node.js, PM2 e dependências<br/>
              • Não depende da API Hostinger<br/>
              • Servidor permanente com auto-restart configurado
            </p>
          </div>
        </CardContent>
      </Card>

      {/* VPS Selection - Pode falhar devido a problemas de API */}
      <VPSSelector
        vpsList={vpsList}
        selectedVPS={selectedVPS}
        setSelectedVPS={setSelectedVPS}
        onRefresh={loadVPSList}
        loading={loading}
      />

      {selectedVPS && (
        <>
          {/* Quick Deploy Section */}
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-green-600" />
                  <CardTitle className="text-green-800">Deploy Rápido</CardTitle>
                </div>
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Servidor Permanente
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-green-800 mb-1">
                    Servidor WhatsApp.js Permanente
                  </h3>
                  <p className="text-sm text-green-700">
                    Deploy com PM2, auto-restart e múltiplas instâncias
                  </p>
                </div>
                <Button
                  onClick={deployWhatsAppServer}
                  disabled={operationState.isDeployingWhatsApp}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {operationState.isDeployingWhatsApp ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Implantando...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Implantar Servidor
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* WhatsApp Status */}
          <WhatsAppStatusCard
            whatsappStatus={whatsappStatus}
            serverHealth={serverHealth}
            onDeploy={deployWhatsAppServer}
            onRefresh={checkServerHealth}
            isDeploying={operationState.isDeployingWhatsApp}
          />

          {/* VPS Actions */}
          <VPSActions
            selectedVPS={selectedVPS}
            operationState={operationState}
            executeCommand={executeCommand}
            installWhatsAppServer={installWhatsAppServer}
            applyWhatsAppFixes={applyWhatsAppFixes}
            restartVPS={restartVPS}
            createBackup={createBackup}
          />

          {/* VPS Logs */}
          <VPSLogs
            logs={logs}
            loadLogs={loadLogs}
          />
        </>
      )}
    </div>
  );
};
