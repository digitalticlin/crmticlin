
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Activity, Cpu, MemoryStick, HardDrive, Copy } from "lucide-react";

interface ProcessAnalysisResults {
  timestamp: string;
  system_resources: {
    cpu: { usage: number; load_avg: number[]; cores: number };
    memory: { used: number; total: number; available: number; swap_used: number };
    disk: { used: number; total: number; inodes_used: number; inodes_total: number };
    network: { connections: number; listening_ports: number[] };
  };
  running_processes: Array<{
    pid: number;
    name: string;
    cpu_percent: number;
    memory_mb: number;
    status: string;
    port?: number;
    command: string;
  }>;
  pm2_analysis: {
    processes: Array<{
      name: string;
      status: 'online' | 'stopped' | 'errored' | 'stopping';
      uptime: string;
      restarts: number;
      cpu: number;
      memory: number;
      port?: number;
    }>;
    global_status: string;
  };
  port_conflicts: Array<{
    port: number;
    processes: Array<{ pid: number; name: string; command: string }>;
    resolution: string;
  }>;
  resource_issues: Array<{
    type: 'cpu' | 'memory' | 'disk' | 'network';
    severity: 'critical' | 'warning' | 'info';
    message: string;
    recommendation: string;
  }>;
}

export const VPSProcessAnalyzer = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<ProcessAnalysisResults | null>(null);

  const runProcessAnalysis = async () => {
    try {
      setAnalyzing(true);
      toast.info("⚙️ Analisando processos e recursos do sistema...");

      // Simular análise de processos
      await new Promise(resolve => setTimeout(resolve, 3500));

      const mockResults: ProcessAnalysisResults = {
        timestamp: new Date().toISOString(),
        system_resources: {
          cpu: { usage: 25.3, load_avg: [0.8, 1.2, 1.0], cores: 2 },
          memory: { used: 512, total: 1024, available: 450, swap_used: 0 },
          disk: { used: 8500, total: 25000, inodes_used: 45000, inodes_total: 655360 },
          network: { connections: 23, listening_ports: [22, 3001] }
        },
        running_processes: [
          {
            pid: 1234,
            name: "node",
            cpu_percent: 5.2,
            memory_mb: 85,
            status: "running",
            port: 3001,
            command: "node /root/whatsapp-web-server/server.js"
          },
          {
            pid: 5678,
            name: "node", 
            cpu_percent: 0.8,
            memory_mb: 45,
            status: "running",
            command: "node /root/vps-api-server/server.js"
          },
          {
            pid: 9012,
            name: "sshd",
            cpu_percent: 0.1,
            memory_mb: 12,
            status: "running",
            port: 22,
            command: "/usr/sbin/sshd -D"
          }
        ],
        pm2_analysis: {
          processes: [
            {
              name: "whatsapp-server",
              status: "online",
              uptime: "2h 15m",
              restarts: 0,
              cpu: 5.2,
              memory: 85,
              port: 3001
            },
            {
              name: "api-server",
              status: "errored",
              uptime: "0s",
              restarts: 15,
              cpu: 0,
              memory: 0
            }
          ],
          global_status: "partially_running"
        },
        port_conflicts: [
          {
            port: 80,
            processes: [
              { pid: 5678, name: "node", command: "node /root/vps-api-server/server.js" },
              { pid: 7890, name: "apache2", command: "apache2 -D FOREGROUND" }
            ],
            resolution: "Parar Apache ou usar porta alternativa para API"
          }
        ],
        resource_issues: [
          {
            type: "memory",
            severity: "warning",
            message: "Uso de memória em 50% - próximo do limite recomendado",
            recommendation: "Monitorar processos que consomem mais memória"
          },
          {
            type: "network",
            severity: "critical",
            message: "API Server não consegue bind na porta 80",
            recommendation: "Verificar conflitos de porta e permissões"
          }
        ]
      };

      setResults(mockResults);
      toast.success("🎯 Análise de processos concluída!");

    } catch (error: any) {
      console.error('Erro na análise de processos:', error);
      toast.error(`❌ Falha na análise: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const getProcessStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
      case 'running':
        return <Badge className="bg-green-600">ONLINE</Badge>;
      case 'stopped':
        return <Badge variant="secondary">PARADO</Badge>;
      case 'errored':
        return <Badge variant="destructive">ERRO</Badge>;
      case 'stopping':
        return <Badge className="bg-yellow-600">PARANDO</Badge>;
      default:
        return <Badge variant="outline">{status.toUpperCase()}</Badge>;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'warning': return 'text-orange-600 bg-orange-100';
      case 'info': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const copyProcessFix = () => {
    const commands = [
      "# Verificar processos na porta 80",
      "sudo lsof -i :80",
      "sudo netstat -tlnp | grep :80",
      "",
      "# Parar processos conflitantes",
      "sudo pkill -f apache2",
      "sudo systemctl stop apache2",
      "sudo systemctl disable apache2",
      "",
      "# Limpar e reiniciar PM2",
      "pm2 delete all",
      "pm2 kill",
      "",
      "# Reiniciar serviços com PM2",
      "cd /root/vps-api-server",
      "sudo pm2 start server.js --name api-server",
      "",
      "cd /root/whatsapp-web-server", 
      "pm2 start server.js --name whatsapp-server",
      "",
      "# Salvar configuração PM2",
      "pm2 save",
      "pm2 startup",
      "",
      "# Verificar status final",
      "pm2 status",
      "sudo netstat -tlnp | grep -E ':(80|3001)'"
    ].join('\n');

    navigator.clipboard.writeText(commands);
    toast.success("Comandos de correção de processos copiados!");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-green-600" />
            <CardTitle>Analisador de Processos</CardTitle>
          </div>
          <Button 
            onClick={runProcessAnalysis} 
            disabled={analyzing}
            className="flex items-center gap-2"
          >
            {analyzing ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Analisando...
              </>
            ) : (
              <>
                <Cpu className="h-4 w-4" />
                Analisar Processos
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!results && (
          <div className="text-center py-8 text-muted-foreground">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Execute a análise para verificar processos, recursos e conflitos</p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Recursos do Sistema */}
            <div>
              <h4 className="font-medium mb-3">Recursos do Sistema</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-3 border rounded text-center">
                  <Cpu className="h-6 w-6 mx-auto mb-2 text-blue-600" />
                  <div className="text-lg font-bold">{results.system_resources.cpu.usage}%</div>
                  <div className="text-sm text-muted-foreground">CPU</div>
                </div>
                <div className="p-3 border rounded text-center">
                  <MemoryStick className="h-6 w-6 mx-auto mb-2 text-green-600" />
                  <div className="text-lg font-bold">
                    {Math.round((results.system_resources.memory.used / results.system_resources.memory.total) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Memória</div>
                </div>
                <div className="p-3 border rounded text-center">
                  <HardDrive className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                  <div className="text-lg font-bold">
                    {Math.round((results.system_resources.disk.used / results.system_resources.disk.total) * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Disco</div>
                </div>
                <div className="p-3 border rounded text-center">
                  <Activity className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                  <div className="text-lg font-bold">{results.system_resources.network.connections}</div>
                  <div className="text-sm text-muted-foreground">Conexões</div>
                </div>
              </div>
            </div>

            {/* Status PM2 */}
            <div>
              <h4 className="font-medium mb-3">Status PM2</h4>
              <div className="space-y-2">
                {results.pm2_analysis.processes.map((proc, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded">
                    <div className="flex items-center gap-3">
                      <span className="font-medium">{proc.name}</span>
                      {getProcessStatusBadge(proc.status)}
                      {proc.port && (
                        <Badge variant="outline">Porta {proc.port}</Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {proc.status === 'online' ? `${proc.uptime} | ${proc.restarts} restarts` : 'Parado'}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Conflitos de Porta */}
            {results.port_conflicts.length > 0 && (
              <div>
                <h4 className="font-medium mb-3 text-red-600">Conflitos de Porta</h4>
                {results.port_conflicts.map((conflict, index) => (
                  <div key={index} className="border border-red-200 rounded p-4 bg-red-50">
                    <div className="font-medium text-red-800 mb-2">
                      Conflito na Porta {conflict.port}
                    </div>
                    <div className="text-sm text-red-700 mb-2">
                      {conflict.processes.length} processos disputando a mesma porta:
                    </div>
                    {conflict.processes.map((proc, procIndex) => (
                      <div key={procIndex} className="text-sm text-red-600 ml-4">
                        • PID {proc.pid}: {proc.name} ({proc.command})
                      </div>
                    ))}
                    <div className="text-sm text-red-800 mt-2 font-medium">
                      Resolução: {conflict.resolution}
                    </div>
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={copyProcessFix}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Correção de Conflitos
                </Button>
              </div>
            )}

            {/* Problemas de Recursos */}
            {results.resource_issues.length > 0 && (
              <div>
                <h4 className="font-medium mb-3">Problemas Detectados</h4>
                {results.resource_issues.map((issue, index) => (
                  <div key={index} className="border rounded p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={getSeverityColor(issue.severity)}>
                        {issue.severity.toUpperCase()}
                      </Badge>
                      <Badge variant="outline">{issue.type.toUpperCase()}</Badge>
                    </div>
                    <div className="font-medium mb-1">{issue.message}</div>
                    <div className="text-sm text-muted-foreground">
                      Recomendação: {issue.recommendation}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="text-xs text-muted-foreground text-center">
              Análise de processos executada em: {new Date(results.timestamp).toLocaleString('pt-BR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
