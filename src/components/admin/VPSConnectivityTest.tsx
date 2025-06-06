
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";

export const VPSConnectivityTest = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await WhatsAppWebService.checkServerHealth();
      if (response.success) {
        setResult({
          success: true,
          status: response.data.status || 'online',
          connectivity: true
        });
      } else {
        setError(response.error || "Falha na conexão com o servidor");
        setResult({
          success: false,
          status: 'offline'
        });
      }
    } catch (err: any) {
      setError(err.message || "Erro ao testar conexão");
      setResult({
        success: false,
        status: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle>Teste de Conectividade VPS</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center text-center p-4">
          {result ? (
            <div className="mb-4">
              {result.success ? (
                <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-2" />
              ) : (
                <XCircle className="h-16 w-16 text-red-500 mx-auto mb-2" />
              )}
              <h3 className="text-lg font-medium">
                {result.success ? 'Conexão Bem-Sucedida!' : 'Falha na Conexão'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Status: {result.status}
              </p>
              {error && (
                <p className="text-sm text-red-500 mt-2 p-2 bg-red-50 border border-red-100 rounded">
                  {error}
                </p>
              )}
            </div>
          ) : (
            <p className="mb-4 text-muted-foreground">
              Verifique se o servidor WhatsApp está acessível
            </p>
          )}

          <Button
            onClick={testConnection}
            disabled={loading}
            variant={result?.success ? "outline" : "default"}
            className={result?.success ? "border-green-500 text-green-600" : ""}
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testando...
              </>
            ) : (
              'Testar Conexão'
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
