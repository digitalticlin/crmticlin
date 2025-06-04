
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/integrations/supabase/client';
import { 
  Search, 
  AlertTriangle, 
  CheckCircle, 
  RefreshCw,
  Database,
  Server,
  Users,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

export const VPSDiagnosticPanel = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState<any>(null);
  const [syncResult, setSyncResult] = useState<any>(null);

  const runDiagnosis = async () => {
    setIsLoading(true);
    try {
      console.log('[VPS Diagnostic] 🔍 Iniciando diagnóstico...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { action: 'diagnose_vps' }
      });

      if (error) {
        console.error('[VPS Diagnostic] ❌ Erro na edge function:', error);
        toast.error(`Erro no diagnóstico: ${error.message}`);
        return;
      }

      console.log('[VPS Diagnostic] ✅ Diagnóstico concluído:', data);
      setDiagnosis(data);
      
      if (data.success) {
        toast.success(`Diagnóstico concluído: ${data.summary.vpsInstances} instâncias na VPS, ${data.summary.supabaseInstances} no Supabase`);
      } else {
        toast.error(`Falha no diagnóstico: ${data.error}`);
      }
    } catch (error: any) {
      console.error('[VPS Diagnostic] 💥 Erro inesperado:', error);
      toast.error(`Erro inesperado: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const runEmergencySync = async () => {
    if (!confirm('Executar sincronização de emergência? Isso criará entradas no Supabase para instâncias encontradas na VPS.')) {
      return;
    }

    setIsLoading(true);
    try {
      console.log('[VPS Diagnostic] 🆘 Iniciando sincronização de emergência...');
      
      const { data, error } = await supabase.functions.invoke('whatsapp_web_server', {
        body: { action: 'emergency_sync' }
      });

      if (error) {
        console.error('[VPS Diagnostic] ❌ Erro na sincronização:', error);
        toast.error(`Erro na sincronização: ${error.message}`);
        return;
      }

      console.log('[VPS Diagnostic] ✅ Sincronização concluída:', data);
      setSyncResult(data);
      
      if (data.success) {
        toast.success(`Sincronização concluída: ${data.synchronized} instâncias sincronizadas`);
        // Reexecutar diagnóstico após sync
        setTimeout(() => runDiagnosis(), 1000);
      } else {
        toast.error(`Falha na sincronização: ${data.error}`);
      }
    } catch (error: any) {
      console.error('[VPS Diagnostic] 💥 Erro inesperado:', error);
      toast.error(`Erro inesperado: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (success: boolean, label: string) => {
    return (
      <Badge variant={success ? "default" : "destructive"} className="ml-2">
        {success ? (
          <CheckCircle className="h-3 w-3 mr-1" />
        ) : (
          <AlertTriangle className="h-3 w-3 mr-1" />
        )}
        {label}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Controles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Diagnóstico VPS ↔ Supabase
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <Button 
              onClick={runDiagnosis}
              disabled={isLoading}
              variant="outline"
            >
              {isLoading ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Executar Diagnóstico
            </Button>
            
            <Button 
              onClick={runEmergencySync}
              disabled={isLoading || !diagnosis?.diagnosis?.vps?.instances?.length}
              variant="destructive"
            >
              <Zap className="h-4 w-4 mr-2" />
              Sincronização de Emergência
            </Button>
          </div>
          
          <p className="text-sm text-muted-foreground mt-2">
            Execute o diagnóstico para verificar instâncias na VPS e sincronização com Supabase
          </p>
        </CardContent>
      </Card>

      {/* Resultados do Diagnóstico */}
      {diagnosis && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* VPS Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Server className="h-4 w-4 mr-2" />
                Status VPS
                {getStatusBadge(diagnosis.diagnosis.vps.connectivity, 
                  diagnosis.diagnosis.vps.connectivity ? 'Online' : 'Offline')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {diagnosis.diagnosis.vps.instanceCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Instâncias na VPS
                </div>
                {diagnosis.diagnosis.vps.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription className="text-xs">
                      {diagnosis.diagnosis.vps.error}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Supabase Status */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Status Supabase
                {getStatusBadge(!diagnosis.diagnosis.supabase.error, 
                  !diagnosis.diagnosis.supabase.error ? 'Online' : 'Erro')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {diagnosis.diagnosis.supabase.instanceCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Instâncias no Supabase
                </div>
                {diagnosis.diagnosis.supabase.error && (
                  <Alert variant="destructive" className="mt-2">
                    <AlertDescription className="text-xs">
                      {diagnosis.diagnosis.supabase.error.message}
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Usuários */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center">
                <Users className="h-4 w-4 mr-2" />
                Usuários
                {getStatusBadge(diagnosis.diagnosis.users.profileCount > 0, 
                  diagnosis.diagnosis.users.profileCount > 0 ? 'Encontrados' : 'Nenhum')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">
                  {diagnosis.diagnosis.users.profileCount}
                </div>
                <div className="text-sm text-muted-foreground">
                  Profiles com company_id
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Problemas Identificados */}
      {diagnosis?.diagnosis?.issues?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-red-600 flex items-center">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Problemas Identificados
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {diagnosis.diagnosis.issues.map((issue: string, index: number) => (
                <li key={index} className="text-sm text-red-600 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-2" />
                  {issue}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Resultado da Sincronização */}
      {syncResult && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm text-green-600 flex items-center">
              <CheckCircle className="h-4 w-4 mr-2" />
              Resultado da Sincronização de Emergência
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-lg font-semibold">
                {syncResult.synchronized} instâncias sincronizadas
              </div>
              <div className="text-sm text-muted-foreground">
                de {syncResult.totalVpsInstances} encontradas na VPS
              </div>
              {syncResult.errors?.length > 0 && (
                <Alert variant="destructive" className="mt-2">
                  <AlertDescription className="text-xs">
                    <strong>Erros:</strong>
                    <ul className="mt-1 ml-4">
                      {syncResult.errors.map((error: string, index: number) => (
                        <li key={index} className="list-disc">{error}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Detalhes das Instâncias VPS */}
      {diagnosis?.diagnosis?.vps?.instances?.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Instâncias Encontradas na VPS</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {diagnosis.diagnosis.vps.instances.map((instance: any, index: number) => (
                <div key={index} className="text-xs p-2 bg-gray-50 rounded border">
                  <div className="font-mono">{instance.instanceId}</div>
                  <div className="text-muted-foreground">
                    Status: {instance.status} | 
                    Phone: {instance.phone || 'N/A'} | 
                    Profile: {instance.profileName || 'N/A'}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
