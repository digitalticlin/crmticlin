
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Play, 
  Settings, 
  Download, 
  RotateCcw, 
  Loader2,
  Smartphone,
  Wrench,
  Archive,
  PowerOff
} from "lucide-react";

interface VPSActionsCardProps {
  isServerOnline: boolean;
  operationState: {
    isInstalling: boolean;
    isApplyingFixes: boolean;
    isBackingUp: boolean;
    isRestarting: boolean;
  };
  onInstallWhatsApp: () => void;
  onApplyFixes: () => void;
  onCreateBackup: () => void;
  onRestartVPS: () => void;
}

export const VPSActionsCard = ({
  isServerOnline,
  operationState,
  onInstallWhatsApp,
  onApplyFixes,
  onCreateBackup,
  onRestartVPS
}: VPSActionsCardProps) => {
  
  return (
    <Card className="border-gray-200">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg text-gray-900">Ações Rápidas</CardTitle>
        <p className="text-sm text-gray-600">
          Clique nos botões abaixo para gerenciar seu servidor
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Ação Principal - Instalar WhatsApp */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 text-sm">📱 WhatsApp Web</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={onInstallWhatsApp}
              disabled={operationState.isInstalling || !isServerOnline}
              className="h-16 flex flex-col gap-1 bg-green-600 hover:bg-green-700"
              size="lg"
            >
              {operationState.isInstalling ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Instalando...</span>
                </>
              ) : (
                <>
                  <Smartphone className="h-5 w-5" />
                  <span className="text-xs">Instalar WhatsApp</span>
                </>
              )}
            </Button>

            <Button 
              onClick={onApplyFixes}
              disabled={operationState.isApplyingFixes || !isServerOnline}
              variant="outline"
              className="h-16 flex flex-col gap-1"
              size="lg"
            >
              {operationState.isApplyingFixes ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Corrigindo...</span>
                </>
              ) : (
                <>
                  <Wrench className="h-5 w-5" />
                  <span className="text-xs">Corrigir Problemas</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Ações de Manutenção */}
        <div className="space-y-3">
          <h4 className="font-medium text-gray-900 text-sm">🔧 Manutenção</h4>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              onClick={onCreateBackup}
              disabled={operationState.isBackingUp || !isServerOnline}
              variant="outline"
              className="h-16 flex flex-col gap-1"
              size="lg"
            >
              {operationState.isBackingUp ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Salvando...</span>
                </>
              ) : (
                <>
                  <Archive className="h-5 w-5" />
                  <span className="text-xs">Fazer Backup</span>
                </>
              )}
            </Button>

            <Button 
              onClick={onRestartVPS}
              disabled={operationState.isRestarting}
              variant="destructive"
              className="h-16 flex flex-col gap-1"
              size="lg"
            >
              {operationState.isRestarting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span className="text-xs">Reiniciando...</span>
                </>
              ) : (
                <>
                  <PowerOff className="h-5 w-5" />
                  <span className="text-xs">Reiniciar Servidor</span>
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Explicações dos Botões */}
        <div className="bg-gray-50 p-3 rounded-lg space-y-2">
          <h5 className="font-medium text-gray-900 text-sm">💡 O que cada botão faz:</h5>
          <div className="space-y-1 text-xs text-gray-600">
            <p><strong>Instalar WhatsApp:</strong> Coloca o WhatsApp funcionando no servidor</p>
            <p><strong>Corrigir Problemas:</strong> Resolve erros de conexão</p>
            <p><strong>Fazer Backup:</strong> Salva uma cópia de segurança</p>
            <p><strong>Reiniciar Servidor:</strong> Liga/desliga o servidor completamente</p>
          </div>
        </div>

        {!isServerOnline && (
          <div className="bg-orange-50 border border-orange-200 p-3 rounded-lg">
            <p className="text-sm text-orange-700">
              ⚠️ <strong>Servidor Offline:</strong> Ligue o servidor primeiro para usar essas funções
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
