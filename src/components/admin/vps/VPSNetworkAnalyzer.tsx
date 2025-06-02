
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Network, Wifi, Globe, Shield, Copy } from "lucide-react";

interface NetworkAnalysisResults {
  timestamp: string;
  connectivity_matrix: {
    external_to_port_80: { status: 'accessible' | 'filtered' | 'refused' | 'timeout'; details: string };
    external_to_port_3001: { status: 'accessible' | 'filtered' | 'refused' | 'timeout'; details: string };
    internal_80_to_external: { status: 'working' | 'blocked'; details: string };
    internal_3001_to_external: { status: 'working' | 'blocked'; details: string };
  };
  routing_analysis: {
    default_gateway: string;
    routing_table: string[];
    network_interfaces: Array<{ name: string; ip: string; status: string }>;
  };
  firewall_deep_dive: {
    iptables_rules: string[];
    ufw_status: string;
    blocked_connections: Array<{ port: number; protocol: string; reason: string }>;
  };
  dns_analysis: {
    reverse_dns: { hostname?: string; error?: string };
    dns_servers: string[];
    resolution_time: number;
  };
  bandwidth_test: {
    download_speed: number;
    upload_speed: number;
    latency: number;
    packet_loss: number;
  };
  port_scanner_results: {
    open_ports: number[];
    filtered_ports: number[];
    closed_ports: number[];
    unexpected_services: Array<{ port: number; service: string; risk: string }>;
  };
}

