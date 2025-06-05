
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Globe, CheckCircle2, XCircle, RefreshCcw, Settings } from "lucide-react";
import { GlobalWebhookService } from "@/services/whatsapp/globalWebhookService";

export const GlobalWebhookManager = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [webhookStatus, setWebhookStatus] = useState<any>(null);

  const handleConfigureWebhook = async () => {
    setIsLoading(true);
    try {
      const result = await GlobalWebhookService.configureGlobalWebhook();
      
      if (result.success) {
        toast.success('Webhook global configurado com sucesso!');
        await checkWebhookStatus();
      } else {
        toast.error(`Erro ao configurar webhook: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao configurar webhook:', error);
      toast.error('Erro ao configurar webhook global');
    } finally {
      setIsLoading(false);
    }
  };

  const checkWebhookStatus = async () => {
    setIsLoading(true);
    try {
      const result = await GlobalWebhookService.checkGlobalWebhookStatus();
      
      if (result.success) {
        setWebhookStatus(result.status);
        toast.success('Status do webhook verificado');
      } else {
        toast.error(`Erro ao verificar status: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao verificar status:', error);
      toast.error('Erro ao verificar status do webhook');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDisableWebhook = async () => {
    setIsLoading(true);
    try {
      const result = await GlobalWebhookService.disableGlobalWebhook();
      
      if (result.success) {
        toast.success('Webhook global desabilitado');
        setWebhookStatus(null);
      } else {
        toast.error(`Erro ao desabilitar webhook: ${result.error}`);
      }
    } catch (error) {
      console.error('Erro ao desabilitar webhook:', error);
      toast.error('Erro ao desabilitar webhook global');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = () => {
    if (!webhookStatus) {
      return (
        <Badge variant="secondary" className="gap-2">
          <XCircle className="h-3 w-3" />
          Desconhecido
        </Badge>
      );
    }

    if (webhookStatus.enabled) {
      return (
        <Badge className="bg-green-100 text-green-800 gap-2">
          <CheckCircle2 className="h-3 w-3" />
          Ativo
        </Badge>
      );
    }

    return (
      <Badge variant="destructive" className="gap-2">
        <XCircle className="h-3 w-3" />
        Inativo
      </Badge>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-blue-600" />
            Webhook Global Multi-Tenant
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            Configure o webhook global na VPS para receber mensagens de todas as instâncias 
            automaticamente no sistema multi-tenant.
          </p>
          
          {webhookStatus && (
            <div className="bg-gray-50 p-3 rounded-lg space-y-2">
              <div className="font-medium">Status Atual:</div>
              <div className="text-xs space-y-1">
                <div>• URL: {webhookStatus.webhookUrl || 'Não configurado'}</div>
                <div>• Eventos: {webhookStatus.events?.join(', ') || 'Nenhum'}</div>
                <div>• Instâncias conectadas: {webhookStatus.connectedInstances || 0}</div>
              </div>
            </div>
          )}
        </div>

        <div className="flex gap-3 flex-wrap">
          <Button 
            onClick={handleConfigureWebhook}
            disabled={isLoading}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Configurar Webhook
          </Button>

          <Button 
            onClick={checkWebhookStatus}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            Verificar Status
          </Button>

          {webhookStatus?.enabled && (
            <Button 
              onClick={handleDisableWebhook}
              disabled={isLoading}
              variant="destructive"
              className="gap-2"
            >
              <XCircle className="h-4 w-4" />
              Desabilitar
            </Button>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-2">Como funciona:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Configura webhook global na VPS (31.97.24.222:3001)</li>
            <li>• Todas as instâncias enviam mensagens para o Supabase automaticamente</li>
            <li>• Sistema identifica empresa por vps_instance_id</li>
            <li>• Cria leads e mensagens automaticamente</li>
            <li>• Suporta múltiplas empresas simultaneamente</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
