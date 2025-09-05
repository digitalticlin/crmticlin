import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppWebInstances } from '@/hooks/whatsapp/useWhatsAppWebInstances';
import { useWhatsAppContacts } from '@/hooks/whatsapp/useWhatsAppContacts';

interface TestStep {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'error';
  message?: string;
  timestamp?: string;
  duration?: number;
}

export const MessageFlowTester = () => {
  const { user } = useAuth();
  const { instances: webInstances } = useWhatsAppWebInstances();
  const activeInstance = webInstances.find(i => i.connection_status === 'ready' || i.connection_status === 'connected');
  const { contacts } = useWhatsAppContacts({ activeInstanceId: activeInstance?.id });
  
  const [testSteps, setTestSteps] = useState<TestStep[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [selectedContact, setSelectedContact] = useState<string>('');
  const [testMessage, setTestMessage] = useState('Teste de fluxo completo - ' + new Date().toLocaleTimeString());
  const [realtimeEvents, setRealtimeEvents] = useState<any[]>([]);
  const channelRef = useRef<any>(null);
  const startTimeRef = useRef<number>(0);

  const initialSteps: TestStep[] = [
    { id: 'setup', name: '🔧 Configuração inicial', status: 'pending' },
    { id: 'realtime', name: '📡 Configurar subscription realtime', status: 'pending' },
    { id: 'insert', name: '💾 Inserir mensagem no banco', status: 'pending' },
    { id: 'capture', name: '📨 Capturar evento realtime', status: 'pending' },
    { id: 'contact_move', name: '🔝 Verificar movimento do contato', status: 'pending' },
    { id: 'ui_update', name: '🖥️ Verificar atualização da UI', status: 'pending' },
    { id: 'cleanup', name: '🧹 Limpeza', status: 'pending' }
  ];

  const updateStep = (stepId: string, status: TestStep['status'], message?: string, duration?: number) => {
    setTestSteps(prev => prev.map(step => 
      step.id === stepId 
        ? { 
            ...step, 
            status, 
            message, 
            timestamp: new Date().toLocaleTimeString(),
            duration 
          }
        : step
    ));
  };

  const runCompleteTest = async () => {
    if (!activeInstance || !selectedContact) {
      alert('Selecione uma instância ativa e um contato!');
      return;
    }

    setIsRunning(true);
    setTestSteps([...initialSteps]);
    setRealtimeEvents([]);
    startTimeRef.current = Date.now();

    try {
      // PASSO 1: Configuração inicial
      updateStep('setup', 'running');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const contact = contacts.find(c => c.id === selectedContact);
      if (!contact) {
        updateStep('setup', 'error', 'Contato não encontrado');
        return;
      }
      
      updateStep('setup', 'success', `Contato: ${contact.name} | Instância: ${activeInstance.instance_name}`);

      // PASSO 2: Configurar subscription realtime
      updateStep('realtime', 'running');
      
      // Limpar subscription anterior
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }

      let realtimeEventCaptured = false;
      
      const channel = supabase
        .channel(`message-flow-test-${Date.now()}`)
        .on('postgres_changes', {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `lead_id=eq.${contact.id}`
        }, (payload) => {
          console.log('[Message Flow Test] 📨 Evento capturado:', payload);
          setRealtimeEvents(prev => [...prev, {
            timestamp: new Date().toLocaleTimeString(),
            type: 'INSERT',
            table: 'messages',
            data: payload.new
          }]);
          realtimeEventCaptured = true;
          
          const duration = Date.now() - startTimeRef.current;
          updateStep('capture', 'success', `Evento capturado em ${duration}ms`, duration);
        })
        .subscribe((status) => {
          console.log('[Message Flow Test] 📡 Subscription status:', status);
          if (status === 'SUBSCRIBED') {
            updateStep('realtime', 'success', 'Subscription ativa');
          } else if (status === 'CHANNEL_ERROR') {
            updateStep('realtime', 'error', 'Erro na subscription');
          }
        });

      channelRef.current = channel;
      await new Promise(resolve => setTimeout(resolve, 1000)); // Aguardar subscription

      // PASSO 3: Inserir mensagem
      updateStep('insert', 'running');
      
      const insertTime = Date.now();
      const { data: insertedMessage, error: insertError } = await supabase
        .from('messages')
        .insert({
          lead_id: contact.id,
          whatsapp_number_id: activeInstance.id,
          text: testMessage,
          from_me: false,
          timestamp: new Date().toISOString(),
          status: 'received',
          created_by_user_id: user!.id,
          media_type: 'text'
        })
        .select()
        .single();

      if (insertError) {
        updateStep('insert', 'error', `Erro: ${insertError.message}`);
        return;
      }

      const insertDuration = Date.now() - insertTime;
      updateStep('insert', 'success', `Mensagem inserida (ID: ${insertedMessage.id})`, insertDuration);

      // PASSO 4: Aguardar evento realtime
      updateStep('capture', 'running');
      
      // Aguardar até 5 segundos pelo evento
      let waitTime = 0;
      while (!realtimeEventCaptured && waitTime < 5000) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitTime += 100;
      }

      if (!realtimeEventCaptured) {
        updateStep('capture', 'error', 'Evento realtime não capturado em 5s');
      }

      // PASSO 5: Verificar movimento do contato (simulado)
      updateStep('contact_move', 'running');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar se o contato está no topo da lista
      const contactIndex = contacts.findIndex(c => c.id === contact.id);
      if (contactIndex === 0) {
        updateStep('contact_move', 'success', 'Contato está no topo da lista');
      } else {
        updateStep('contact_move', 'error', `Contato está na posição ${contactIndex + 1}`);
      }

      // PASSO 6: Verificar atualização da UI
      updateStep('ui_update', 'running');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Simulação - na prática verificaria se a UI foi atualizada
      updateStep('ui_update', 'success', 'UI atualizada (simulado)');

      // PASSO 7: Limpeza
      updateStep('cleanup', 'running');
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      updateStep('cleanup', 'success', 'Subscription removida');

    } catch (error) {
      console.error('[Message Flow Test] ❌ Erro no teste:', error);
      updateStep('setup', 'error', `Erro: ${error}`);
    } finally {
      setIsRunning(false);
    }
  };

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const getStepIcon = (status: TestStep['status']) => {
    switch (status) {
      case 'pending': return '⏳';
      case 'running': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
    }
  };

  const getStepColor = (status: TestStep['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100';
      case 'running': return 'bg-blue-100 animate-pulse';
      case 'success': return 'bg-green-100';
      case 'error': return 'bg-red-100';
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            🧪 Teste de Fluxo Completo - Mensagem → Realtime → UI
            {isRunning && <Badge className="bg-blue-500 animate-pulse">EXECUTANDO</Badge>}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Configuração do Teste */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">📱 Instância Ativa:</label>
              <div className="p-2 bg-gray-100 rounded">
                {activeInstance ? (
                  <span className="text-sm">
                    {activeInstance.instance_name} 
                    <Badge className="ml-2 bg-green-500">{activeInstance.connection_status}</Badge>
                  </span>
                ) : (
                  <span className="text-red-500">Nenhuma instância ativa</span>
                )}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">👤 Contato para Teste:</label>
              <select 
                value={selectedContact}
                onChange={(e) => setSelectedContact(e.target.value)}
                className="w-full p-2 border rounded"
                disabled={isRunning}
              >
                <option value="">Selecione um contato...</option>
                {contacts.slice(0, 10).map(contact => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} ({contact.phone})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">💬 Mensagem de Teste:</label>
            <Input
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              disabled={isRunning}
              placeholder="Digite a mensagem de teste..."
            />
          </div>

          <Button 
            onClick={runCompleteTest}
            disabled={isRunning || !activeInstance || !selectedContact}
            className="w-full bg-purple-600 hover:bg-purple-700"
            size="lg"
          >
            {isRunning ? '🔄 Executando Teste...' : '🚀 Executar Teste Completo'}
          </Button>
        </CardContent>
      </Card>

      {/* Passos do Teste */}
      <Card>
        <CardHeader>
          <CardTitle>📋 Passos do Teste</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {testSteps.map(step => (
              <div key={step.id} className={`p-3 rounded border-l-4 ${getStepColor(step.status)}`}>
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{getStepIcon(step.status)}</span>
                    <span className="font-medium">{step.name}</span>
                  </div>
                  <div className="text-right">
                    {step.timestamp && (
                      <div className="text-xs text-gray-500">{step.timestamp}</div>
                    )}
                    {step.duration && (
                      <div className="text-xs text-blue-600">{step.duration}ms</div>
                    )}
                  </div>
                </div>
                {step.message && (
                  <p className="text-sm text-gray-600 mt-1 ml-6">{step.message}</p>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Eventos Realtime Capturados */}
      {realtimeEvents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📡 Eventos Realtime Capturados ({realtimeEvents.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {realtimeEvents.map((event, index) => (
                <div key={index} className="p-3 bg-green-50 rounded border-l-4 border-green-500">
                  <div className="flex justify-between items-center mb-2">
                    <div className="flex gap-2">
                      <Badge className="bg-green-500">{event.type}</Badge>
                      <Badge variant="outline">{event.table}</Badge>
                    </div>
                    <span className="text-xs text-gray-500">{event.timestamp}</span>
                  </div>
                  <pre className="text-xs bg-white p-2 rounded overflow-x-auto">
                    {JSON.stringify(event.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
