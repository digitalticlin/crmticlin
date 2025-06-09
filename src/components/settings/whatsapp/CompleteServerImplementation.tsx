
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Rocket, CheckCircle, AlertCircle, Loader2, Server, Code, Zap } from "lucide-react";

export const CompleteServerImplementation = () => {
  const [isImplementing, setIsImplementing] = useState(false);
  const [implementationResult, setImplementationResult] = useState<any>(null);

  const handleImplement = async () => {
    try {
      setIsImplementing(true);
      console.log('[Complete Implementation] 🚀 Iniciando implementação do servidor completo...');

      const { data, error } = await supabase.functions.invoke('implement_complete_server', {
        body: {
          action: 'implement_complete_whatsapp_server'
        }
      });

      if (error) {
        console.error('[Complete Implementation] ❌ Erro:', error);
        throw error;
      }

      console.log('[Complete Implementation] ✅ Resultado:', data);
      setImplementationResult(data);

      if (data.success) {
        toast.success('🎉 Servidor WhatsApp completo implementado com sucesso!');
      } else {
        toast.error(`❌ Erro na implementação: ${data.error}`);
      }

    } catch (error: any) {
      console.error('[Complete Implementation] ❌ Erro fatal:', error);
      toast.error(`Erro na implementação: ${error.message}`);
    } finally {
      setIsImplementing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card de Implementação */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Rocket className="h-6 w-6" />
            Implementar Servidor WhatsApp Completo
          </CardTitle>
          <p className="text-blue-700">
            Implementa o servidor WhatsApp Web.js completo na VPS com todas as funcionalidades necessárias
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-green-600" />
              <span className="text-sm">WhatsApp Web.js</span>
            </div>
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-blue-600" />
              <span className="text-sm">QR Code Base64</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-purple-600" />
              <span className="text-sm">Webhooks Automáticos</span>
            </div>
          </div>

          <Button 
            onClick={handleImplement}
            disabled={isImplementing}
            className="w-full"
            size="lg"
          >
            {isImplementing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Implementando Servidor Completo...
              </>
            ) : (
              <>
                <Rocket className="h-5 w-5 mr-2" />
                Implementar Servidor Completo
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado da Implementação */}
      {implementationResult && (
        <Card className={implementationResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${implementationResult.success ? "text-green-800" : "text-red-800"}`}>
              {implementationResult.success ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
              Resultado da Implementação
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {implementationResult.success ? (
              <>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">✅ Etapas Executadas:</h4>
                    <div className="grid gap-2">
                      {implementationResult.steps?.map((step: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {implementationResult.server_version && (
                    <div>
                      <Badge variant="outline" className="bg-green-100">
                        Versão: {implementationResult.server_version}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">🚀 Funcionalidades Implementadas:</h4>
                    <div className="grid gap-2">
                      {implementationResult.features?.map((feature: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">📋 Próximos Passos:</h4>
                    <div className="grid gap-2">
                      {implementationResult.next_steps?.map((step: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-blue-600" />
                          <span className="text-sm">{step}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-red-700">
                <p><strong>Erro:</strong> {implementationResult.error}</p>
                {implementationResult.details && (
                  <p className="text-sm mt-2">{implementationResult.details}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instruções */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">📋 O que será implementado</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <h4 className="font-semibold mb-2">🔧 Servidor WhatsApp Web.js Completo</h4>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Cliente WhatsApp Web.js configurado para VPS</li>
                <li>Geração de QR Code em formato Base64</li>
                <li>Sistema de webhooks automáticos</li>
                <li>Endpoints completos de API</li>
                <li>Timeouts otimizados (120 segundos)</li>
                <li>Persistência de sessões WhatsApp</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">📡 Funcionalidades de API</h4>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Criação assíncrona de instâncias</li>
                <li>Obtenção de QR Code em Base64</li>
                <li>Status detalhado das instâncias</li>
                <li>Envio de mensagens WhatsApp</li>
                <li>Health check com métricas</li>
                <li>Gestão completa do ciclo de vida</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🔄 Após a Implementação</h4>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Teste a criação de instâncias via interface</li>
                <li>Verifique a geração automática de QR Code</li>
                <li>Escaneie o QR Code com seu WhatsApp</li>
                <li>Teste o envio/recebimento de mensagens</li>
                <li>Confirme a sincronização com o banco de dados</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
