
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  MessageSquare, 
  Send, 
  Phone, 
  User, 
  Clock,
  CheckCircle,
  AlertTriangle,
  RefreshCw
} from "lucide-react";

interface MessageTest {
  id: string;
  phone: string;
  status: 'pending' | 'sent' | 'delivered' | 'error';
  timestamp: string;
  response?: any;
  error?: string;
}

interface LeadCreated {
  id: string;
  name: string;
  phone: string;
  created: boolean;
  timestamp: string;
}

export const VPSMessageTester = () => {
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('Teste de mensagem automática do sistema');
  const [isTesting, setIsTesting] = useState(false);
  const [messageTests, setMessageTests] = useState<MessageTest[]>([]);
  const [leadsCreated, setLeadsCreated] = useState<LeadCreated[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  // Simular envio de mensagem via webhook
  const simulateIncomingMessage = async () => {
    if (!testPhone.trim()) {
      toast.error('Informe um número de telefone para teste');
      return;
    }

    setIsTesting(true);
    const testId = Date.now().toString();
    
    const newTest: MessageTest = {
      id: testId,
      phone: testPhone,
      status: 'pending',
      timestamp: new Date().toISOString()
    };
    
    setMessageTests(prev => [newTest, ...prev]);

    try {
      // Simular dados de webhook como se viessem da VPS
      const webhookData = {
        event: "messages.upsert",
        instance: "digitalticlin1", // Usar a instância conhecida
        data: {
          key: {
            remoteJid: `${testPhone.replace(/\D/g, '')}@s.whatsapp.net`,
            fromMe: false,
            id: `test_${testId}`
          },
          message: {
            conversation: testMessage
          },
          messageTimestamp: Math.floor(Date.now() / 1000),
          pushName: "Teste Usuário"
        }
      };

      console.log('[Message Tester] Simulando webhook:', webhookData);

      // Enviar para o webhook Evolution (que já existe)
      const { data, error } = await supabase.functions.invoke('webhook_evolution', {
        body: webhookData
      });

      if (error) {
        throw new Error(error.message);
      }

      // Atualizar status do teste
      setMessageTests(prev => prev.map(test => 
        test.id === testId 
          ? { 
              ...test, 
              status: data.success ? 'sent' : 'error',
              response: data,
              error: data.success ? undefined : data.error
            }
          : test
      ));

      if (data.success) {
        toast.success('Mensagem processada com sucesso!');
        
        // Verificar se lead foi criado
        if (data.leadCreated) {
          const newLead: LeadCreated = {
            id: data.leadId,
            name: `Teste ${testPhone}`,
            phone: testPhone,
            created: true,
            timestamp: new Date().toISOString()
          };
          setLeadsCreated(prev => [newLead, ...prev]);
        }
        
        // Aguardar um pouco e verificar no banco
        setTimeout(() => checkDatabaseForMessage(testPhone), 2000);
        
      } else {
        toast.error(`Erro no processamento: ${data.error}`);
      }

    } catch (error: any) {
      console.error('[Message Tester] Erro:', error);
      
      setMessageTests(prev => prev.map(test => 
        test.id === testId 
          ? { ...test, status: 'error', error: error.message }
          : test
      ));
      
      toast.error(`Erro: ${error.message}`);
    } finally {
      setIsTesting(false);
    }
  };

  // Verificar se mensagem foi salva no banco
  const checkDatabaseForMessage = async (phone: string) => {
    try {
      // Buscar lead criado
      const { data: lead } = await supabase
        .from('leads')
        .select('id, name, phone')
        .eq('phone', phone.replace(/\D/g, ''))
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lead) {
        console.log('[Message Tester] Lead encontrado:', lead);
        
        // Buscar mensagens do lead
        const { data: messages } = await supabase
          .from('messages')
          .select('*')
          .eq('lead_id', lead.id)
          .order('timestamp', { ascending: false })
          .limit(5);

        console.log('[Message Tester] Mensagens encontradas:', messages);
        
        toast.success(`✅ Lead e ${messages?.length || 0} mensagem(s) encontrados no banco!`);
      } else {
        toast.warning('Lead não encontrado no banco de dados');
      }
    } catch (error) {
      console.error('[Message Tester] Erro ao verificar banco:', error);
    }
  };

  // Monitorar mensagens em tempo real
  const startRealTimeMonitoring = () => {
    if (isMonitoring) {
      toast.info('Monitoramento já está ativo');
      return;
    }

    setIsMonitoring(true);
    toast.info('Iniciando monitoramento em tempo real...');

    // Escutar novas mensagens
    const messagesChannel = supabase
      .channel('message-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages'
        },
        (payload) => {
          console.log('[Real-time Monitor] Nova mensagem:', payload);
          toast.success('📨 Nova mensagem detectada em tempo real!');
        }
      )
      .subscribe();

    // Escutar novos leads
    const leadsChannel = supabase
      .channel('lead-monitor')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads'
        },
        (payload) => {
          console.log('[Real-time Monitor] Novo lead:', payload);
          toast.success('👤 Novo lead detectado em tempo real!');
        }
      )
      .subscribe();

    // Parar monitoramento após 60 segundos
    setTimeout(() => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(leadsChannel);
      setIsMonitoring(false);
      toast.info('Monitoramento em tempo real finalizado');
    }, 60000);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      case 'pending': return <RefreshCw className="h-4 w-4 text-blue-600 animate-spin" />;
      default: return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      sent: 'default',
      error: 'destructive',
      pending: 'secondary'
    };
    return (
      <Badge variant={variants[status as keyof typeof variants] as any}>
        {status.toUpperCase()}
      </Badge>
    );
  };

  return (
    <div className="space-y-6">
      {/* Teste de Mensagem */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-600" />
            <CardTitle>Teste de Mensagens em Tempo Real</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="phone">Número de Telefone</Label>
              <div className="flex gap-2">
                <Phone className="h-4 w-4 mt-3 text-gray-500" />
                <Input
                  id="phone"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  placeholder="5511999999999"
                  className="flex-1"
                />
              </div>
            </div>
            <div>
              <Label htmlFor="message">Mensagem de Teste</Label>
              <Input
                id="message"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Mensagem de teste..."
              />
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              onClick={simulateIncomingMessage}
              disabled={isTesting || !testPhone}
              className="flex items-center gap-2"
            >
              {isTesting ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
              Simular Mensagem Recebida
            </Button>

            <Button
              onClick={startRealTimeMonitoring}
              disabled={isMonitoring}
              variant="outline"
              className="flex items-center gap-2"
            >
              {isMonitoring ? (
                <RefreshCw className="h-4 w-4 animate-spin" />
              ) : (
                <MessageSquare className="h-4 w-4" />
              )}
              {isMonitoring ? 'Monitorando...' : 'Monitorar Tempo Real'}
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            <p>• Simula uma mensagem recebida no WhatsApp via webhook</p>
            <p>• Verifica se o lead é criado automaticamente</p>
            <p>• Confirma se a mensagem é salva na tabela messages</p>
            <p>• Monitora atualizações em tempo real no banco</p>
          </div>
        </CardContent>
      </Card>

      {/* Histórico de Testes */}
      {messageTests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Histórico de Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {messageTests.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(test.status)}
                    <div>
                      <div className="font-medium">{test.phone}</div>
                      <div className="text-sm text-muted-foreground">
                        {new Date(test.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(test.status)}
                    {test.error && (
                      <span className="text-sm text-red-600">{test.error}</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Leads Criados */}
      {leadsCreated.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Leads Criados nos Testes
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {leadsCreated.map((lead) => (
                <div key={lead.id} className="flex items-center justify-between p-3 border rounded">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <div className="font-medium">{lead.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {lead.phone} • {new Date(lead.timestamp).toLocaleString('pt-BR')}
                      </div>
                    </div>
                  </div>
                  <Badge variant="default">CRIADO</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
