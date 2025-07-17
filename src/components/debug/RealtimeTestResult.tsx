import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useWhatsAppWebInstances } from '@/hooks/whatsapp/useWhatsAppWebInstances';

export const RealtimeTestResult = () => {
  const { user } = useAuth();
  const { instances: webInstances } = useWhatsAppWebInstances();
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [eventsCaptured, setEventsCaptured] = useState(0);
  const [testMessage, setTestMessage] = useState('');

  const runQuickTest = async () => {
    setTestStatus('testing');
    setEventsCaptured(0);
    setTestMessage('Iniciando teste...');

    const activeInstance = webInstances.find(i => 
      i.connection_status === 'ready' || i.connection_status === 'connected'
    );

    if (!activeInstance) {
      setTestStatus('error');
      setTestMessage('❌ Nenhuma instância ativa encontrada');
      return;
    }

    setTestMessage(`🔍 Testando com instância: ${activeInstance.instance_name}`);

    // Configurar listener temporário
    let eventCount = 0;
    const startTime = Date.now();

    const channel = supabase
      .channel(`quick-test-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'messages',
        filter: `whatsapp_number_id=eq.${activeInstance.id}`
      }, (payload) => {
        eventCount++;
        setEventsCaptured(eventCount);
        console.log('🎯 Evento capturado rapidamente:', payload);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setTestMessage('📡 Subscription ativa. Inserindo mensagem de teste...');

          try {
            // Buscar um lead para teste
            const { data: leads } = await supabase
              .from('leads')
              .select('id, name')
              .eq('whatsapp_number_id', activeInstance.id)
              .limit(1);

            if (!leads || leads.length === 0) {
              setTestStatus('error');
              setTestMessage('❌ Nenhum contato encontrado para teste');
              return;
            }

            // Inserir mensagem de teste
            const testText = `Teste CORREÇÃO - ${new Date().toLocaleTimeString()}`;
            
            const { error } = await supabase
              .from('messages')
              .insert({
                lead_id: leads[0].id,
                whatsapp_number_id: activeInstance.id,
                text: testText,
                from_me: false,
                timestamp: new Date().toISOString(),
                status: 'received',
                created_by_user_id: user!.id
              });

            if (error) {
              setTestStatus('error');
              setTestMessage(`❌ Erro ao inserir: ${error.message}`);
            } else {
              setTestMessage(`✅ Mensagem inserida para ${leads[0].name}. Aguardando evento...`);
              
              // Aguardar 3 segundos pelo evento
              setTimeout(() => {
                supabase.removeChannel(channel);
                const duration = Date.now() - startTime;
                
                if (eventCount > 0) {
                  setTestStatus('success');
                  setTestMessage(`🎉 SUCESSO! Evento capturado em ${duration}ms`);
                } else {
                  setTestStatus('error');
                  setTestMessage(`❌ FALHA! Nenhum evento capturado em ${duration}ms`);
                }
              }, 3000);
            }
          } catch (error) {
            setTestStatus('error');
            setTestMessage(`❌ Erro: ${error}`);
            supabase.removeChannel(channel);
          }
        }
      });
  };

  const getStatusColor = () => {
    switch (testStatus) {
      case 'testing': return 'bg-blue-500';
      case 'success': return 'bg-green-500';
      case 'error': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (testStatus) {
      case 'testing': return '🔄';
      case 'success': return '✅';
      case 'error': return '❌';
      default: return '⚪';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          🚀 Teste Rápido de Correções
          <Badge className={getStatusColor()}>
            {getStatusIcon()} {testStatus.toUpperCase()}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm font-medium">Instâncias Ativas:</div>
            <div className="text-lg">
              {webInstances.filter(i => 
                i.connection_status === 'ready' || i.connection_status === 'connected'
              ).length}
            </div>
          </div>
          <div>
            <div className="text-sm font-medium">Eventos Capturados:</div>
            <div className="text-lg font-bold text-green-600">{eventsCaptured}</div>
          </div>
        </div>

        <div className="p-3 bg-gray-100 rounded text-sm">
          {testMessage || 'Clique em "Executar Teste" para verificar as correções'}
        </div>

        <Button 
          onClick={runQuickTest}
          disabled={testStatus === 'testing'}
          className="w-full"
        >
          {testStatus === 'testing' ? '🔄 Testando...' : '🧪 Executar Teste Rápido'}
        </Button>

        {testStatus === 'success' && (
          <div className="p-3 bg-green-100 rounded text-green-800 text-sm">
            🎉 <strong>CORREÇÕES FUNCIONANDO!</strong><br/>
            O realtime está capturando eventos corretamente com as otimizações aplicadas.
          </div>
        )}

        {testStatus === 'error' && (
          <div className="p-3 bg-red-100 rounded text-red-800 text-sm">
            ❌ <strong>AINDA HÁ PROBLEMAS</strong><br/>
            O realtime não está funcionando. Verifique os logs do console para mais detalhes.
          </div>
        )}
      </CardContent>
    </Card>
  );
}; 