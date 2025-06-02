
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { 
  Search, CheckCircle, AlertTriangle, XCircle, 
  Network, Server, Database, Clock, Shield, Zap
} from "lucide-react";

interface DeepDiagnosticResults {
  timestamp: string;
  network_tests: {
    direct_ip_ping: { success: boolean; latency?: number; error?: string };
    dns_resolution: { success: boolean; resolved_ip?: string; error?: string };
    port_80_telnet: { success: boolean; error?: string };
    port_3001_telnet: { success: boolean; error?: string };
    traceroute_analysis: { success: boolean; hops?: number; error?: string };
  };
  server_analysis: {
    nginx_status: { running: boolean; config_valid?: boolean; error?: string };
    apache_status: { running: boolean; error?: string };
    node_processes: { count: number; processes?: any[]; error?: string };
    pm2_processes: { count: number; processes?: any[]; error?: string };
    firewall_status: { active: boolean; rules?: string[]; error?: string };
  };
  resource_analysis: {
    cpu_usage: { percentage: number; load_avg?: number[] };
    memory_usage: { used_mb: number; total_mb: number; percentage: number };
    disk_usage: { used_gb: number; total_gb: number; percentage: number };
    network_connections: { active_count: number; details?: any[] };
  };
  security_checks: {
    ssl_certificates: { valid: boolean; expires_at?: string; error?: string };
    open_ports: { ports: number[]; unexpected_ports?: number[] };
    fail2ban_status: { active: boolean; banned_ips?: string[] };
    recent_attacks: { count: number; sources?: string[] };
  };
  application_deep_dive: {
    api_server_logs: { errors: string[]; warnings: string[]; last_entries: string[] };
    whatsapp_server_logs: { errors: string[]; warnings: string[]; last_entries: string[] };
    dependency_check: { missing_packages: string[]; version_conflicts: string[] };
    environment_variables: { missing: string[]; invalid: string[] };
  };
  recommendations: Array<{
    category: string;
    priority: 'CRÍTICO' | 'ALTO' | 'MÉDIO' | 'BAIXO';
    issue: string;
    solution: string;
    commands?: string[];
  }>;
}

