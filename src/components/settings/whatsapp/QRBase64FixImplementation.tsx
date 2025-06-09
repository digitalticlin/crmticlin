
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench, CheckCircle, AlertCircle, Loader2, Code, Zap } from "lucide-react";

export const QRBase64FixImplementation = () => {
  const [isImplementing, setIsImplementing] = useState(false);
  const [fixResult, setFixResult] = useState<any>(null);

  const handleImplementFix = async () => {
    try {
      setIsImplementing(true);
      console.log('[QR Base64 Fix] 🔧 Aplicando correção QR Base64...');

      const { data, error } = await supabase.functions.invoke('implement_complete_server', {
        body: {
          action: 'apply_qr_base64_fix'
        }
      });

      if (error) {
        console.error('[QR Base64 Fix] ❌ Erro:', error);
        throw error;
      }

      console.log('[QR Base64 Fix] ✅ Resultado:', data);
      setFixResult(data);

      if (data.success) {
        toast.success('🎉 Correção QR Base64 aplicada com sucesso!');
      } else {
        toast.error(`❌ Erro na correção: ${data.error}`);
      }

    } catch (error: any) {
      console.error('[QR Base64 Fix] ❌ Erro fatal:', error);
      toast.error(`Erro na correção: ${error.message}`);
    } finally {
      setIsImplementing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Card de Implementação da Correção */}
      <Card className="border-orange-200 bg-orange-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-orange-800">
            <Wrench className="h-6 w-6" />
            Aplicar Correção QR Base64
          </CardTitle>
          <p className="text-orange-700">
            Corrige o formato do QR Code para sempre retornar como DataURL válido (data:image/png;base64,...)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-2">
              <Code className="h-5 w-5 text-blue-600" />
              <span className="text-sm">Função ensureBase64Format()</span>
            </div>
            <div className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-green-600" />
              <span className="text-sm">QR DataURL Garantido</span>
            </div>
          </div>

          <Button 
            onClick={handleImplementFix}
            disabled={isImplementing}
            className="w-full"
            size="lg"
            variant="outline"
          >
            {isImplementing ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Aplicando Correção QR Base64...
              </>
            ) : (
              <>
                <Wrench className="h-5 w-5 mr-2" />
                Aplicar Correção QR Base64
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Resultado da Correção */}
      {fixResult && (
        <Card className={fixResult.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
          <CardHeader>
            <CardTitle className={`flex items-center gap-2 ${fixResult.success ? "text-green-800" : "text-red-800"}`}>
              {fixResult.success ? (
                <CheckCircle className="h-6 w-6" />
              ) : (
                <AlertCircle className="h-6 w-6" />
              )}
              Resultado da Correção QR Base64
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {fixResult.success ? (
              <>
                <div className="space-y-3">
                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">✅ Correções Aplicadas:</h4>
                    <div className="grid gap-2">
                      {fixResult.fixes?.map((fix: string, index: number) => (
                        <div key={index} className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-sm">{fix}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {fixResult.server_version && (
                    <div>
                      <Badge variant="outline" className="bg-green-100">
                        Versão Atualizada: {fixResult.server_version}
                      </Badge>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-green-800 mb-2">📋 Próximos Passos:</h4>
                    <div className="grid gap-2">
                      {fixResult.next_steps?.map((step: string, index: number) => (
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
                <p><strong>Erro:</strong> {fixResult.error}</p>
                {fixResult.details && (
                  <p className="text-sm mt-2">{fixResult.details}</p>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Instruções de Teste */}
      <Card className="border-gray-200">
        <CardHeader>
          <CardTitle className="text-gray-800">🧪 Como Testar a Correção</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <h4 className="font-semibold mb-2">📋 Execute este comando SSH na VPS:</h4>
              <div className="bg-gray-100 p-3 rounded-md text-sm font-mono">
                <pre>{`# Teste da correção QR Base64
curl -s "http://31.97.24.222:3002/health" | jq '.version'

# Criar nova instância
INSTANCE_NAME="test_fix_$(date +%s)"
curl -X POST "http://31.97.24.222:3002/instance/create" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \\
  --data '{"instanceId":"'$INSTANCE_NAME'","sessionName":"TestFix"}'

# Aguardar e buscar QR
sleep 15
curl -X POST "http://31.97.24.222:3002/instance/qr" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer 3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3" \\
  --data '{"instanceId":"'$INSTANCE_NAME'"}' | jq '{
    qr_format: .qr_format,
    has_qr_code: .has_qr_code,
    qr_preview: (.qrCode // "null")[0:60]
  }'`}</pre>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">✅ Resultados Esperados Após a Correção:</h4>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li><strong>Versão:</strong> 4.2.1-QR-BASE64-FIXED</li>
                <li><strong>qr_format:</strong> "base64_data_url"</li>
                <li><strong>has_qr_code:</strong> true</li>
                <li><strong>qr_preview:</strong> Deve começar com "data:image/png;base64,"</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🔧 O que a Correção Faz:</h4>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Implementa função ensureBase64Format() tolerante</li>
                <li>Converte QR string para DataURL se necessário</li>
                <li>Valida formato antes de retornar</li>
                <li>Adiciona prefixo data:image/png;base64, quando ausente</li>
                <li>Mantém compatibilidade com diferentes formatos de entrada</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
