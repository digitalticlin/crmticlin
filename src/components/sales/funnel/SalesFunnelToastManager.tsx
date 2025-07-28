
/**
 * 🚀 GERENCIADOR DE TOAST NOTIFICATIONS PARA SALES FUNNEL
 * 
 * Centraliza e otimiza todas as notificações do funil de vendas
 */

import { useEffect } from 'react';
import { toast } from 'sonner';
import { KanbanLead } from '@/types/kanban';

interface SalesFunnelToastManagerProps {
  enabled?: boolean;
}

export const SalesFunnelToastManager: React.FC<SalesFunnelToastManagerProps> = ({
  enabled = true
}) => {
  
  // 📊 LISTENER PARA EVENTOS DE LEAD
  useEffect(() => {
    if (!enabled) return;

    const handleLeadEvent = (event: CustomEvent) => {
      const { type, lead, data } = event.detail;

      switch (type) {
        case 'lead:created':
          toast.success(`Novo lead: ${lead.name}`, {
            description: `Telefone: ${lead.phone}`,
            duration: 3000
          });
          break;

        case 'lead:updated':
          toast.info(`Lead atualizado: ${lead.name}`, {
            description: data?.changes || 'Informações modificadas',
            duration: 2000
          });
          break;

        case 'lead:moved':
          toast.info(`${lead.name} movido`, {
            description: `Para: ${data?.stageName || 'Nova etapa'}`,
            duration: 2000
          });
          break;

        case 'lead:deleted':
          toast.error(`Lead removido: ${lead.name}`, {
            description: 'Ação não pode ser desfeita',
            duration: 4000
          });
          break;

        case 'lead:won':
          toast.success(`🎉 Lead ganho: ${lead.name}`, {
            description: data?.value ? `Valor: R$ ${data.value}` : 'Parabéns pela venda!',
            duration: 5000
          });
          break;

        case 'lead:lost':
          toast.error(`Lead perdido: ${lead.name}`, {
            description: data?.reason || 'Oportunidade perdida',
            duration: 3000
          });
          break;

        case 'lead:chatOpened':
          toast.info(`💬 Chat aberto com ${lead.name}`, {
            description: 'Redirecionando para WhatsApp...',
            duration: 2000
          });
          break;

        default:
          console.log('[Sales Funnel Toast Manager] 📢 Evento não reconhecido:', type);
      }
    };

    // Escutar eventos personalizados
    window.addEventListener('salesFunnel:leadEvent', handleLeadEvent as EventListener);
    
    return () => {
      window.removeEventListener('salesFunnel:leadEvent', handleLeadEvent as EventListener);
    };
  }, [enabled]);

  // 🏗️ LISTENER PARA EVENTOS DE STAGE
  useEffect(() => {
    if (!enabled) return;

    const handleStageEvent = (event: CustomEvent) => {
      const { type, stage, data } = event.detail;

      switch (type) {
        case 'stage:created':
          toast.success(`Nova etapa: ${stage.title}`, {
            description: 'Etapa adicionada ao funil',
            duration: 3000
          });
          break;

        case 'stage:updated':
          toast.info(`Etapa atualizada: ${stage.title}`, {
            description: data?.changes || 'Configurações modificadas',
            duration: 2000
          });
          break;

        case 'stage:deleted':
          toast.error(`Etapa removida: ${stage.title}`, {
            description: 'Leads foram movidos para outras etapas',
            duration: 4000
          });
          break;

        default:
          console.log('[Sales Funnel Toast Manager] 📢 Evento de stage não reconhecido:', type);
      }
    };

    // Escutar eventos personalizados
    window.addEventListener('salesFunnel:stageEvent', handleStageEvent as EventListener);
    
    return () => {
      window.removeEventListener('salesFunnel:stageEvent', handleStageEvent as EventListener);
    };
  }, [enabled]);

  // 🔄 LISTENER PARA EVENTOS DE SINCRONIZAÇÃO
  useEffect(() => {
    if (!enabled) return;

    const handleSyncEvent = (event: CustomEvent) => {
      const { type, message, data } = event.detail;

      switch (type) {
        case 'sync:connected':
          toast.success('Sincronização ativada', {
            description: 'Funil de vendas em tempo real',
            duration: 2000
          });
          break;

        case 'sync:disconnected':
          toast.warning('Sincronização desconectada', {
            description: 'Tentando reconectar...',
            duration: 3000
          });
          break;

        case 'sync:error':
          toast.error('Erro na sincronização', {
            description: message || 'Verifique sua conexão',
            duration: 4000
          });
          break;

        case 'sync:recovered':
          toast.success('Sincronização recuperada', {
            description: 'Dados atualizados',
            duration: 2000
          });
          break;

        default:
          console.log('[Sales Funnel Toast Manager] 📢 Evento de sync não reconhecido:', type);
      }
    };

    // Escutar eventos personalizados
    window.addEventListener('salesFunnel:syncEvent', handleSyncEvent as EventListener);
    
    return () => {
      window.removeEventListener('salesFunnel:syncEvent', handleSyncEvent as EventListener);
    };
  }, [enabled]);

  // Este componente não renderiza nada
  return null;
};

// 🚀 FUNÇÕES HELPER PARA DISPARAR EVENTOS
export const triggerLeadEvent = (type: string, lead: KanbanLead, data?: any) => {
  const event = new CustomEvent('salesFunnel:leadEvent', {
    detail: { type, lead, data }
  });
  window.dispatchEvent(event);
};

export const triggerStageEvent = (type: string, stage: any, data?: any) => {
  const event = new CustomEvent('salesFunnel:stageEvent', {
    detail: { type, stage, data }
  });
  window.dispatchEvent(event);
};

export const triggerSyncEvent = (type: string, message?: string, data?: any) => {
  const event = new CustomEvent('salesFunnel:syncEvent', {
    detail: { type, message, data }
  });
  window.dispatchEvent(event);
};
