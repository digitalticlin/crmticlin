
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { 
  Terminal, 
  Download, 
  RotateCcw, 
  Settings, 
  Loader2,
  Play,
  Wrench
} from "lucide-react";
import { HostingerVPS } from "@/services/hostinger/hostingerApiService";

interface VPSOperationState {
  isLoading: boolean;
  isInstalling: boolean;
  isRestarting: boolean;
  isBackingUp: boolean;
  isApplyingFixes: boolean;
  isDeployingWhatsApp: boolean;
}

interface VPSActionsProps {
  selectedVPS: HostingerVPS;
  operationState: VPSOperationState;
  executeCommand: (command: string, description?: string) => Promise<any>;
  installWhatsAppServer: () => Promise<void>;
  applyWhatsAppFixes: () => Promise<void>;
  restartVPS: () => Promise<void>;
  createBackup: () => Promise<void>;
}

export const VPSActions = ({
  selectedVPS,
  operationState,
  executeCommand,
  installWhatsAppServer,
  applyWhatsAppFixes,
  restartVPS,
  createBackup
}: VPSActionsProps) => {
  const [customCommand, setCustomCommand] = useState("");

  const handleCustomCommand = async () => {
    if (!customCommand.trim()) return;
    await executeCommand(customCommand, `Comando personalizado: ${customCommand}`);
    setCustomCommand("");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Ações da VPS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* WhatsApp Actions */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">WhatsApp Web.js</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button
              onClick={installWhatsAppServer}
              disabled={operationState.isInstalling}
              variant="outline"
              className="gap-2"
            >
              {operationState.isInstalling ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {operationState.isInstalling ? 'Instalando...' : 'Instalar WhatsApp'}
            </Button>
            
            <Button
              onClick={applyWhatsAppFixes}
              disabled={operationState.isApplyingFixes}
              variant="outline"
              className="gap-2"
            >
              {operationState.isApplyingFixes ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wrench className="h-4 w-4" />
              )}
              {operationState.isApplyingFixes ? 'Aplicando...' : 'Aplicar Correções'}
            </Button>
          </div>
        </div>

        {/* VPS Management */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Gerenciamento VPS</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <Button
              onClick={restartVPS}
              disabled={operationState.isRestarting}
              variant="outline"
              className="gap-2"
            >
              {operationState.isRestarting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4" />
              )}
              {operationState.isRestarting ? 'Reiniciando...' : 'Reiniciar VPS'}
            </Button>
            
            <Button
              onClick={createBackup}
              disabled={operationState.isBackingUp}
              variant="outline"
              className="gap-2"
            >
              {operationState.isBackingUp ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Download className="h-4 w-4" />
              )}
              {operationState.isBackingUp ? 'Criando...' : 'Criar Backup'}
            </Button>
          </div>
        </div>

        {/* Custom Command */}
        <div className="space-y-3">
          <h4 className="font-medium text-sm text-gray-700">Comando Personalizado</h4>
          <div className="flex gap-2">
            <Input
              placeholder="Digite um comando..."
              value={customCommand}
              onChange={(e) => setCustomCommand(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleCustomCommand()}
            />
            <Button
              onClick={handleCustomCommand}
              disabled={operationState.isLoading || !customCommand.trim()}
              className="gap-2"
            >
              <Terminal className="h-4 w-4" />
              Executar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
