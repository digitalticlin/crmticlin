
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Clock, Play, Square, Settings, CheckCircle2, AlertCircle } from "lucide-react";

export const AutoSyncConfigManager = () => {
  const [cronStatus, setCronStatus] = useState<'active' | 'inactive' | 'unknown'>('unknown');
  const [loading, setLoading] = useState(false);

  const setupCronJob = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup_auto_sync', {
        body: { action: 'setup_cron' }
      });

      if (error) throw error;

      toast.success('Sincronização automática ativada! Executará a cada 10 minutos.');
      setCronStatus('active');
    } catch (error) {
      console.error('Erro ao configurar cron:', error);
      toast.error('Erro ao ativar sincronização automática');
    } finally {
      setLoading(false);
    }
  };

  const disableCronJob = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('setup_auto_sync', {
        body: { action: 'disable_cron' }
      });

      if (error) throw error;

      toast.success('Sincronização automática desativada');
      setCronStatus('inactive');
    } catch (error) {
      console.error('Erro ao desabilitar cron:', error);
      toast.error('Erro ao desativar sincronização automática');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = () => {
    switch (cronStatus) {
      case 'active':
        return (
          <Badge className="bg-green-100 text-green-800 gap-2">
            <CheckCircle2 className="h-3 w-3" />
            Ativo (10 min)
          </Badge>
        );
      case 'inactive':
        return (
          <Badge className="bg-red-100 text-red-800 gap-2">
            <Square className="h-3 w-3" />
            Inativo
          </Badge>
        );
      default:
        return (
          <Badge className="bg-gray-100 text-gray-800 gap-2">
            <AlertCircle className="h-3 w-3" />
            Desconhecido
          </Badge>
        );
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-blue-600" />
            Configuração da Sincronização Automática
          </div>
          {getStatusBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600">
          <p className="mb-2">
            Configure a sincronização automática para executar periodicamente e manter 
            suas instâncias WhatsApp sempre atualizadas.
          </p>
          <div className="flex items-center gap-2 text-xs bg-blue-50 p-2 rounded">
            <Clock className="h-4 w-4 text-blue-500" />
            <span>Frequência: A cada 10 minutos</span>
          </div>
        </div>

        <div className="flex gap-3">
          {cronStatus !== 'active' ? (
            <Button 
              onClick={setupCronJob}
              disabled={loading}
              className="gap-2"
            >
              <Play className="h-4 w-4" />
              Ativar Sync Automático
            </Button>
          ) : (
            <Button 
              onClick={disableCronJob}
              disabled={loading}
              variant="destructive"
              className="gap-2"
            >
              <Square className="h-4 w-4" />
              Desativar Sync Automático
            </Button>
          )}
        </div>

        <div className="border-t pt-4">
          <h4 className="font-medium text-sm mb-2">Como funciona:</h4>
          <ul className="text-xs text-gray-600 space-y-1">
            <li>• Verifica instâncias na VPS a cada 10 minutos</li>
            <li>• Adiciona novas instâncias como "órfãs" no Supabase</li>
            <li>• Atualiza status das instâncias existentes</li>
            <li>• Gera logs para monitoramento</li>
            <li>• Permite vinculação manual posterior</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
};
