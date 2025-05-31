
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Terminal, Copy } from "lucide-react";
import { toast } from "sonner";

interface VPSConfig {
  host: string;
  port: number;
  sshPort: number;
  type: string;
}

interface VPSConfigCardProps {
  config: VPSConfig;
  onTest: () => void;
  testing: boolean;
}

export const VPSConfigCard = ({ config, onTest, testing }: VPSConfigCardProps) => {
  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${type} copiado para a área de transferência!`);
  };

  const openSSH = () => {
    const sshCommand = `ssh root@${config.host}`;
    copyToClipboard(sshCommand, "Comando SSH");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Server className="h-5 w-5 text-blue-600" />
          <CardTitle>Configuração VPS Ubuntu 4GB</CardTitle>
        </div>
        <CardDescription>
          Teste de conectividade e instalação do servidor WhatsApp Web.js
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-3">Informações da VPS:</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">IP:</span> {config.host}
            </div>
            <div>
              <span className="font-medium">Porta:</span> {config.port}
            </div>
            <div>
              <span className="font-medium">SSH:</span> root@{config.host}
            </div>
            <div>
              <span className="font-medium">Tipo:</span> {config.type}
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button 
            onClick={onTest} 
            disabled={testing}
            className="flex-1"
          >
            {testing ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Testando Conectividade...
              </>
            ) : (
              <>
                <Terminal className="h-4 w-4 mr-2" />
                Testar Conectividade
              </>
            )}
          </Button>
          
          <Button 
            onClick={openSSH} 
            variant="outline"
          >
            <Copy className="h-4 w-4 mr-2" />
            SSH
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