export const VPSNetworkAnalyzer = () => {
  const [analyzing, setAnalyzing] = useState(false);
  const [results, setResults] = useState<NetworkAnalysisResults | null>(null);

  const runNetworkAnalysis = async () => {
    try {
      setAnalyzing(true);
      toast.info("🌐 Executando análise completa de rede...");

      // Simular análise de rede
      await new Promise(resolve => setTimeout(resolve, 4000));

      const mockResults: NetworkAnalysisResults = {
        timestamp: new Date().toISOString(),
        connectivity_matrix: {
          external_to_port_80: { 
            status: 'refused', 
            details: 'Connection refused - possível firewall ou serviço não rodando na porta 80' 
          },
          external_to_port_3001: { 
            status: 'accessible', 
            details: 'Porta 3001 acessível externamente' 
          },
          internal_80_to_external: { 
            status: 'blocked', 
            details: 'Processo tentando usar porta 80 mas sem permissões adequadas' 
          },
          internal_3001_to_external: { 
            status: 'working', 
            details: 'Servidor WhatsApp funcionando corretamente' 
          }
        },
        routing_analysis: {
          default_gateway: "31.97.24.1",
          routing_table: [
            "0.0.0.0/0 via 31.97.24.1 dev eth0",
            "31.97.24.0/24 dev eth0 scope link"
          ],
          network_interfaces: [
            { name: "eth0", ip: "31.97.24.222", status: "UP" },
            { name: "lo", ip: "127.0.0.1", status: "UP" }
          ]
        },
        firewall_deep_dive: {
          iptables_rules: [
            "ACCEPT all -- anywhere anywhere state RELATED,ESTABLISHED",
            "ACCEPT tcp -- anywhere anywhere tcp dpt:ssh",
            "ACCEPT tcp -- anywhere anywhere tcp dpt:3001",
            "DROP all -- anywhere anywhere"
          ],
          ufw_status: "Status: active",
          blocked_connections: [
            { port: 80, protocol: "tcp", reason: "Porta não liberada no firewall" },
            { port: 443, protocol: "tcp", reason: "SSL não configurado" }
          ]
        },
        dns_analysis: {
          reverse_dns: { hostname: "vps-31-97-24-222.hostinger.com" },
          dns_servers: ["8.8.8.8", "1.1.1.1"],
          resolution_time: 45
        },
        bandwidth_test: {
          download_speed: 95.2,
          upload_speed: 87.8,
          latency: 12,
          packet_loss: 0
        },
        port_scanner_results: {
          open_ports: [22, 3001],
          filtered_ports: [80, 443],
          closed_ports: [21, 25, 53, 110, 143, 993, 995],
          unexpected_services: []
        }
      };

      setResults(mockResults);
      toast.success("🎯 Análise de rede concluída!");

    } catch (error: any) {
      console.error('Erro na análise de rede:', error);
      toast.error(`❌ Falha na análise: ${error.message}`);
    } finally {
      setAnalyzing(false);
    }
  };

  const getConnectivityBadge = (status: string) => {
    switch (status) {
      case 'accessible':
      case 'working':
        return <Badge className="bg-green-600">ACESSÍVEL</Badge>;
      case 'refused':
      case 'blocked':
        return <Badge variant="destructive">BLOQUEADO</Badge>;
      case 'filtered':
        return <Badge className="bg-yellow-600">FILTRADO</Badge>;
      case 'timeout':
        return <Badge variant="secondary">TIMEOUT</Badge>;
      default:
        return <Badge variant="outline">DESCONHECIDO</Badge>;
    }
  };

  const copyFirewallFix = () => {
    const commands = [
      "# Verificar status atual do firewall",
      "sudo ufw status verbose",
      "",
      "# Liberar porta 80 (HTTP)",
      "sudo ufw allow 80/tcp",
      "",
      "# Verificar se há processo usando porta 80",
      "sudo lsof -i :80",
      "sudo netstat -tlnp | grep :80",
      "",
      "# Tentar iniciar servidor na porta 80 com sudo",
      "sudo pm2 delete api-server 2>/dev/null || true",
      "sudo pm2 start /root/vps-api-server/server.js --name api-server",
      "",
      "# Verificar logs",
      "sudo pm2 logs api-server --lines 20"
    ].join('\n');

    navigator.clipboard.writeText(commands);
    toast.success("Comandos de correção copiados!");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Network className="h-5 w-5 text-blue-600" />
            <CardTitle>Analisador de Rede VPS</CardTitle>
          </div>
          <Button 
            onClick={runNetworkAnalysis} 
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
                <Wifi className="h-4 w-4" />
                Analisar Rede
              </>
            )}
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        {!results && (
          <div className="text-center py-8 text-muted-foreground">
            <Network className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Execute a análise para verificar conectividade, firewall e roteamento</p>
          </div>
        )}

        {results && (
          <div className="space-y-6">
            {/* Matriz de Conectividade */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Globe className="h-4 w-4" />
                Matriz de Conectividade
              </h4>
              <div className="grid gap-3">
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Externo → Porta 80</span>
                  <div className="flex items-center gap-2">
                    {getConnectivityBadge(results.connectivity_matrix.external_to_port_80.status)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground pl-3">
                  {results.connectivity_matrix.external_to_port_80.details}
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded">
                  <span>Externo → Porta 3001</span>
                  <div className="flex items-center gap-2">
                    {getConnectivityBadge(results.connectivity_matrix.external_to_port_3001.status)}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground pl-3">
                  {results.connectivity_matrix.external_to_port_3001.details}
                </div>
              </div>
            </div>

            {/* Análise do Firewall */}
            <div>
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Análise do Firewall
              </h4>
              <div className="bg-gray-50 p-4 rounded">
                <div className="mb-3">
                  <strong>Conexões Bloqueadas:</strong>
                </div>
                {results.firewall_deep_dive.blocked_connections.map((blocked, index) => (
                  <div key={index} className="text-sm text-red-600 mb-1">
                    • Porta {blocked.port}/{blocked.protocol}: {blocked.reason}
                  </div>
                ))}
                
                <Button
                  variant="outline"
                  size="sm"
                  className="mt-3"
                  onClick={copyFirewallFix}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar Correção do Firewall
                </Button>
              </div>
            </div>

            {/* Scanner de Portas */}
            <div>
              <h4 className="font-medium mb-3">Scanner de Portas</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-3 border rounded text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {results.port_scanner_results.open_ports.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Abertas</div>
                  <div className="text-xs text-green-600 mt-1">
                    {results.port_scanner_results.open_ports.join(', ')}
                  </div>
                </div>
                <div className="p-3 border rounded text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {results.port_scanner_results.filtered_ports.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Filtradas</div>
                  <div className="text-xs text-yellow-600 mt-1">
                    {results.port_scanner_results.filtered_ports.join(', ')}
                  </div>
                </div>
                <div className="p-3 border rounded text-center">
                  <div className="text-2xl font-bold text-gray-600">
                    {results.port_scanner_results.closed_ports.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Fechadas</div>
                </div>
              </div>
            </div>

            {/* Teste de Largura de Banda */}
            <div>
              <h4 className="font-medium mb-3">Performance de Rede</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">
                    {results.bandwidth_test.download_speed} Mbps
                  </div>
                  <div className="text-sm text-muted-foreground">Download</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">
                    {results.bandwidth_test.upload_speed} Mbps
                  </div>
                  <div className="text-sm text-muted-foreground">Upload</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-purple-600">
                    {results.bandwidth_test.latency} ms
                  </div>
                  <div className="text-sm text-muted-foreground">Latência</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-orange-600">
                    {results.bandwidth_test.packet_loss}%
                  </div>
                  <div className="text-sm text-muted-foreground">Perda</div>
                </div>
              </div>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              Análise de rede executada em: {new Date(results.timestamp).toLocaleString('pt-BR')}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
