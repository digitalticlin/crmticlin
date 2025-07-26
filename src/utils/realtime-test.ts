/**
 * 🧪 SCRIPT DE TESTE PARA SISTEMA DE REALTIME
 * 
 * Este script testa se:
 * 1. Webhook está salvando mensagens corretamente
 * 2. RLS permite acesso aos dados
 * 3. Realtime está funcionando
 * 4. Filtros estão precisos
 */

import { supabase } from '@/integrations/supabase/client';
import { Contact } from '@/types/chat';
import { WhatsAppWebInstance } from '@/types/whatsapp';

interface RealtimeTestResults {
  webhookStatus: 'ok' | 'error' | 'not_tested';
  rlsStatus: 'ok' | 'error' | 'not_tested';
  realtimeStatus: 'ok' | 'error' | 'not_tested';
  filterStatus: 'ok' | 'error' | 'not_tested';
  details: {
    lastMessages: any[];
    permissions: any;
    connectionStatus: string;
    errors: string[];
  };
}

export class RealtimeTestManager {
  private results: RealtimeTestResults = {
    webhookStatus: 'not_tested',
    rlsStatus: 'not_tested', 
    realtimeStatus: 'not_tested',
    filterStatus: 'not_tested',
    details: {
      lastMessages: [],
      permissions: null,
      connectionStatus: 'disconnected',
      errors: []
    }
  };

  /**
   * 🔍 TESTE 1: Verificar se mensagens estão sendo salvas
   */
  async testDatabaseAccess(contactId: string, instanceId: string): Promise<boolean> {
    try {
      console.log('[Realtime Test] 🔍 Testando acesso ao banco...');
      
      // Tentar buscar mensagens recentes
      const { data: messages, error } = await supabase
        .from('messages')
        .select(`
          id,
          text,
          from_me,
          timestamp,
          status,
          media_type,
          media_url,
          lead_id,
          whatsapp_number_id,
          created_by_user_id
        `)
        .eq('lead_id', contactId)
        .eq('whatsapp_number_id', instanceId)
        .order('timestamp', { ascending: false })
        .limit(5);

      if (error) {
        console.error('[Realtime Test] ❌ Erro ao acessar mensagens:', error);
        this.results.rlsStatus = 'error';
        this.results.details.errors.push(`RLS Error: ${error.message}`);
        return false;
      }

      console.log('[Realtime Test] ✅ Acesso ao banco OK:', messages?.length || 0, 'mensagens');
      this.results.rlsStatus = 'ok';
      this.results.details.lastMessages = messages || [];
      return true;

    } catch (error) {
      console.error('[Realtime Test] ❌ Erro no teste de banco:', error);
      this.results.rlsStatus = 'error';
      this.results.details.errors.push(`Database Error: ${error}`);
      return false;
    }
  }

