
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Trash2, RefreshCw, List, AlertTriangle, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CleanupResult {
  success: boolean;
  total_instances?: number;
  deleted_count?: number;
  failed_count?: number;
  error?: string;
  instances?: any[];
}

export const VPSCleanupTool = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [lastResult, setLastResult] = useState<CleanupResult | null>(null);

  const handleListInstances = async () => {
    setIsLoading(true);
    try {
      console.log('[VPS Cleanup] 📋 Listando instâncias da VPS...');

      const { data, error } = await supabase.functions.invoke('vps_cleanup_service', {
        body: { action: 'list_instances' }
      });

      if (error) throw new Error(error.message);

      setLastResult(data);
      
      if (data.success) {
        toast.success(`📊 ${data.total} instâncias encontradas na VPS`, { duration: 5000 });
      } else {
        toast.error(`Erro ao listar: ${data.error}`);
      }

    } catch (error: any) {
      console.error('[VPS Cleanup] ❌ Erro:', error);
      toast.error(`Erro: ${error.message}`);
      setLastResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAllInstances = async () => {
    if (!confirm('⚠️ ATENÇÃO: Isso deletará TODAS as instâncias da VPS. Confirma?')) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('[VPS Cleanup] 🔥 Deletando todas as instâncias...');

      const { data, error } = await supabase.functions.invoke('vps_cleanup_service', {
        body: { action: 'delete_all_instances' }
      });

      if (error) throw new Error(error.message);

      setLastResult(data);
      
      if (data.success) {
        toast.success(`🗑️ Limpeza concluída: ${data.deleted_count} deletadas, ${data.failed_count} falhas`, { 
          duration: 8000 
        });
      } else {
        toast.error(`Erro na limpeza: ${data.error}`);
      }

    } catch (error: any) {
      console.error('[VPS Cleanup] ❌ Erro:', error);
      toast.error(`Erro: ${error.message}`);
      setLastResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFullCleanup = async () => {
    if (!confirm('⚠️ LIMPEZA COMPLETA: Deletará instâncias + cache + reiniciará servidor. Confirma?')) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('[VPS Cleanup] 🧹 Limpeza completa iniciada...');

      const { data, error } = await supabase.functions.invoke('vps_cleanup_service', {
        body: { action: 'full_cleanup' }
      });

      if (error) throw new Error(error.message);

      setLastResult(data);
      
      if (data.success) {
        toast.success('🧹 Limpeza completa executada com sucesso!', { duration: 10000 });
      } else {
        toast.error(`Erro na limpeza completa: ${data.error}`);
      }

    } catch (error: any) {
      console.error('[VPS Cleanup] ❌ Erro:', error);
      toast.error(`Erro: ${error.message}`);
      setLastResult({ success: false, error: error.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-red-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-red-800">
          <Trash2 className="h-5 w-5" />
          Limpeza da VPS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-700">
          <p>🔥 <strong>Objetivo:</strong> Limpar instâncias órfãs da VPS que não estão sincronizadas</p>
          <p>⚠️ <strong>CUIDADO:</strong> Use apenas quando necessário - irá deletar TODAS as instâncias</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            onClick={handleListInstances}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            <List className="h-4 w-4" />
            Listar Instâncias
          </Button>

          <Button
            onClick={handleDeleteAllInstances}
            disabled={isLoading}
            variant="destructive"
            className="gap-2"
          >
            <Trash2 className="h-4 w-4" />
            Deletar Todas
          </Button>

          <Button
            onClick={handleFullCleanup}
            disabled={isLoading}
            variant="destructive"
            className="gap-2 bg-red-700 hover:bg-red-800"
          >
            {isLoading ? (
              <RefreshCw className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Limpeza Completa
          </Button>
        </div>

        {lastResult && (
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Último Resultado:</span>
              {lastResult.success ? (
                <Badge className="bg-green-100 text-green-800">
                  <CheckCircle className="h-3 w-3 mr-1" />
                  Sucesso
                </Badge>
              ) : (
                <Badge className="bg-red-100 text-red-800">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  Erro
                </Badge>
              )}
            </div>

            {lastResult.success && lastResult.instances && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <h4 className="text-sm font-medium text-blue-800 mb-2">
                  📊 Instâncias na VPS ({lastResult.instances.length})
                </h4>
                <div className="max-h-40 overflow-y-auto space-y-1">
                  {lastResult.instances.map((instance, index) => (
                    <div key={index} className="text-xs text-blue-700 flex items-center justify-between">
                      <span>{instance.instanceId}</span>
                      <Badge variant={instance.status === 'ready' ? 'default' : 'secondary'} className="text-xs">
                        {instance.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {lastResult.success && typeof lastResult.deleted_count === 'number' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                <h4 className="text-sm font-medium text-green-800 mb-2">
                  ✅ Resultado da Limpeza
                </h4>
                <div className="text-xs text-green-700 space-y-1">
                  <p><strong>Total de instâncias:</strong> {lastResult.total_instances}</p>
                  <p><strong>Deletadas com sucesso:</strong> {lastResult.deleted_count}</p>
                  <p><strong>Falhas:</strong> {lastResult.failed_count}</p>
                </div>
              </div>
            )}

            {!lastResult.success && lastResult.error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <h4 className="text-sm font-medium text-red-800 mb-2">
                  ❌ Erro
                </h4>
                <p className="text-xs text-red-700">{lastResult.error}</p>
              </div>
            )}
          </div>
        )}

        <div className="text-xs text-gray-500 bg-yellow-50 p-3 rounded border border-yellow-200">
          <p><strong>⚠️ ATENÇÃO:</strong></p>
          <p>1. "Listar Instâncias" mostra quantas existem na VPS</p>
          <p>2. "Deletar Todas" remove uma por uma da VPS</p>
          <p>3. "Limpeza Completa" deleta + limpa cache + reinicia servidor</p>
          <p>4. Após limpeza, teste criando uma nova instância</p>
        </div>
      </CardContent>
    </Card>
  );
};
