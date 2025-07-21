
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Database, AlertCircle, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface MessageStats {
  totalMessages: number;
  lastMessageDate: string | null;
  messagesLast24h: number;
  messagesLast7days: number;
  instancesActive: number;
}

interface MessageRow {
  id: string;
  timestamp: string | null;
  created_at: string;
}

interface InstanceRow {
  id: string;
  instance_name: string;
}

export const MessageHistoryAnalyzer = () => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<MessageStats | null>(null);

  const analyzeMessageHistory = async () => {
    setLoading(true);
    try {
      // Buscar estatísticas das mensagens com tipos explícitos
      const { data: messagesData, error: messagesError } = await supabase
        .from('messages')
        .select('id, timestamp, created_at')
        .order('timestamp', { ascending: false })
        .limit(1000);

      if (messagesError) {
        throw messagesError;
      }

      const messages = messagesData as MessageRow[];
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const messagesLast24h = messages?.filter(m => 
        new Date(m.timestamp || m.created_at) > yesterday
      ).length || 0;

      const messagesLast7days = messages?.filter(m => 
        new Date(m.timestamp || m.created_at) > weekAgo
      ).length || 0;

      // Buscar instâncias ativas com tipo explícito
      const { data: instancesData, error: instancesError } = await supabase
        .from('whatsapp_instances')
        .select('id, instance_name')
        .eq('connection_status', 'connected');

      if (instancesError) {
        throw instancesError;
      }

      const instances = instancesData as InstanceRow[];
      const lastMessage = messages && messages.length > 0 ? messages[0] : null;

      setStats({
        totalMessages: messages?.length || 0,
        lastMessageDate: lastMessage ? (lastMessage.timestamp || lastMessage.created_at) : null,
        messagesLast24h,
        messagesLast7days,
        instancesActive: instances?.length || 0
      });

      toast({
        title: "✅ Análise Concluída",
        description: `Encontradas ${messages?.length || 0} mensagens no histórico`,
      });

    } catch (error) {
      console.error("Erro na análise:", error);
      toast({
        title: "❌ Erro na Análise",
        description: "Não foi possível analisar o histórico de mensagens",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    analyzeMessageHistory();
  }, []);

  const getStatusColor = (messagesLast24h: number) => {
    if (messagesLast24h === 0) return 'destructive';
    if (messagesLast24h < 5) return 'secondary';
    return 'default';
  };

  const getRecommendation = () => {
    if (!stats) return null;

    if (stats.messagesLast24h === 0) {
      return {
        type: 'critical',
        message: 'Nenhuma mensagem recebida nas últimas 24h - webhook pode estar quebrado'
      };
    }

    if (stats.messagesLast24h < stats.messagesLast7days / 7) {
      return {
        type: 'warning', 
        message: 'Redução significativa no volume de mensagens'
      };
    }

    return {
      type: 'success',
      message: 'Volume de mensagens estável'
    };
  };

  const recommendation = getRecommendation();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          Análise do Histórico de Mensagens
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {stats && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.totalMessages}</div>
                <div className="text-sm text-gray-600">Total de Mensagens</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{stats.messagesLast24h}</div>
                <div className="text-sm text-gray-600">Últimas 24h</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">{stats.messagesLast7days}</div>
                <div className="text-sm text-gray-600">Últimos 7 dias</div>
              </div>
              
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">{stats.instancesActive}</div>
                <div className="text-sm text-gray-600">Instâncias Ativas</div>
              </div>
            </div>

            {stats.lastMessageDate && (
              <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                <Calendar className="h-4 w-4 text-blue-600" />
                <span className="text-sm">
                  <strong>Última mensagem:</strong> {new Date(stats.lastMessageDate).toLocaleString('pt-BR')}
                </span>
              </div>
            )}

            {recommendation && (
              <div className={`flex items-center gap-2 p-3 rounded-lg ${
                recommendation.type === 'critical' ? 'bg-red-50 text-red-700' :
                recommendation.type === 'warning' ? 'bg-yellow-50 text-yellow-700' :
                'bg-green-50 text-green-700'
              }`}>
                {recommendation.type === 'critical' ? <AlertCircle className="h-4 w-4" /> :
                 recommendation.type === 'warning' ? <TrendingDown className="h-4 w-4" /> :
                 <Calendar className="h-4 w-4" />}
                <span className="text-sm font-medium">{recommendation.message}</span>
              </div>
            )}

            <div className="pt-4 border-t">
              <Badge variant={getStatusColor(stats.messagesLast24h)} className="mb-2">
                Status: {stats.messagesLast24h > 0 ? 'Webhook Funcionando' : 'Webhook com Problemas'}
              </Badge>
              
              {stats.messagesLast24h === 0 && (
                <p className="text-sm text-gray-600">
                  Recomendação: Restaurar versão anterior da edge function que estava salvando mensagens
                </p>
              )}
            </div>
          </>
        )}

        <Button 
          onClick={analyzeMessageHistory}
          disabled={loading}
          variant="outline"
          className="w-full"
        >
          <Database className="h-4 w-4 mr-2" />
          {loading ? 'Analisando...' : 'Atualizar Análise'}
        </Button>
      </CardContent>
    </Card>
  );
};
