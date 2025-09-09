import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type Lead = Database['public']['Tables']['leads']['Row'];
type Funnel = Database['public']['Tables']['funnels']['Row'];
type WhatsAppInstance = Database['public']['Tables']['whatsapp_instances']['Row'];
type Message = Database['public']['Tables']['messages']['Row'];

/**
 * 🔒 SERVICE OPERACIONAL ISOLADO
 * - Sempre filtra por owner_id ou atribuições específicas
 * - Nunca acessa dados de outros usuários
 * - Compatível com RLS policies do Supabase
 */
class OperationalSupabaseService {
  private userId: string | null = null;
  
  constructor() {
    this.initUserId();
  }
  
  private async initUserId() {
    const { data: { user } } = await supabase.auth.getUser();
    this.userId = user?.id || null;
    console.log('[OpService] 👤 Usuário operacional:', this.userId);
  }
  
  private async ensureUserId(): Promise<string> {
    if (!this.userId) {
      await this.initUserId();
    }
    if (!this.userId) {
      throw new Error('[OpService] ❌ Usuário não autenticado');
    }
    return this.userId;
  }

  // 🎯 LEADS: Apenas os atribuídos ao usuário
  async getAssignedLeads() {
    const userId = await this.ensureUserId();
    
    console.log('[OpService] 📋 Buscando leads atribuídos para:', userId);
    
    const { data, error } = await supabase
      .from('leads')
      .select(`
        *,
        funnel:funnels(id, name),
        kanban_stage:kanban_stages(id, name, color)
      `)
      .eq('owner_id', userId)  // 🔒 FILTRO AUTOMÁTICO
      .order('last_message_time', { ascending: false });

    if (error) {
      console.error('[OpService] ❌ Erro ao buscar leads:', error);
      throw error;
    }

    console.log('[OpService] ✅ Leads encontrados:', data?.length);
    return { data, error: null };
  }

  // 🎯 FUNIS: Apenas os atribuídos via user_funnels
  async getAssignedFunnels() {
    const userId = await this.ensureUserId();
    
    console.log('[OpService] 🎯 Buscando funis atribuídos para:', userId);
    
    // Buscar através da tabela user_funnels
    const { data, error } = await supabase
      .from('user_funnels')
      .select(`
        funnel_id,
        can_view,
        can_edit,
        funnel:funnels(
          *,
          kanban_stages(*)
        )
      `)
      .eq('profile_id', userId)  // 🔒 FILTRO POR USER_FUNNELS
      .eq('can_view', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[OpService] ❌ Erro ao buscar funis:', error);
      throw error;
    }

    // Extrair apenas os funis
    const funnels = data?.map(item => item.funnel).filter(Boolean) || [];
    console.log('[OpService] ✅ Funis encontrados:', funnels.length);
    return { data: funnels, error: null };
  }

  // 🎯 INSTÂNCIAS WHATSAPP: Apenas as atribuídas via user_whatsapp_numbers
  async getAssignedWhatsAppInstances() {
    const userId = await this.ensureUserId();
    
    console.log('[OpService] 📱 Buscando instâncias WhatsApp atribuídas para:', userId);
    
    // Buscar através da tabela user_whatsapp_numbers
    const { data, error } = await supabase
      .from('user_whatsapp_numbers')
      .select(`
        whatsapp_number_id,
        can_view,
        can_manage,
        whatsapp_instance:whatsapp_instances(*)
      `)
      .eq('profile_id', userId)  // 🔒 FILTRO POR USER_WHATSAPP_NUMBERS
      .eq('can_view', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[OpService] ❌ Erro ao buscar instâncias WhatsApp:', error);
      throw error;
    }

    // Extrair apenas as instâncias
    const instances = data?.map(item => item.whatsapp_instance).filter(Boolean) || [];
    console.log('[OpService] ✅ Instâncias WhatsApp encontradas:', instances.length);
    return { data: instances, error: null };
  }

  // 🎯 MENSAGENS: Apenas dos leads atribuídos
  async getAssignedMessages(leadId?: string) {
    const userId = await this.ensureUserId();
    
    console.log('[OpService] 💬 Buscando mensagens atribuídas para:', userId, leadId ? `lead: ${leadId}` : 'todos os leads');
    
    let query = supabase
      .from('messages')
      .select(`
        *,
        lead:leads!inner(
          id,
          name,
          phone,
          owner_id
        )
      `)
      .eq('leads.owner_id', userId)  // 🔒 JOIN com filtro por owner_id
      .order('timestamp', { ascending: false });

    // Filtro específico por lead se fornecido
    if (leadId) {
      query = query.eq('lead_id', leadId);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[OpService] ❌ Erro ao buscar mensagens:', error);
      throw error;
    }

    console.log('[OpService] ✅ Mensagens encontradas:', data?.length);
    return { data, error: null };
  }

  // 🎯 DASHBOARD: KPIs dos dados atribuídos
  async getDashboardKPIs() {
    const userId = await this.ensureUserId();
    
    console.log('[OpService] 📊 Calculando KPIs do dashboard para:', userId);
    
    try {
      // Buscar dados em paralelo
      const [leadsResult, messagesResult] = await Promise.all([
        this.getAssignedLeads(),
        this.getAssignedMessages()
      ]);

      const leads = leadsResult.data || [];
      const messages = messagesResult.data || [];

      // Calcular KPIs específicos operacional
      const totalLeads = leads.length;
      const totalMessages = messages.length;
      const unreadCount = leads.reduce((sum, lead) => sum + (lead.unread_count || 0), 0);
      
      // Mensagens enviadas vs recebidas (hoje)
      const today = new Date().toISOString().split('T')[0];
      const todayMessages = messages.filter(m => m.timestamp?.startsWith(today));
      const sentToday = todayMessages.filter(m => m.from_me).length;
      const receivedToday = todayMessages.filter(m => !m.from_me).length;
      
      // Taxa de resposta (mensagens enviadas / recebidas)
      const responseRate = receivedToday > 0 ? ((sentToday / receivedToday) * 100).toFixed(1) : '0';

      const kpis = {
        totalLeads,
        totalMessages,
        unreadCount,
        sentToday,
        receivedToday,
        responseRate: parseFloat(responseRate),
        lastUpdate: new Date().toISOString()
      };

      console.log('[OpService] ✅ KPIs calculados:', kpis);
      return { data: kpis, error: null };
      
    } catch (error) {
      console.error('[OpService] ❌ Erro ao calcular KPIs:', error);
      return { data: null, error };
    }
  }

  // 🎯 UTILITÁRIO: Verificar se tem acesso a um lead específico
  async hasAccessToLead(leadId: string): Promise<boolean> {
    const userId = await this.ensureUserId();
    
    const { data, error } = await supabase
      .from('leads')
      .select('id')
      .eq('id', leadId)
      .eq('owner_id', userId)
      .single();

    return !!data && !error;
  }

  // 🎯 UTILITÁRIO: Verificar se tem acesso a uma instância WhatsApp
  async hasAccessToWhatsAppInstance(instanceId: string): Promise<boolean> {
    const userId = await this.ensureUserId();
    
    const { data, error } = await supabase
      .from('user_whatsapp_numbers')
      .select('whatsapp_number_id')
      .eq('whatsapp_number_id', instanceId)
      .eq('profile_id', userId)
      .eq('can_view', true)
      .single();

    return !!data && !error;
  }
}

// 🎯 SINGLETON: Instância única do service
export const opSupabaseService = new OperationalSupabaseService();
export type { Lead, Funnel, WhatsAppInstance, Message };