import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppWebInstances } from '@/hooks/whatsapp/useWhatsAppWebInstances';

interface RealtimeEvent {
  id: string;
  timestamp: string;
  table: string;
  event: string;
  payload: any;
  channel: string;
}

export const RealtimeConnectionTest = () => {
  const { user } = useAuth();
  const { instances: webInstances } = useWhatsAppWebInstances();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<Record<string, string>>({});
  const [activeChannels, setActiveChannels] = useState<string[]>([]);
  const channelsRef = useRef<any[]>([]);

  const addEvent = (table: string, event: string, payload: any, channelName: string) => {
    const newEvent: RealtimeEvent = {
      id: `${Date.now()}-${Math.random()}`,
      timestamp: new Date().toLocaleTimeString(),
      table,
      event,
      payload,
      channel: channelName
    };
    
    setEvents(prev => [newEvent, ...prev.slice(0, 49)]); // Manter apenas 50 eventos
    console.log(`[Realtime Debug] 📡 ${table.toUpperCase()} ${event}:`, payload);
  };

  // TESTE 1: Subscription de mensagens globais
  const startMessagesMonitoring = () => {
    const activeInstance = webInstances.find(i => i.connection_status === 'ready' || i.connection_status === 'connected');
    if (!activeInstance) {
      console.error('[Realtime Debug] ❌ Nenhuma instância ativa encontrada');
      return null;
    }

    console.log('[Realtime Debug] 🚀 Iniciando monitoramento de MENSAGENS para instância:', activeInstance.id);

    const channel = supabase
      .channel(`debug-messages-${activeInstance.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `whatsapp_number_id=eq.${activeInstance.id}`
      }, (payload) => {
        addEvent('messages', payload.eventType, payload, `debug-messages-${activeInstance.id}`);
      })
      .subscribe((status) => {
        console.log('[Realtime Debug] 📡 Messages subscription status:', status);
        setSubscriptionStatus(prev => ({
          ...prev,
          [`messages-${activeInstance.id}`]: status
        }));
      });

    return channel;
  };

  // TESTE 2: Subscription de leads/contatos
  const startLeadsMonitoring = () => {
    const activeInstance = webInstances.find(i => i.connection_status === 'ready' || i.connection_status === 'connected');
    if (!activeInstance) return null;

    console.log('[Realtime Debug] 🚀 Iniciando monitoramento de LEADS para instância:', activeInstance.id);

    const channel = supabase
      .channel(`debug-leads-${activeInstance.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads',
        filter: `whatsapp_number_id=eq.${activeInstance.id}`
      }, (payload) => {
        addEvent('leads', payload.eventType, payload, `debug-leads-${activeInstance.id}`);
      })
      .subscribe((status) => {
        console.log('[Realtime Debug] 📡 Leads subscription status:', status);
        setSubscriptionStatus(prev => ({
          ...prev,
          [`leads-${activeInstance.id}`]: status
        }));
      });

    return channel;
  };

  // TESTE 3: Subscription de instâncias WhatsApp
  const startInstancesMonitoring = () => {
    if (!user?.id) return null;

    console.log('[Realtime Debug] 🚀 Iniciando monitoramento de INSTÂNCIAS para usuário:', user.id);

    const channel = supabase
      .channel(`debug-instances-${user.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_instances',
        filter: `created_by_user_id=eq.${user.id}`
      }, (payload) => {
        addEvent('whatsapp_instances', payload.eventType, payload, `debug-instances-${user.id}`);
      })
      .subscribe((status) => {
        console.log('[Realtime Debug] 📡 Instances subscription status:', status);
        setSubscriptionStatus(prev => ({
          ...prev,
          [`instances-${user.id}`]: status
        }));
      });

    return channel;
  };

  // TESTE 4: Subscription genérica para capturar TUDO
  const startGlobalMonitoring = () => {
    console.log('[Realtime Debug] 🚀 Iniciando monitoramento GLOBAL de todos os eventos');

    const channel = supabase
      .channel(`debug-global-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        addEvent('messages-global', payload.eventType, payload, 'debug-global');
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads'
      }, (payload) => {
        addEvent('leads-global', payload.eventType, payload, 'debug-global');
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_instances'
      }, (payload) => {
        addEvent('instances-global', payload.eventType, payload, 'debug-global');
      })
      .subscribe((status) => {
        console.log('[Realtime Debug] 📡 Global subscription status:', status);
        setSubscriptionStatus(prev => ({
          ...prev,
          'global': status
        }));
      });

    return channel;
  };

  // Iniciar monitoramento
  const startMonitoring = () => {
    if (!user?.id) {
      alert('Usuário não logado!');
      return;
    }

    console.log('[Realtime Debug] 🎯 INICIANDO MONITORAMENTO COMPLETO');
    setIsMonitoring(true);
    setEvents([]);
    setSubscriptionStatus({});
    
    // Limpar channels anteriores
    channelsRef.current.forEach(channel => {
      if (channel) supabase.removeChannel(channel);
    });
    channelsRef.current = [];

    // Iniciar todos os monitoramentos
    const channels = [
      startMessagesMonitoring(),
      startLeadsMonitoring(), 
      startInstancesMonitoring(),
      startGlobalMonitoring()
    ].filter(Boolean);

    channelsRef.current = channels;
    setActiveChannels(channels.map(c => c?.topic || 'unknown'));

    // Adicionar log inicial
    addEvent('debug', 'MONITORING_STARTED', {
      userId: user.id,
      instancesCount: webInstances.length,
      activeInstances: webInstances.filter(i => i.connection_status === 'ready' || i.connection_status === 'connected').length,
      channelsCreated: channels.length
    }, 'debug-system');
  };

  // Parar monitoramento
  const stopMonitoring = () => {
    console.log('[Realtime Debug] 🛑 PARANDO MONITORAMENTO');
    setIsMonitoring(false);
    
    channelsRef.current.forEach(channel => {
      if (channel) supabase.removeChannel(channel);
    });
    channelsRef.current = [];
    setActiveChannels([]);
    setSubscriptionStatus({});
  };

  // TESTE DE INSERÇÃO MANUAL
  const testInsertMessage = async () => {
    const activeInstance = webInstances.find(i => i.connection_status === 'ready' || i.connection_status === 'connected');
    if (!activeInstance) {
      alert('Nenhuma instância ativa encontrada!');
      return;
    }

    try {
      // Buscar um lead existente
      const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .eq('whatsapp_number_id', activeInstance.id)
        .limit(1);

      if (!leads || leads.length === 0) {
        alert('Nenhum lead encontrado para teste!');
        return;
      }

      console.log('[Realtime Debug] 🧪 Inserindo mensagem de teste...');

      // Inserir mensagem de teste
      const { data, error } = await supabase
        .from('messages')
        .insert({
          lead_id: leads[0].id,
          whatsapp_number_id: activeInstance.id,
          text: `Mensagem de teste - ${new Date().toLocaleTimeString()}`,
          from_me: false,
          timestamp: new Date().toISOString(),
          status: 'received',
          created_by_user_id: user!.id
        })
        .select()
        .single();

      if (error) {
        console.error('[Realtime Debug] ❌ Erro ao inserir mensagem:', error);
        alert(`Erro: ${error.message}`);
      } else {
        console.log('[Realtime Debug] ✅ Mensagem inserida:', data);
        alert('Mensagem de teste inserida! Verifique se apareceu nos eventos.');
      }
    } catch (error) {
      console.error('[Realtime Debug] ❌ Erro:', error);
      alert(`Erro: ${error}`);
    }
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      channelsRef.current.forEach(channel => {
        if (channel) supabase.removeChannel(channel);
      });
    };
  }, []);

  const getStatusBadge = (status: string) => {
    const color = status === 'SUBSCRIBED' ? 'bg-green-500' : 
                  status === 'CHANNEL_ERROR' ? 'bg-red-500' : 
                  status === 'CLOSED' ? 'bg-gray-500' : 'bg-yellow-500';
    return <Badge className={color}>{status}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🔬 Debug Realtime - Investigação Profunda
            {isMonitoring && <Badge className="bg-green-500 animate-pulse">MONITORANDO</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-4">
            <Button 
              onClick={startMonitoring}
              disabled={isMonitoring}
              className="bg-blue-600 hover:bg-blue-700"
            >
              🚀 Iniciar Monitoramento
            </Button>
            <Button 
              onClick={stopMonitoring}
              disabled={!isMonitoring}
              variant="outline"
            >
              🛑 Parar
            </Button>
            <Button 
              onClick={testInsertMessage}
              disabled={!isMonitoring}
              className="bg-purple-600 hover:bg-purple-700"
            >
              🧪 Testar Inserção
            </Button>
          </div>

          {/* Status das Subscriptions */}
          <div>
            <h4 className="font-semibold mb-2">📡 Status das Subscriptions:</h4>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(subscriptionStatus).map(([key, status]) => (
                <div key={key} className="flex justify-between items-center p-2 bg-gray-100 rounded">
                  <span className="text-sm font-mono">{key}</span>
                  {getStatusBadge(status)}
                </div>
              ))}
            </div>
          </div>

          {/* Canais Ativos */}
          <div>
            <h4 className="font-semibold mb-2">🔗 Canais Ativos ({activeChannels.length}):</h4>
            <div className="flex flex-wrap gap-1">
              {activeChannels.map(channel => (
                <Badge key={channel} variant="outline" className="text-xs">
                  {channel}
                </Badge>
              ))}
            </div>
          </div>

          {/* Instâncias Disponíveis */}
          <div>
            <h4 className="font-semibold mb-2">📱 Instâncias WhatsApp:</h4>
            <div className="space-y-1">
              {webInstances.map(instance => (
                <div key={instance.id} className="flex justify-between items-center p-2 bg-gray-50 rounded text-sm">
                  <span>{instance.instance_name}</span>
                  <Badge className={
                    instance.connection_status === 'ready' || instance.connection_status === 'connected' 
                      ? 'bg-green-500' : 'bg-red-500'
                  }>
                    {instance.connection_status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Log de Eventos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            📋 Eventos Capturados ({events.length})
            <Button 
              onClick={() => setEvents([])}
              variant="outline"
              size="sm"
            >
              🗑️ Limpar
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-gray-500 text-center py-4">
                Nenhum evento capturado ainda. Inicie o monitoramento e faça um teste.
              </p>
            ) : (
              events.map(event => (
                <div key={event.id} className="p-3 bg-gray-50 rounded border-l-4 border-blue-500">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex gap-2">
                      <Badge>{event.table}</Badge>
                      <Badge variant="outline">{event.event}</Badge>
                      <Badge variant="outline" className="text-xs">{event.channel}</Badge>
                    </div>
                    <span className="text-xs text-gray-500">{event.timestamp}</span>
                  </div>
                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.payload, null, 2)}
                  </pre>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}; 