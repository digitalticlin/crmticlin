
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  TestTube, 
  RefreshCw,
  Play,
  Trash2,
  Clock,
  CheckCircle,
  MessageSquare
} from "lucide-react";

interface InstanceCreationTestControlsProps {
  testInstanceName: string;
  setTestInstanceName: (name: string) => void;
  isRunning: boolean;
  qrCodePolling: boolean;
  createdInstanceId: string | null;
  onRunTest: () => void;
  onCleanupTest: () => void;
}

export const InstanceCreationTestControls = ({
  testInstanceName,
  setTestInstanceName,
  isRunning,
  qrCodePolling,
  createdInstanceId,
  onRunTest,
  onCleanupTest
}: InstanceCreationTestControlsProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5 text-purple-600" />
          Teste de Criação de Instância WhatsApp (CORREÇÃO ROBUSTA)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <MessageSquare className="h-4 w-4" />
          <AlertDescription>
            <strong>CORREÇÃO ROBUSTA APLICADA:</strong> Este teste agora inclui validação robusta do polling QR Code,
            com retry inteligente, timeouts ajustados (10s), melhor tratamento de erros, e parâmetros corretos.
            O sistema agora é mais tolerante a timing da VPS e fornece feedback claro sobre o progresso.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="testInstanceName">Nome da Instância de Teste (opcional)</Label>
          <Input
            id="testInstanceName"
            value={testInstanceName}
            onChange={(e) => setTestInstanceName(e.target.value)}
            placeholder="Ex: teste_instancia_robusta_001"
          />
          <p className="text-xs text-muted-foreground">
            Se vazio, será gerado automaticamente
          </p>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={onRunTest}
            disabled={isRunning || qrCodePolling}
            className="flex-1"
          >
            {isRunning ? (
              <>
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                Executando Teste...
              </>
            ) : qrCodePolling ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-pulse" />
                Polling QR Code ROBUSTO...
              </>
            ) : (
              <>
                <Play className="h-4 w-4 mr-2" />
                Executar Teste ROBUSTO
              </>
            )}
          </Button>

          {createdInstanceId && (
            <Button 
              onClick={onCleanupTest}
              variant="outline"
              disabled={isRunning || qrCodePolling}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Limpar Teste
            </Button>
          )}
        </div>

        {createdInstanceId && (
          <Alert className="border-green-500 bg-green-50">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Instância de teste criada:</strong> {createdInstanceId}
              <br />
              <small>Lembre-se de remover após o teste</small>
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};
