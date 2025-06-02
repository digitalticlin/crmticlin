
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertCircle, CheckCircle, XCircle, Search, Code, Network, Bug } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface InvestigationResult {
  method: string;
  endpoint: string;
  payload: any;
  headers: Record<string, string>;
  statusCode: number;
  response: any;
  success: boolean;
  timestamp: string;
}

export const VPSDeepInvestigation = () => {
  const [isInvestigating, setIsInvestigating] = useState(false);
  const [results, setResults] = useState<InvestigationResult[]>([]);
  const [customPayload, setCustomPayload] = useState('{"instanceName": "test_instance"}');
  const [selectedMethod, setSelectedMethod] = useState("POST");
  const [selectedEndpoint, setSelectedEndpoint] = useState("/create");

  // Configurações de teste predefinidas
  const testConfigurations = [
    // Tentativas para /create
    {
      method: "POST",
      endpoint: "/create",
      payloads: [
        { instanceName: "test_deep_investigation" },
        { sessionName: "test_deep_investigation" },
        { name: "test_deep_investigation" },
        { instance: "test_deep_investigation" },
        { id: "test_deep_investigation" },
        { clientName: "test_deep_investigation", sessionName: "test_deep_investigation" },
        { instanceId: "test_deep_investigation", webhookUrl: "https://example.com/webhook" },
        { key: "test_deep_investigation", webhook: "https://example.com/webhook" },
        { session: { name: "test_deep_investigation" } },
        { instance: { name: "test_deep_investigation", webhook: "https://example.com/webhook" } }
      ]
    },
    {
      method: "PUT",
      endpoint: "/create",
      payloads: [
        { instanceName: "test_deep_investigation" },
        { name: "test_deep_investigation" }
      ]
    },
    {
      method: "GET",
      endpoint: "/create",
      payloads: [null] // GET sem payload
    },
    // Tentativas para endpoints alternativos
    {
      method: "POST",
      endpoint: "/instance/create",
      payloads: [
        { instanceName: "test_deep_investigation" },
        { name: "test_deep_investigation" }
      ]
    },
    {
      method: "POST",
      endpoint: "/api/create",
      payloads: [
        { instanceName: "test_deep_investigation" }
      ]
    },
    {
      method: "POST",
      endpoint: "/whatsapp/create",
      payloads: [
        { instanceName: "test_deep_investigation" }
      ]
    },
    {
      method: "POST",
      endpoint: "/session/create",
      payloads: [
        { sessionName: "test_deep_investigation" }
      ]
    }
  ];

  const contentTypes = [
    "application/json",
    "application/x-www-form-urlencoded",
    "multipart/form-data",
    "text/plain"
  ];

  const runDeepInvestigation = async () => {
    setIsInvestigating(true);
    setResults([]);
    const newResults: InvestigationResult[] = [];

    try {
      toast.info("Iniciando investigação técnica profunda...");

      for (const config of testConfigurations) {
        for (const payload of config.payloads) {
          for (const contentType of contentTypes) {
            try {
              console.log(`Testing: ${config.method} ${config.endpoint} with payload:`, payload);
              
              const { data, error } = await supabase.functions.invoke('vps_deep_investigation', {
                body: {
                  method: config.method,
                  endpoint: config.endpoint,
                  payload,
                  contentType,
                  testId: `deep_test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                }
              });

              const result: InvestigationResult = {
                method: config.method,
                endpoint: config.endpoint,
                payload,
                headers: { 'Content-Type': contentType },
                statusCode: data?.statusCode || (error ? 500 : 200),
                response: data?.response || error,
                success: data?.success || false,
                timestamp: new Date().toLocaleString()
              };

              newResults.push(result);
              setResults([...newResults]);

              // Pequena pausa entre testes
              await new Promise(resolve => setTimeout(resolve, 500));

            } catch (testError) {
              console.error(`Test failed:`, testError);
              const errorResult: InvestigationResult = {
                method: config.method,
                endpoint: config.endpoint,
                payload,
                headers: { 'Content-Type': contentType },
                statusCode: 500,
                response: testError,
                success: false,
                timestamp: new Date().toLocaleString()
              };
              newResults.push(errorResult);
              setResults([...newResults]);
            }
          }
        }
      }

      toast.success("Investigação técnica concluída!");

    } catch (error) {
      console.error('Investigation error:', error);
      toast.error("Erro durante investigação técnica");
    } finally {
      setIsInvestigating(false);
    }
  };

  const runCustomTest = async () => {
    setIsInvestigating(true);
    
    try {
      let parsedPayload;
      try {
        parsedPayload = JSON.parse(customPayload);
      } catch (e) {
        parsedPayload = customPayload;
      }

      const { data, error } = await supabase.functions.invoke('vps_deep_investigation', {
        body: {
          method: selectedMethod,
          endpoint: selectedEndpoint,
          payload: parsedPayload,
          contentType: "application/json",
          testId: `custom_test_${Date.now()}`
        }
      });

      const result: InvestigationResult = {
        method: selectedMethod,
        endpoint: selectedEndpoint,
        payload: parsedPayload,
        headers: { 'Content-Type': 'application/json' },
        statusCode: data?.statusCode || (error ? 500 : 200),
        response: data?.response || error,
        success: data?.success || false,
        timestamp: new Date().toLocaleString()
      };

      setResults(prev => [result, ...prev]);
      toast.success("Teste customizado executado!");

    } catch (error) {
      console.error('Custom test error:', error);
      toast.error("Erro no teste customizado");
    } finally {
      setIsInvestigating(false);
    }
  };

  const successfulResults = results.filter(r => r.success || r.statusCode === 200 || r.statusCode === 201);
  const failedResults = results.filter(r => !r.success && r.statusCode !== 200 && r.statusCode !== 201);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Bug className="h-5 w-5 text-red-600" />
          <CardTitle>Investigação Técnica Profunda VPS</CardTitle>
        </div>
        <CardDescription>
          Análise avançada para descobrir a configuração correta dos endpoints VPS
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="auto" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="auto">Investigação Automática</TabsTrigger>
            <TabsTrigger value="custom">Teste Customizado</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>
          
          <TabsContent value="auto" className="space-y-4">
            <div className="flex flex-col gap-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium mb-2">O que será testado:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Múltiplos métodos HTTP (POST, PUT, GET)</li>
                  <li>• Diferentes endpoints (/create, /instance/create, /api/create, etc)</li>
                  <li>• Variações de payload (instanceName, sessionName, name, etc)</li>
                  <li>• Diferentes Content-Types</li>
                  <li>• Combinações de headers e autenticação</li>
                </ul>
              </div>
              
              <Button 
                onClick={runDeepInvestigation}
                disabled={isInvestigating}
                className="w-full"
              >
                {isInvestigating ? (
                  <>
                    <Search className="h-4 w-4 mr-2 animate-spin" />
                    Investigando... ({results.length} testes executados)
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Iniciar Investigação Técnica Profunda
                  </>
                )}
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="custom" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="method">Método HTTP</Label>
                <Select value={selectedMethod} onValueChange={setSelectedMethod}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="GET">GET</SelectItem>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                    <SelectItem value="DELETE">DELETE</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="endpoint">Endpoint</Label>
                <Input
                  id="endpoint"
                  value={selectedEndpoint}
                  onChange={(e) => setSelectedEndpoint(e.target.value)}
                  placeholder="/create"
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="payload">Payload (JSON)</Label>
              <Textarea
                id="payload"
                value={customPayload}
                onChange={(e) => setCustomPayload(e.target.value)}
                placeholder='{"instanceName": "test_instance"}'
                rows={6}
              />
            </div>
            
            <Button 
              onClick={runCustomTest}
              disabled={isInvestigating}
              className="w-full"
            >
              {isInvestigating ? (
                <>
                  <Code className="h-4 w-4 mr-2 animate-spin" />
                  Executando Teste...
                </>
              ) : (
                <>
                  <Code className="h-4 w-4 mr-2" />
                  Executar Teste Customizado
                </>
              )}
            </Button>
          </TabsContent>
          
          <TabsContent value="results" className="space-y-4">
            {results.length > 0 && (
              <div className="grid grid-cols-3 gap-4 mb-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      <span className="text-2xl font-bold text-green-600">{successfulResults.length}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Sucessos</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-600" />
                      <span className="text-2xl font-bold text-red-600">{failedResults.length}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Falhas</p>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Network className="h-4 w-4 text-blue-600" />
                      <span className="text-2xl font-bold text-blue-600">{results.length}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">Total</p>
                  </CardContent>
                </Card>
              </div>
            )}
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.map((result, index) => (
                <Card key={index} className={result.success || result.statusCode === 200 || result.statusCode === 201 ? "border-green-200" : "border-red-200"}>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={result.success || result.statusCode === 200 || result.statusCode === 201 ? "default" : "destructive"}>
                          {result.method}
                        </Badge>
                        <code className="text-sm bg-gray-100 px-2 py-1 rounded">{result.endpoint}</code>
                        <Badge variant="outline">Status: {result.statusCode}</Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <strong>Payload:</strong>
                        <pre className="bg-gray-50 p-2 rounded mt-1 text-xs overflow-x-auto">
                          {JSON.stringify(result.payload, null, 2)}
                        </pre>
                      </div>
                      
                      <div>
                        <strong>Response:</strong>
                        <pre className="bg-gray-50 p-2 rounded mt-1 text-xs overflow-x-auto">
                          {JSON.stringify(result.response, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
            
            {results.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhum resultado ainda. Execute uma investigação primeiro.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
