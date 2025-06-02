
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Server, 
  Play, 
  RotateCcw, 
  HardDrive, 
  Activity, 
  Terminal,
  Download,
  Settings,
  CheckCircle,
  AlertCircle,
  Loader2
} from "lucide-react";
import { useHostingerVPS } from "@/hooks/hostinger/useHostingerVPS";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";

export const HostingerVPSPanel = () => {
  const {
    vpsList,
    selectedVPS,
    setSelectedVPS,
    loading,
    operationState,
    logs,
    whatsappStatus,
    
    loadVPSList,
    installWhatsAppServer,
    applyWhatsAppFixes,
    restartVPS,
    createBackup,
    loadLogs
  } = useHostingerVPS();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'running':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Online</Badge>;
      case 'stopped':
        return <Badge variant="destructive"><AlertCircle className="h-3 w-3 mr-1" />Offline</Badge>;
      case 'starting':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Iniciando</Badge>;
      case 'stopping':
        return <Badge variant="secondary"><Loader2 className="h-3 w-3 mr-1 animate-spin" />Parando</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatMemory = (mb: number) => {
    return mb >= 1024 ? `${(mb / 1024).toFixed(1)}GB` : `${mb}MB`;
  };

  const formatStorage = (gb: number) => {
    return `${gb}GB`;
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin mr-2" />
          <span>Carregando VPS da Hostinger...</span>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Seleção de VPS */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              <CardTitle>Gerenciamento VPS Hostinger</CardTitle>
            </div>
            <Button onClick={loadVPSList} variant="outline" size="sm">
              <RotateCcw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          </div>
          <CardDescription>
            Controle total da VPS via API oficial da Hostinger
          </CardDescription>
        </CardHeader>
        <CardContent>
          {vpsList.length > 0 ? (
            <Select 
              value={selectedVPS?.id || ''} 
              onValueChange={(value) => {
                const vps = vpsList.find(v => v.id === value);
                if (vps) setSelectedVPS(vps);
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecione uma VPS" />
              </SelectTrigger>
              <SelectContent>
                {vpsList.map((vps) => (
                  <SelectItem key={vps.id} value={vps.id}>
                    <div className="flex items-center gap-2">
                      <span>{vps.name}</span>
                      <span className="text-muted-foreground">({vps.ip_address})</span>
                      {getStatusBadge(vps.status)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              Nenhuma VPS encontrada na sua conta Hostinger
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVPS && (
        <>
          {/* Informações da VPS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5" />
                {selectedVPS.name}
              </CardTitle>
              <div className="flex items-center gap-4">
                {getStatusBadge(selectedVPS.status)}
                <span className="text-sm text-muted-foreground">IP: {selectedVPS.ip_address}</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{selectedVPS.cpu_cores}</div>
                  <div className="text-sm text-muted-foreground">CPU Cores</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{formatMemory(selectedVPS.memory)}</div>
                  <div className="text-sm text-muted-foreground">RAM</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{formatStorage(selectedVPS.storage)}</div>
                  <div className="text-sm text-muted-foreground">Storage</div>
                </div>
                <div className="text-center p-3 bg-gray-50 rounded-lg">
                  <div className="text-sm font-medium text-gray-600">{selectedVPS.os}</div>
                  <div className="text-sm text-muted-foreground">Sistema</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Ações da VPS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Ações Rápidas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Button 
                  onClick={installWhatsAppServer}
                  disabled={operationState.isInstalling || selectedVPS.status !== 'running'}
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  {operationState.isInstalling ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Play className="h-5 w-5" />
                  )}
                  <span className="text-xs">
                    {operationState.isInstalling ? 'Instalando...' : 'Instalar WhatsApp'}
                  </span>
                </Button>

                <Button 
                  onClick={applyWhatsAppFixes}
                  disabled={operationState.isApplyingFixes || selectedVPS.status !== 'running'}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  {operationState.isApplyingFixes ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Settings className="h-5 w-5" />
                  )}
                  <span className="text-xs">
                    {operationState.isApplyingFixes ? 'Aplicando...' : 'Aplicar Correções'}
                  </span>
                </Button>

                <Button 
                  onClick={createBackup}
                  disabled={operationState.isBackingUp || selectedVPS.status !== 'running'}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  {operationState.isBackingUp ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Download className="h-5 w-5" />
                  )}
                  <span className="text-xs">
                    {operationState.isBackingUp ? 'Criando...' : 'Backup'}
                  </span>
                </Button>

                <Button 
                  onClick={restartVPS}
                  disabled={operationState.isRestarting}
                  variant="destructive"
                  className="flex flex-col items-center gap-2 h-auto py-4"
                >
                  {operationState.isRestarting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <RotateCcw className="h-5 w-5" />
                  )}
                  <span className="text-xs">
                    {operationState.isRestarting ? 'Reiniciando...' : 'Reiniciar VPS'}
                  </span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Status WhatsApp */}
          {whatsappStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Status WhatsApp Web.js
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-32 w-full">
                  <pre className="text-xs bg-gray-50 p-3 rounded">
                    {whatsappStatus.pm2_status || 'Nenhum status disponível'}
                  </pre>
                </ScrollArea>
                <div className="mt-3 flex gap-2">
                  <Button 
                    onClick={() => loadLogs(50)} 
                    variant="outline" 
                    size="sm"
                  >
                    <HardDrive className="h-4 w-4 mr-1" />
                    Carregar Logs
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Logs da VPS */}
          {logs && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Terminal className="h-5 w-5" />
                  Logs do Sistema
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 w-full">
                  <pre className="text-xs bg-gray-900 text-gray-100 p-4 rounded">
                    {logs}
                  </pre>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};
