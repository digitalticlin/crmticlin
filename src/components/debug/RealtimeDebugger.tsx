
import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Play, Square, Wifi, WifiOff, AlertCircle, CheckCircle } from "lucide-react";

interface RealtimeEvent {
  timestamp: string;
  table: string;
  event: string;
  data: any;
}

export const RealtimeDebugger = () => {
  const { user } = useAuth();
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [events, setEvents] = useState<RealtimeEvent[]>([]);
  const [subscriptionStatus, setSubscriptionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const channelRef = useRef<any>(null);

  // Iniciar monitoramento
  const startMonitoring = () => {
    if (!user?.id) {
      alert('Usuário não logado!');
      return;
    }

    setIsMonitoring(true);
    setSubscriptionStatus('connecting');
    setEvents([]);

    const channel = supabase
      .channel(`realtime-debug-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages'
      }, (payload) => {
        console.log('[Realtime Debug] 📨 Mensagem:', payload);
        addEvent('messages', payload.eventType, payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'leads'
      }, (payload) => {
        console.log('[Realtime Debug] 👤 Lead:', payload);
        addEvent('leads', payload.eventType, payload);
      })
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'whatsapp_instances'
      }, (payload) => {
        console.log('[Realtime Debug] 📱 Instância:', payload);
        addEvent('whatsapp_instances', payload.eventType, payload);
      })
      .subscribe((status) => {
        console.log('[Realtime Debug] 📡 Status:', status);
        
        if (status === 'SUBSCRIBED') {
          setSubscriptionStatus('connected');
          addEvent('system', 'SUBSCRIBED', { message: 'Subscription ativa!' });
        } else if (status === 'CHANNEL_ERROR') {
          setSubscriptionStatus('error');
          addEvent('system', 'ERROR', { message: 'Erro na subscription!' });
        } else if (status === 'CLOSED') {
          setSubscriptionStatus('disconnected');
          addEvent('system', 'CLOSED', { message: 'Subscription fechada!' });
        }
      });

    channelRef.current = channel;
  };

  // Parar monitoramento
  const stopMonitoring = () => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsMonitoring(false);
    setSubscriptionStatus('disconnected');
    addEvent('system', 'STOPPED', { message: 'Monitoramento parado' });
  };

  // Adicionar evento
  const addEvent = (table: string, event: string, data: any) => {
    const newEvent: RealtimeEvent = {
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      table,
      event,
      data
    };
    
    setEvents(prev => [newEvent, ...prev].slice(0, 50)); // Manter apenas últimos 50
  };

  // Testar inserção de mensagem
  const testMessageInsert = async () => {
    try {
      console.log('[Realtime Debug] 🧪 Testando inserção de mensagem...');
      
      // Buscar uma instância do usuário
      const { data: instances } = await supabase
        .from('whatsapp_instances')
        .select('id')
        .eq('created_by_user_id', user?.id)
        .limit(1);

      if (!instances || instances.length === 0) {
        alert('Nenhuma instância WhatsApp encontrada para teste!');
        return;
      }

      // Buscar um lead do usuário
      const { data: leads } = await supabase
        .from('leads')
        .select('id')
        .eq('created_by_user_id', user?.id)
        .limit(1);

      if (!leads || leads.length === 0) {
        alert('Nenhum lead encontrado para teste!');
        return;
      }

      // Inserir mensagem de teste - usando apenas campos que existem na tabela
      const { data, error } = await supabase
        .from('messages')
        .insert({
          text: `Teste Realtime ${new Date().toLocaleTimeString()}`,
          from_me: false,
          timestamp: new Date().toISOString(),
          lead_id: leads[0].id,
          whatsapp_number_id: instances[0].id,
          status: 'received',
          created_by_user_id: user?.id
        });

      if (error) {
        console.error('Erro ao inserir mensagem teste:', error);
        alert(`Erro: ${error.message}`);
      } else {
        console.log('Mensagem teste inserida:', data);
        alert('Mensagem teste inserida! Verifique se apareceu no monitor.');
      }

    } catch (error) {
      console.error('Erro no teste:', error);
      alert(`Erro no teste: ${error}`);
    }
  };

  // Limpar eventos
  const clearEvents = () => {
    setEvents([]);
  };

  // Cleanup na desmontagem
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const getStatusIcon = () => {
    switch (subscriptionStatus) {
      case 'connected': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'connecting': return <Wifi className="w-4 h-4 text-yellow-500 animate-pulse" />;
      case 'error': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <WifiOff className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusColor = () => {
    switch (subscriptionStatus) {
      case 'connected': return 'bg-green-500';
      case 'connecting': return 'bg-yellow-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getStatusIcon()}
          Debug Realtime Supabase
          <Badge className={getStatusColor()}>
            {subscriptionStatus.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Controles */}
        <div className="flex gap-2 flex-wrap">
          <Button 
            onClick={startMonitoring} 
            disabled={isMonitoring}
            className="flex items-center gap-2"
          >
            <Play className="w-4 h-4" />
            Iniciar Monitor
          </Button>
          
          <Button 
            onClick={stopMonitoring} 
            disabled={!isMonitoring}
            variant="destructive"
            className="flex items-center gap-2"
          >
            <Square className="w-4 h-4" />
            Parar Monitor
          </Button>
          
          <Button 
            onClick={testMessageInsert}
            variant="outline"
            disabled={!isMonitoring}
          >
            🧪 Teste Mensagem
          </Button>
          
          <Button 
            onClick={clearEvents}
            variant="outline"
          >
            🧹 Limpar
          </Button>
        </div>

        {/* Status */}
        <Alert>
          <AlertDescription>
            <strong>Status:</strong> {subscriptionStatus} | 
            <strong> Eventos:</strong> {events.length} | 
            <strong> Usuário:</strong> {user?.email || 'Não logado'}
          </AlertDescription>
        </Alert>

        {/* Lista de Eventos */}
        <div className="max-h-96 overflow-y-auto space-y-2">
          {events.length === 0 ? (
            <div className="text-center text-gray-500 py-8">
              Nenhum evento capturado ainda. Inicie o monitor e teste inserindo uma mensagem.
            </div>
          ) : (
            events.map((event, index) => (
              <Card key={index} className="p-3">
                <div className="flex justify-between items-start">
                  <div>
                    <Badge variant="outline" className="mb-1">
                      {event.table}
                    </Badge>
                    <Badge variant="secondary" className="ml-1">
                      {event.event}
                    </Badge>
                    <div className="text-xs text-gray-500 mt-1">
                      {event.timestamp}
                    </div>
                  </div>
                  <details className="text-xs max-w-md">
                    <summary className="cursor-pointer text-blue-600">
                      Ver dados
                    </summary>
                    <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto">
                      {JSON.stringify(event.data, null, 2)}
                    </pre>
                  </details>
                </div>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}; 
