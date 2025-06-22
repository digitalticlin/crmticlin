
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Terminal, 
  Copy, 
  AlertTriangle,
  CheckCircle,
  Server
} from "lucide-react";
import { toast } from "sonner";

export const VPSSSHCommands = () => {
  const copyToClipboard = (text: string, description: string) => {
    navigator.clipboard.writeText(text).then(() => {
      toast.success(`${description} copiado para a área de transferência!`);
    });
  };

  const commands = [
    {
      title: "1. Conectar via SSH",
      description: "Comando para conectar na VPS",
      command: "ssh root@31.97.24.222",
      category: "connection"
    },
    {
      title: "2. Verificar Status do Servidor WhatsApp",
      description: "Verificar se o servidor na porta 3002 está rodando",
      command: "curl -s http://localhost:3002/health | jq .",
      category: "status"
    },
    {
      title: "3. Listar Instâncias Ativas",
      description: "Ver todas as instâncias WhatsApp ativas na VPS",
      command: "curl -s -H 'Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3' http://localhost:3002/instances | jq .",
      category: "instances"
    },
    {
      title: "4. Status Detalhado do Servidor",
      description: "Informações completas sobre o servidor",
      command: "curl -s http://localhost:3002/status | jq .",
      category: "status"
    },
    {
      title: "5. Verificar Processos Node.js/PM2",
      description: "Ver todos os processos relacionados ao WhatsApp",
      command: "ps aux | grep -E '(node|pm2|whatsapp)' | grep -v grep",
      category: "processes"
    },
    {
      title: "6. Verificar Porta 3002",
      description: "Confirmar que a porta 3002 está escutando",
      command: "netstat -tlnp | grep :3002",
      category: "network"
    },
    {
      title: "7. Logs do Servidor (se PM2)",
      description: "Ver logs em tempo real do servidor WhatsApp",
      command: "pm2 logs whatsapp-server --lines 50",
      category: "logs"
    },
    {
      title: "8. Teste de Conectividade Interna",
      description: "Testar se o servidor responde internamente",
      command: "wget -qO- http://localhost:3002/health 2>/dev/null || echo 'Servidor não responde'",
      category: "connectivity"
    }
  ];

  const getCategoryColor = (category: string) => {
    const colors = {
      connection: "bg-blue-100 text-blue-800",
      status: "bg-green-100 text-green-800", 
      instances: "bg-purple-100 text-purple-800",
      processes: "bg-orange-100 text-orange-800",
      network: "bg-indigo-100 text-indigo-800",
      logs: "bg-gray-100 text-gray-800",
      connectivity: "bg-cyan-100 text-cyan-800"
    };
    return colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  return (
    <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Terminal className="h-5 w-5 text-blue-500" />
          Comandos SSH para Verificação Manual da VPS
        </CardTitle>
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <Server className="h-4 w-4" />
          <span>IP: 31.97.24.222 | Porta WhatsApp: 3002</span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-yellow-800">Antes de começar:</h4>
              <p className="text-sm text-yellow-700 mt-1">
                Certifique-se de ter acesso SSH à VPS e que o jq está instalado para formatação JSON.
                Se o jq não estiver disponível, remova o "| jq ." dos comandos.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          {commands.map((cmd, index) => (
            <div key={index} className="border border-gray-200 rounded-lg p-4 bg-white/50">
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium text-gray-900">{cmd.title}</h4>
                    <Badge className={getCategoryColor(cmd.category)}>
                      {cmd.category}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{cmd.description}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(cmd.command, cmd.title)}
                  className="gap-1"
                >
                  <Copy className="h-3 w-3" />
                  Copiar
                </Button>
              </div>
              
              <div className="bg-gray-900 rounded p-3 font-mono text-sm">
                <code className="text-green-400">{cmd.command}</code>
              </div>
            </div>
          ))}
        </div>

        <Separator />

        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-800">Resultado Esperado:</h4>
              <div className="text-sm text-green-700 mt-1 space-y-1">
                <p>• <strong>Health Check:</strong> {"{ success: true, status: 'online', activeInstances: X }"}</p>
                <p>• <strong>Instâncias:</strong> Array com objetos contendo instanceId, status, sessionName</p>
                <p>• <strong>Porta 3002:</strong> Deve mostrar processo escutando na porta</p>
              </div>
            </div>
          </div>
        </div>

        <div className="text-xs text-gray-500 mt-4">
          <p><strong>Dica:</strong> Execute os comandos na ordem listada para diagnóstico completo.</p>
          <p><strong>Comparação:</strong> Compare os resultados com os logs da Edge Function auto_sync_instances.</p>
        </div>
      </CardContent>
    </Card>
  );
};
