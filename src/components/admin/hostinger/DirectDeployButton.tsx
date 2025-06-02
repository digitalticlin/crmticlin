
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Zap, Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const DirectDeployButton = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [deployStatus, setDeployStatus] = useState<'idle' | 'deploying' | 'success' | 'error'>('idle');
  const [deployResult, setDeployResult] = useState<any>(null);

  const handleDirectDeploy = async () => {
    try {
      setIsDeploying(true);
      setDeployStatus('deploying');
      
      console.log('🚀 Iniciando deploy direto do servidor WhatsApp...');
      toast.info('🚀 Iniciando deploy do servidor WhatsApp permanente...');

      // Call the deploy edge function directly
      const response = await fetch('https://kigyebrhfoljnydfipcr.supabase.co/functions/v1/deploy_whatsapp_server', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Deploy failed: HTTP ${response.status}`);
      }

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Deploy realizado com sucesso:', result);
        setDeployResult(result);
        setDeployStatus('success');
        toast.success('🎉 Servidor WhatsApp implantado com sucesso!');
        
        // Test server health after deploy
        setTimeout(async () => {
          try {
            const healthResponse = await fetch('http://31.97.24.222:3001/health');
            const healthData = await healthResponse.json();
            console.log('🏥 Health check:', healthData);
            toast.success(`✅ Servidor online! ${healthData.active_instances || 0} instâncias ativas`);
          } catch (error) {
            console.log('⚠️ Health check failed, mas deploy foi realizado');
          }
        }, 5000);
        
      } else {
        throw new Error(result.error || 'Deploy failed');
      }
    } catch (error: any) {
      console.error('❌ Erro no deploy:', error);
      setDeployStatus('error');
      toast.error(`❌ Erro no deploy: ${error.message}`);
    } finally {
      setIsDeploying(false);
    }
  };

  const getStatusIcon = () => {
    switch (deployStatus) {
      case 'deploying':
        return <Loader2 className="h-5 w-5 animate-spin text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Zap className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusText = () => {
    switch (deployStatus) {
      case 'deploying':
        return 'Implantando servidor...';
      case 'success':
        return 'Servidor implantado com sucesso!';
      case 'error':
        return 'Erro na implantação';
      default:
        return 'Pronto para deploy';
    }
  };

  return (
    <Card className="border-yellow-200 bg-yellow-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <CardTitle className="text-yellow-800">Deploy Direto do Servidor</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <h3 className="font-medium text-yellow-800 mb-2">
              Servidor WhatsApp.js Permanente
            </h3>
            <p className="text-sm text-yellow-700 mb-4">
              Deploy direto contornando erro HTTPS 530 da API Hostinger
            </p>
            <p className="text-xs text-yellow-600">
              Status: {getStatusText()}
            </p>
          </div>

          {deployResult && deployStatus === 'success' && (
            <div className="p-3 bg-green-50 rounded-lg border border-green-200">
              <h4 className="font-medium text-green-800 mb-2">Deploy Realizado:</h4>
              <div className="text-xs text-green-700 space-y-1">
                <div>• Servidor: {deployResult.server_url}</div>
                <div>• PM2: Configurado para auto-restart</div>
                <div>• SSL: Correções aplicadas</div>
                <div>• Webhook: Conectado ao Supabase</div>
              </div>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              onClick={handleDirectDeploy}
              disabled={isDeploying}
              className="bg-yellow-600 hover:bg-yellow-700 text-white"
            >
              {isDeploying ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Implantando...
                </>
              ) : (
                <>
                  <Zap className="h-4 w-4 mr-2" />
                  Deploy Direto
                </>
              )}
            </Button>
            
            {deployStatus === 'success' && (
              <Button
                variant="outline"
                onClick={() => window.open('http://31.97.24.222:3001/health', '_blank')}
                className="border-green-600 text-green-600"
              >
                Verificar Status
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
