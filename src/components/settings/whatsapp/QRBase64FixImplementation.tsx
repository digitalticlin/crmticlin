
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Wrench, CheckCircle, AlertCircle, Loader2, Code, Zap, Terminal } from "lucide-react";

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

      {/* Comando de Verificação Atualizado */}
      <Card className="border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Terminal className="h-6 w-6" />
            Verificação Pós-Correção
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            <div>
              <h4 className="font-semibold mb-2">🔍 Comando de Verificação Atualizado:</h4>
              <div className="bg-gray-100 p-3 rounded-md text-sm font-mono">
                <pre>{`#!/bin/bash
# VERIFICAÇÃO PÓS-CORREÇÃO QR Base64
echo "🔍 VERIFICAÇÃO: Correção QR Base64 Aplicada"
echo "========================================"

VPS_IP="31.97.24.222"
VPS_PORT="3002"
AUTH_TOKEN="3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3"

# 1. Verificar versão do servidor (deve ser 4.2.1-QR-BASE64-FIXED)
echo "1️⃣ HEALTH CHECK - Verificando versão corrigida"
echo "=============================================="
HEALTH_RESPONSE=$(curl -s "http://\${VPS_IP}:\${VPS_PORT}/health")
echo "$HEALTH_RESPONSE" | jq '{
  status: .status,
  version: .version,
  qr_base64_fixed: .qr_base64_fixed,
  active_instances: .active_instances,
  complete_implementation: .complete_implementation
}'

VERSION=$(echo "$HEALTH_RESPONSE" | jq -r '.version // "unknown"')
echo ""
if [[ "$VERSION" == *"QR-BASE64-FIXED"* ]]; then
  echo "✅ CORREÇÃO APLICADA: Versão $VERSION detectada"
else
  echo "❌ CORREÇÃO NÃO APLICADA: Versão $VERSION (esperado: *QR-BASE64-FIXED*)"
  echo "   Execute a correção novamente via interface"
  exit 1
fi

# 2. Teste de criação com verificação de formato QR
echo ""
echo "2️⃣ TESTE DE INSTÂNCIA - Formato QR Base64"
echo "========================================"
INSTANCE_NAME="verify_qr_\$(date +%s)"

# Criar instância
echo "📤 Criando instância: \$INSTANCE_NAME"
CREATE_RESPONSE=\$(curl -s -X POST "http://\${VPS_IP}:\${VPS_PORT}/instance/create" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \${AUTH_TOKEN}" \\
  --data '{"instanceId":"'\$INSTANCE_NAME'","sessionName":"VerifyQR","webhookUrl":"https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/webhook_whatsapp_web"}')

echo "\$CREATE_RESPONSE" | jq '{success: .success, instanceId: .instanceId, status: .status}'

if [[ \$(echo "\$CREATE_RESPONSE" | jq -r '.success') != "true" ]]; then
  echo "❌ Falha na criação da instância"
  exit 1
fi

# Aguardar QR Code
echo ""
echo "⏳ Aguardando QR Code (25 segundos)..."
sleep 25

# 3. Verificar formato QR Code corrigido
echo ""
echo "3️⃣ VERIFICAÇÃO QR CODE - Formato Base64 DataURL"
echo "============================================="
QR_RESPONSE=\$(curl -s -X POST "http://\${VPS_IP}:\${VPS_PORT}/instance/qr" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer \${AUTH_TOKEN}" \\
  --data '{"instanceId":"'\$INSTANCE_NAME'"}')

echo "\$QR_RESPONSE" | jq '{
  success: .success,
  qr_format: .qr_format,
  has_qr_code: .has_qr_code,
  status: .status
}'

QR_CODE=\$(echo "\$QR_RESPONSE" | jq -r '.qrCode // "null"')
echo ""
if [[ "\$QR_CODE" == data:image/png;base64,* ]]; then
  echo "✅ QR CODE CORRIGIDO: Formato data:image/png;base64, detectado"
  echo "📏 Tamanho QR: \${#QR_CODE} caracteres"
  echo "🔍 Preview: \${QR_CODE:0:60}..."
else
  echo "❌ QR CODE INCORRETO: Não está em formato DataURL"
  echo "🔍 Formato atual: \${QR_CODE:0:60}..."
  echo "   Esperado: data:image/png;base64,..."
fi

# 4. Limpeza
echo ""
echo "4️⃣ LIMPEZA DO TESTE"
echo "=================="
curl -s -X DELETE "http://\${VPS_IP}:\${VPS_PORT}/instance/\${INSTANCE_NAME}" \\
  -H "Authorization: Bearer \${AUTH_TOKEN}" | jq '{success: .success}'

echo ""
echo "🏁 VERIFICAÇÃO CONCLUÍDA!"
echo "========================"
echo "✓ Versão do servidor verificada"
echo "✓ Formato QR Code validado"
echo "✓ Correção Base64 testada"
echo ""
echo "📋 Se tudo estiver ✅, a correção foi aplicada com sucesso!"
echo "📋 Se algo estiver ❌, execute a correção novamente via interface"`}</pre>
              </div>
            </div>

            <div>
              <h4 className="font-semibold mb-2">✅ O que Deve Aparecer Após a Correção:</h4>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li><strong>Versão:</strong> 4.2.1-QR-BASE64-FIXED (ou similar)</li>
                <li><strong>qr_base64_fixed:</strong> true</li>
                <li><strong>qr_format:</strong> "base64_data_url"</li>
                <li><strong>QR Code:</strong> Começa com "data:image/png;base64,"</li>
                <li><strong>Tamanho QR:</strong> Mais de 1000 caracteres (QR real)</li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-2">🔧 Principais Melhorias na Correção:</h4>
              <ul className="list-disc list-inside text-sm space-y-1 ml-4">
                <li>Função ensureBase64Format() tolerante a diferentes formatos</li>
                <li>Endpoint /instance/qr sempre retorna DataURL válido</li>
                <li>Validação prévia antes de retornar QR Code</li>
                <li>Conversão automática de string para Base64 quando necessário</li>
                <li>Logs detalhados para debugging</li>
                <li>Endpoints JSON sempre válidos (sem erros de parsing)</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