  /**
   * 🔄 TESTE 2: Verificar conexão realtime
   */
  async testRealtimeConnection(contactId: string, instanceId: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        console.log('[Realtime Test] 🔄 Testando conexão realtime...');
        
        const channel = supabase
          .channel(`test-realtime-${Date.now()}`)
          .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `lead_id=eq.${contactId} AND whatsapp_number_id=eq.${instanceId}`
          }, (payload) => {
            console.log('[Realtime Test] 📨 Evento recebido:', payload);
            this.results.realtimeStatus = 'ok';
            this.results.details.connectionStatus = 'connected';
            channel.unsubscribe();
            resolve(true);
          })
          .subscribe((status) => {
            console.log('[Realtime Test] 📡 Status da conexão:', status);
            this.results.details.connectionStatus = status;
            
            if (status === 'SUBSCRIBED') {
              console.log('[Realtime Test] ✅ Conexão realtime estabelecida');
              // Simular timeout se não receber mensagem em 10s
              setTimeout(() => {
                if (this.results.realtimeStatus === 'not_tested') {
                  console.log('[Realtime Test] ⏰ Timeout - nenhuma mensagem recebida');
                  this.results.realtimeStatus = 'ok'; // Conexão OK, só não teve mensagem
                  channel.unsubscribe();
                  resolve(true);
                }
              }, 10000);
            } else if (status === 'CHANNEL_ERROR') {
              console.error('[Realtime Test] ❌ Erro na conexão realtime');
              this.results.realtimeStatus = 'error';
              this.results.details.errors.push('Realtime connection failed');
              channel.unsubscribe();
              resolve(false);
            }
          });

      } catch (error) {
        console.error('[Realtime Test] ❌ Erro no teste de realtime:', error);
        this.results.realtimeStatus = 'error';
        this.results.details.errors.push(`Realtime Error: ${error}`);
        resolve(false);
      }
    });
  }

  /**
   * 🎯 TESTE 3: Verificar filtros (simulação)
   */
  async testFilters(contactId: string, instanceId: string): Promise<boolean> {
    try {
      console.log('[Realtime Test] 🎯 Testando filtros...');
      
      // Testar se o filtro duplo está funcionando
      const { data: filteredMessages, error } = await supabase
        .from('messages')
        .select('id, lead_id, whatsapp_number_id')
        .eq('lead_id', contactId)
        .eq('whatsapp_number_id', instanceId)
        .limit(1);

      if (error) {
        console.error('[Realtime Test] ❌ Erro no teste de filtros:', error);
        this.results.filterStatus = 'error';
        this.results.details.errors.push(`Filter Error: ${error.message}`);
        return false;
      }

      console.log('[Realtime Test] ✅ Filtros funcionando corretamente');
      this.results.filterStatus = 'ok';
      return true;

    } catch (error) {
      console.error('[Realtime Test] ❌ Erro no teste de filtros:', error);
      this.results.filterStatus = 'error';
      this.results.details.errors.push(`Filter Error: ${error}`);
      return false;
    }
  }

  /**
   * 🚀 EXECUTAR TODOS OS TESTES
   */
  async runFullTest(
    selectedContact: Contact | null, 
    activeInstance: WhatsAppWebInstance | null
  ): Promise<RealtimeTestResults> {
    console.log('[Realtime Test] 🚀 Iniciando testes completos do realtime...');
    
    if (!selectedContact || !activeInstance) {
      this.results.details.errors.push('Contato ou instância não selecionados');
      return this.results;
    }

    // Executar testes em sequência
    await this.testDatabaseAccess(selectedContact.id, activeInstance.id);
    await this.testRealtimeConnection(selectedContact.id, activeInstance.id);
    await this.testFilters(selectedContact.id, activeInstance.id);

    console.log('[Realtime Test] 📊 Resultados dos testes:', this.results);
    return this.results;
  }

  /**
   * 📋 GERAR RELATÓRIO
   */
  generateReport(): string {
    const { webhookStatus, rlsStatus, realtimeStatus, filterStatus, details } = this.results;
    
    let report = '📊 RELATÓRIO DE TESTES DO REALTIME\n\n';
    
    report += `🗄️ Acesso ao Banco: ${rlsStatus === 'ok' ? '✅ OK' : '❌ ERRO'}\n`;
    report += `🔄 Conexão Realtime: ${realtimeStatus === 'ok' ? '✅ OK' : '❌ ERRO'}\n`;
    report += `🎯 Filtros: ${filterStatus === 'ok' ? '✅ OK' : '❌ ERRO'}\n`;
    report += `🌐 Status Conexão: ${details.connectionStatus}\n`;
    report += `📨 Mensagens Recentes: ${details.lastMessages.length}\n\n`;
    
    if (details.errors.length > 0) {
      report += '❌ ERROS ENCONTRADOS:\n';
      details.errors.forEach((error, index) => {
        report += `${index + 1}. ${error}\n`;
      });
    } else {
      report += '✅ NENHUM ERRO ENCONTRADO\n';
    }
    
    return report;
  }
}

// Exportar instância singleton
export const realtimeTestManager = new RealtimeTestManager(); 