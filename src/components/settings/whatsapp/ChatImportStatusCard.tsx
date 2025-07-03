
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Clock, CheckCircle, AlertCircle, Loader2, PlayCircle, StopCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface ImportSession {
  id: string;
  session_id: string;
  instance_id: string;
  user_id: string;
  status: string; // Allow any string from database
  progress: number;
  total_contacts: number;
  total_messages: number;
  qr_code?: string;
  error_message?: string;
  created_at: string;
  updated_at: string;
  completed_at?: string;
}

interface ChatImportStatusCardProps {
  instanceId: string;
  instanceName: string;
}

export function ChatImportStatusCard({ instanceId, instanceName }: ChatImportStatusCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [importSession, setImportSession] = useState<ImportSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [isStopping, setIsStopping] = useState(false);

  // Buscar sessão ativa
  const fetchActiveSession = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('instances_puppeteer')
        .select('*')
        .eq('instance_id', instanceId)
        .eq('user_id', user.id)
        .in('status', ['waiting_qr', 'scanning_qr', 'connecting', 'importing_contacts', 'importing_messages'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Erro ao buscar sessão:', error);
        return;
      }

      if (data) {
        setImportSession(data as ImportSession);
      }
    } catch (error) {
      console.error('Erro ao buscar sessão:', error);
    }
  };

  // Iniciar importação
  const startImport = async () => {
    if (!user) {
      toast({
        title: "Erro",
        description: "Usuário não autenticado",
        variant: "destructive",
      });
      return;
    }

    setIsStarting(true);
    
    try {
      // Criar nova sessão
      const sessionId = `session_${Date.now()}`;
      
      const { data, error } = await supabase
        .from('instances_puppeteer')
        .insert({
          session_id: sessionId,
          instance_id: instanceId,
          user_id: user.id,
          status: 'waiting_qr',
          progress: 0
        })
        .select()
        .single();

      if (error) throw error;

      setImportSession(data as ImportSession);
      
      toast({
        title: "Sucesso",
        description: "Importação iniciada com sucesso!",
      });

      // Iniciar polling para atualizações
      pollForUpdates(data.id);

    } catch (error: any) {
      console.error('Erro ao iniciar importação:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao iniciar importação",
        variant: "destructive",
      });
    } finally {
      setIsStarting(false);
    }
  };

  // Parar importação
  const stopImport = async () => {
    if (!importSession) return;

    setIsStopping(true);
    
    try {
      const { error } = await supabase
        .from('instances_puppeteer')
        .update({ 
          status: 'failed',
          error_message: 'Cancelado pelo usuário',
          completed_at: new Date().toISOString()
        })
        .eq('id', importSession.id);

      if (error) throw error;

      setImportSession(null);
      
      toast({
        title: "Sucesso",
        description: "Importação cancelada com sucesso!",
      });

    } catch (error: any) {
      console.error('Erro ao parar importação:', error);
      toast({
        title: "Erro",
        description: error.message || "Erro ao cancelar importação",
        variant: "destructive",
      });
    } finally {
      setIsStopping(false);
    }
  };

  // Polling para atualizações
  const pollForUpdates = async (sessionId: string) => {
    const interval = setInterval(async () => {
      try {
        const { data, error } = await supabase
          .from('instances_puppeteer')
          .select('*')
          .eq('id', sessionId)
          .single();

        if (error) {
          console.error('Erro no polling:', error);
          clearInterval(interval);
          return;
        }

        if (data) {
          setImportSession(data as ImportSession);
          
          // Parar polling se completou ou falhou
          if (data.status === 'completed' || data.status === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (error) {
        console.error('Erro no polling:', error);
        clearInterval(interval);
      }
    }, 2000);

    // Parar polling após 30 minutos
    setTimeout(() => clearInterval(interval), 30 * 60 * 1000);
  };

  // Buscar sessão ao carregar
  useState(() => {
    fetchActiveSession();
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'waiting_qr':
        return <Badge variant="outline" className="text-yellow-600 border-yellow-600">Aguardando QR</Badge>;
      case 'scanning_qr':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Escaneando QR</Badge>;
      case 'connecting':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Conectando</Badge>;
      case 'importing_contacts':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Importando Contatos</Badge>;
      case 'importing_messages':
        return <Badge variant="outline" className="text-blue-600 border-blue-600">Importando Mensagens</Badge>;
      case 'completed':
        return <Badge variant="outline" className="text-green-600 border-green-600">Concluído</Badge>;
      case 'failed':
        return <Badge variant="outline" className="text-red-600 border-red-600">Falhou</Badge>;
      default:
        return <Badge variant="outline">Desconhecido</Badge>;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'waiting_qr':
      case 'scanning_qr':
      case 'connecting':
        return <Clock className="h-4 w-4" />;
      case 'importing_contacts':
      case 'importing_messages':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          {importSession ? getStatusIcon(importSession.status) : <Clock className="h-4 w-4" />}
          Importação de Histórico
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {importSession ? (
          <>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Status:</span>
              {getStatusBadge(importSession.status)}
            </div>

            {importSession.progress > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span>Progresso:</span>
                  <span>{importSession.progress}%</span>
                </div>
                <Progress value={importSession.progress} className="h-2" />
              </div>
            )}

            {importSession.total_contacts > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span>Contatos:</span>
                <span>{importSession.total_contacts}</span>
              </div>
            )}

            {importSession.total_messages > 0 && (
              <div className="flex items-center justify-between text-sm">
                <span>Mensagens:</span>
                <span>{importSession.total_messages}</span>
              </div>
            )}

            {importSession.qr_code && (
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-2">
                  Escaneie o QR Code com seu WhatsApp:
                </p>
                <img 
                  src={importSession.qr_code} 
                  alt="QR Code" 
                  className="mx-auto max-w-[200px] border rounded"
                />
              </div>
            )}

            {importSession.error_message && (
              <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {importSession.error_message}
              </div>
            )}

            {importSession.status !== 'completed' && importSession.status !== 'failed' && (
              <Button
                onClick={stopImport}
                disabled={isStopping}
                variant="destructive"
                className="w-full"
              >
                {isStopping ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <StopCircle className="h-4 w-4 mr-2" />
                )}
                Cancelar Importação
              </Button>
            )}
          </>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Importe todo o histórico de conversas do WhatsApp para esta instância.
            </p>
            
            <Button
              onClick={startImport}
              disabled={isStarting}
              className="w-full"
            >
              {isStarting ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <PlayCircle className="h-4 w-4 mr-2" />
              )}
              Iniciar Importação
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
}
