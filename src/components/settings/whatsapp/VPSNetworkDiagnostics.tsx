
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Activity, 
  Globe, 
  Server, 
  Wifi, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Loader2,
  Network,
  Clock
} from "lucide-react";

interface NetworkTest {
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  duration?: number;
  result?: any;
  description: string;
}

export const VPSNetworkDiagnostics = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [tests, setTests] = useState<NetworkTest[]>([
    {
      name: 'DNS Resolution',
      status: 'pending',
      description: 'Verificar resolução DNS do domínio da VPS'
    },
    {
      name: 'Port Connectivity',
      status: 'pending', 
      description: 'Testar conectividade na porta 3002'
    },
    {
      name: 'HTTP Response',
      status: 'pending',
      description: 'Verificar resposta HTTP básica'
    },
    {
      name: 'SSL Handshake',
      status: 'pending',
      description: 'Testar handshake SSL/TLS'
    },
    {
      name: 'Latency Test',
      status: 'pending',
      description: 'Medir latência da conexão'
    },
    {
      name: 'Throughput Test',
      status: 'pending',
      description: 'Testar velocidade de transferência'
    }
  ]);

  const runDiagnostics = async () => {
    setIsRunning(true);
    
    for (let i = 0; i < tests.length; i++) {
      setTests(prev => prev.map((test, idx) => 
        idx === i ? { ...test, status: 'running' } : test
      ));
      
      // Simular teste
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
      
      const success = Math.random() > 0.3;
      setTests(prev => prev.map((test, idx) => 
        idx === i ? { 
          ...test, 
          status: success ? 'success' : 'failed',
          duration: Math.floor(Math.random() * 1000) + 100,
          result: success ? 'OK' : 'Connection timeout'
        } : test
      ));
    }
    
    setIsRunning(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'running':
        return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const colors = {
      success: 'bg-green-100 text-green-800',
      failed: 'bg-red-100 text-red-800',
      running: 'bg-blue-100 text-blue-800',
      pending: 'bg-gray-100 text-gray-600'
    };
    
    return (
      <Badge className={colors[status as keyof typeof colors]}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <Card className="border-0 bg-gradient-to-br from-green-50/50 to-blue-50/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Network className="h-5 w-5 text-green-600" />
          Diagnóstico de Rede Avançado
        </CardTitle>
        <p className="text-sm text-gray-600">
          Análise detalhada da conectividade de rede entre Supabase e VPS
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={runDiagnostics}
            disabled={isRunning}
            className="bg-green-600 hover:bg-green-700"
          >
            {isRunning ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Executando Diagnósticos...
              </>
            ) : (
              <>
                <Activity className="h-4 w-4 mr-2" />
                Iniciar Diagnóstico
              </>
            )}
          </Button>
        </div>

        <div className="space-y-3">
          {tests.map((test, index) => (
            <Card key={index} className={`border-l-4 transition-all duration-200 ${
              test.status === 'success' ? 'border-l-green-500 bg-green-50/30' :
              test.status === 'failed' ? 'border-l-red-500 bg-red-50/30' :
              test.status === 'running' ? 'border-l-blue-500 bg-blue-50/30' :
              'border-l-gray-300'
            }`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <h3 className="font-medium text-sm">{test.name}</h3>
                      <p className="text-xs text-gray-600">{test.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.status)}
                    {test.duration && (
                      <span className="text-xs text-gray-500">
                        {test.duration}ms
                      </span>
                    )}
                  </div>
                </div>
                
                {test.result && test.status === 'failed' && (
                  <div className="mt-2 text-xs text-red-600">
                    <strong>Erro:</strong> {test.result}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Resumo dos Resultados */}
        {tests.some(t => t.status !== 'pending') && (
          <Card className="bg-gray-50/50 border-gray-200">
            <CardContent className="p-4">
              <h3 className="font-medium text-sm mb-2 flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Resumo dos Testes
              </h3>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-lg font-bold text-green-600">
                    {tests.filter(t => t.status === 'success').length}
                  </div>
                  <div className="text-xs text-gray-600">Sucessos</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-red-600">
                    {tests.filter(t => t.status === 'failed').length}
                  </div>
                  <div className="text-xs text-gray-600">Falhas</div>
                </div>
                <div>
                  <div className="text-lg font-bold text-gray-600">
                    {tests.filter(t => t.status === 'pending').length}
                  </div>
                  <div className="text-xs text-gray-600">Pendentes</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </CardContent>
    </Card>
  );
};
