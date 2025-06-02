
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Server, 
  RotateCcw, 
  Loader2,
  CloudCog
} from "lucide-react";
import { useHostingerVPS } from "@/hooks/hostinger/useHostingerVPS";
import { VPSHealthCard } from "./VPSHealthCard";
import { WhatsAppStatusCard } from "./WhatsAppStatusCard";
import { VPSActionsCard } from "./VPSActionsCard";
import { VPSMonitoringCard } from "./VPSMonitoringCard";

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

  if (loading) {
    return (
      <Card className="border-blue-200">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-1">Conectando ao seu servidor...</h3>
            <p className="text-gray-500">Aguarde enquanto verificamos seu VPS</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const isServerOnline = selectedVPS?.status === 'running';

  return (
    <div className="space-y-6">
      {/* Cabeçalho com Seleção de VPS */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <CloudCog className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-xl text-blue-900">Painel do Servidor VPS</CardTitle>
                <CardDescription className="text-blue-700">
                  Gerencie seu servidor e WhatsApp de forma simples e visual
                </CardDescription>
              </div>
            </div>
            <Button onClick={loadVPSList} variant="outline" size="sm" className="border-blue-300">
              <RotateCcw className="h-4 w-4 mr-1" />
              Atualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {vpsList.length > 0 ? (
            <div className="space-y-2">
              <label className="text-sm font-medium text-blue-900">Escolha seu servidor:</label>
              <Select 
                value={selectedVPS?.id || ''} 
                onValueChange={(value) => {
                  const vps = vpsList.find(v => v.id === value);
                  if (vps) setSelectedVPS(vps);
                }}
              >
                <SelectTrigger className="w-full bg-white">
                  <SelectValue placeholder="Clique aqui para selecionar seu servidor VPS" />
                </SelectTrigger>
                <SelectContent>
                  {vpsList.map((vps) => (
                    <SelectItem key={vps.id} value={vps.id}>
                      <div className="flex items-center gap-2">
                        <Server className="h-4 w-4" />
                        <span className="font-medium">{vps.name}</span>
                        <span className="text-gray-500">({vps.ip_address})</span>
                        <span className={`inline-block w-2 h-2 rounded-full ${vps.status === 'running' ? 'bg-green-500' : 'bg-gray-400'}`}></span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          ) : (
            <div className="text-center py-6 bg-white rounded-lg border border-blue-200">
              <Server className="h-12 w-12 text-gray-400 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Nenhum servidor encontrado</h3>
              <p className="text-gray-500">Verifique sua conta Hostinger ou tente atualizar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedVPS && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Coluna Esquerda */}
          <div className="space-y-6">
            <VPSHealthCard vps={selectedVPS} />
            <VPSActionsCard
              isServerOnline={isServerOnline}
              operationState={operationState}
              onInstallWhatsApp={installWhatsAppServer}
              onApplyFixes={applyWhatsAppFixes}
              onCreateBackup={createBackup}
              onRestartVPS={restartVPS}
            />
          </div>

          {/* Coluna Direita */}
          <div className="space-y-6">
            <WhatsAppStatusCard 
              whatsappStatus={whatsappStatus} 
              isServerOnline={isServerOnline} 
            />
            <VPSMonitoringCard
              logs={logs}
              whatsappStatus={whatsappStatus}
              isServerOnline={isServerOnline}
              onLoadLogs={loadLogs}
            />
          </div>
        </div>
      )}

      {/* Rodapé Informativo */}
      <Card className="border-gray-200 bg-gray-50">
        <CardContent className="py-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <h4 className="font-medium text-gray-900 mb-1">🚀 Fácil de Usar</h4>
              <p className="text-sm text-gray-600">Interface simples, sem comandos complicados</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">🔄 Automático</h4>
              <p className="text-sm text-gray-600">WhatsApp sempre conectado, 24 horas por dia</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-1">🛡️ Seguro</h4>
              <p className="text-sm text-gray-600">Backups automáticos e monitoramento constante</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