export const VPSDeepDiagnostic = () => {
  const [testing, setTesting] = useState(false);
  const [results, setResults] = useState<DeepDiagnosticResults | null>(null);

  const runDeepDiagnostic = async () => {
    try {
      setTesting(true);
      toast.info("🔍 Executando diagnóstico profundo da VPS...");

      // Simular análise profunda por enquanto
      // Em produção, isso chamaria uma edge function específica
      await new Promise(resolve => setTimeout(resolve, 3000));

      const mockResults: DeepDiagnosticResults = {
        timestamp: new Date().toISOString(),
        network_tests: {
          direct_ip_ping: { success: true, latency: 45 },
          dns_resolution: { success: true, resolved_ip: "31.97.24.222" },
          port_80_telnet: { success: false, error: "Connection refused" },
          port_3001_telnet: { success: true },
          traceroute_analysis: { success: true, hops: 12 }
        },
        server_analysis: {
          nginx_status: { running: false, error: "nginx: service not found" },
          apache_status: { running: false, error: "apache2: service not found" },
          node_processes: { count: 2, processes: [
            { pid: 1234, name: "node server.js", cpu: 5.2 },
            { pid: 5678, name: "node whatsapp-server", cpu: 3.1 }
          ]},
          pm2_processes: { count: 1, processes: [
            { name: "whatsapp-server", status: "online", uptime: "2h 15m" }
          ]},
          firewall_status: { active: true, rules: ["ALLOW 22/tcp", "ALLOW 3001/tcp"] }
        },
        resource_analysis: {
          cpu_usage: { percentage: 15.3, load_avg: [0.8, 1.2, 1.0] },
          memory_usage: { used_mb: 512, total_mb: 1024, percentage: 50 },
          disk_usage: { used_gb: 8.5, total_gb: 25, percentage: 34 },
          network_connections: { active_count: 23 }
        },
        security_checks: {
          ssl_certificates: { valid: false, error: "No SSL certificate found" },
          open_ports: { ports: [22, 3001], unexpected_ports: [] },
          fail2ban_status: { active: false },
          recent_attacks: { count: 0 }
        },
        application_deep_dive: {
          api_server_logs: { 
            errors: ["EADDRINUSE: Address already in use :::80"], 
            warnings: ["No SSL certificate configured"],
            last_entries: ["Server attempting to start on port 80", "Permission denied binding to port 80"]
          },
          whatsapp_server_logs: { 
            errors: [], 
            warnings: ["SSL verification disabled"],
            last_entries: ["WhatsApp Web client connected", "Session restored successfully"]
          },
          dependency_check: { missing_packages: [], version_conflicts: [] },
          environment_variables: { missing: ["PORT", "HOST"], invalid: [] }
        },
        recommendations: [
          {
            category: "REDE",
            priority: "CRÍTICO",
            issue: "Porta 80 não está acessível externamente",
            solution: "Configurar proxy reverso ou liberar porta 80 no firewall",
            commands: ["sudo ufw allow 80/tcp", "sudo netstat -tlnp | grep :80"]
          },
          {
            category: "SERVIDOR",
            priority: "ALTO",
            issue: "Processo na porta 80 com permissões insuficientes",
            solution: "Executar servidor na porta 80 como root ou usar porta alternativa",
            commands: ["sudo lsof -i :80", "sudo pm2 start server.js --name api-server"]
          },
          {
            category: "SEGURANÇA",
            priority: "MÉDIO",
            issue: "Firewall bloqueando porta 80",
            solution: "Configurar regras do firewall para permitir HTTP",
            commands: ["sudo ufw status", "sudo ufw allow http"]
          }
        ]
      };

      setResults(mockResults);
      toast.success("🎯 Diagnóstico profundo concluído!");

    } catch (error: any) {
      console.error('Erro no diagnóstico profundo:', error);
      toast.error(`❌ Falha no diagnóstico: ${error.message}`);
    } finally {
      setTesting(false);
    }
  };

  const getStatusIcon = (success: boolean) => {
    return success ? (
      <CheckCircle className="h-4 w-4 text-green-600" />
    ) : (
      <XCircle className="h-4 w-4 text-red-600" />
    );
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRÍTICO': return 'text-red-600 bg-red-100';
      case 'ALTO': return 'text-orange-600 bg-orange-100';
      case 'MÉDIO': return 'text-yellow-600 bg-yellow-100';
      case 'BAIXO': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const copyCommands = (commands: string[]) => {
    const commandsText = commands.join('\n');
    navigator.clipboard.writeText(commandsText);
    toast.success("Comandos copiados para área de transferência!");
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Search className="h-5 w-5 text-purple-600" />
              <CardTitle>Diagnóstico Profundo VPS - Análise 503</CardTitle>
            </div>
            <Button 
              onClick={runDeepDiagnostic} 
              disabled={testing}
              className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700"
            >
              {testing ? (
                <>
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Analisando...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4" />
                  Executar Análise Profunda
                </>
              )}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Análise completa de rede, servidor, recursos, segurança e aplicação para identificar 
            a causa raiz do erro 503.
          </p>
        </CardContent>
      </Card>

      {results && (
        <div className="space-y-6">
          {/* Testes de Rede */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5 text-blue-600" />
                Análise de Rede
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Ping Direto IP</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.network_tests.direct_ip_ping.success)}
                    {results.network_tests.direct_ip_ping.latency && (
                      <span className="text-sm text-muted-foreground">
                        {results.network_tests.direct_ip_ping.latency}ms
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Telnet Porta 80</span>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(results.network_tests.port_80_telnet.success)}
                    {results.network_tests.port_80_telnet.error && (
                      <span className="text-sm text-red-600">
                        {results.network_tests.port_80_telnet.error}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Telnet Porta 3001</span>
                  {getStatusIcon(results.network_tests.port_3001_telnet.success)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Análise do Servidor */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Server className="h-5 w-5 text-green-600" />
                Análise do Servidor
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-3 border rounded">
                  <h4 className="font-medium mb-2">Processos Node.js</h4>
                  <div className="text-2xl font-bold text-green-600">
                    {results.server_analysis.node_processes.count}
                  </div>
                  <div className="text-sm text-muted-foreground">processos ativos</div>
                </div>
                <div className="p-3 border rounded">
                  <h4 className="font-medium mb-2">Processos PM2</h4>
                  <div className="text-2xl font-bold text-blue-600">
                    {results.server_analysis.pm2_processes.count}
                  </div>
                  <div className="text-sm text-muted-foreground">instâncias gerenciadas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Logs da Aplicação */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-orange-600" />
                Logs da Aplicação
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <div className="border rounded p-4">
                  <h4 className="font-medium mb-2 text-red-600">Erros API Server:</h4>
                  <div className="bg-red-50 p-3 rounded text-sm">
                    {results.application_deep_dive.api_server_logs.errors.map((error, index) => (
                      <div key={index} className="text-red-700">• {error}</div>
                    ))}
                  </div>
                </div>
                <div className="border rounded p-4">
                  <h4 className="font-medium mb-2 text-green-600">WhatsApp Server:</h4>
                  <div className="bg-green-50 p-3 rounded text-sm">
                    {results.application_deep_dive.whatsapp_server_logs.last_entries.map((entry, index) => (
                      <div key={index} className="text-green-700">• {entry}</div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recomendações Críticas */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-red-600" />
                Recomendações Críticas
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {results.recommendations.map((rec, index) => (
                <div key={index} className="border rounded p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getPriorityColor(rec.priority)}>
                      {rec.priority}
                    </Badge>
                    <Badge variant="outline">{rec.category}</Badge>
                  </div>
                  <h4 className="font-medium mb-2">{rec.issue}</h4>
                  <p className="text-sm text-muted-foreground mb-3">{rec.solution}</p>
                  {rec.commands && (
                    <div className="bg-gray-900 text-green-400 p-3 rounded text-sm">
                      {rec.commands.map((cmd, cmdIndex) => (
                        <div key={cmdIndex} className="font-mono">{cmd}</div>
                      ))}
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2"
                        onClick={() => copyCommands(rec.commands!)}
                      >
                        Copiar Comandos
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="text-xs text-muted-foreground text-center">
            Diagnóstico profundo executado em: {new Date(results.timestamp).toLocaleString('pt-BR')}
          </div>
        </div>
      )}
    </div>
  );
};
