
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface BroadcastCampaign {
  id: string;
  name: string;
  message_text: string;
  media_type?: 'text' | 'image' | 'video' | 'audio' | 'document';
  media_url?: string;
  target_type: 'all' | 'segment' | 'custom';
  target_config: Record<string, any>;
  status: 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed' | 'paused' | 'running';
  scheduled_at?: string;
  sent_at?: string;
  total_recipients: number;
  successful_sends: number;
  failed_sends: number;
  sent_count: number;
  failed_count: number;
  rate_limit_per_minute: number;
  business_hours_only: boolean;
  timezone: string;
  whatsapp_number_id: string;
  created_by_user_id: string;
  created_at: string;
  updated_at: string;
}

export const useBroadcastCampaigns = () => {
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCampaigns();
  }, []);

  const fetchCampaigns = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Mock data since broadcast_campaigns table doesn't exist yet
      const mockCampaigns: BroadcastCampaign[] = [
        {
          id: '1',
          name: 'Campanha de Teste',
          message_text: 'Olá! Esta é uma mensagem de teste.',
          media_type: 'text',
          target_type: 'all',
          target_config: {},
          status: 'draft',
          total_recipients: 100,
          successful_sends: 0,
          failed_sends: 0,
          sent_count: 0,
          failed_count: 0,
          rate_limit_per_minute: 2,
          business_hours_only: false,
          timezone: 'America/Sao_Paulo',
          whatsapp_number_id: '',
          created_by_user_id: '',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ];
      
      setCampaigns(mockCampaigns);
    } catch (err) {
      console.error('Erro ao buscar campanhas:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData: Omit<BroadcastCampaign, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      // Mock creation since table doesn't exist yet
      const newCampaign: BroadcastCampaign = {
        ...campaignData,
        id: Date.now().toString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      setCampaigns(prev => [...prev, newCampaign]);
      return newCampaign;
    } catch (err) {
      console.error('Erro ao criar campanha:', err);
      throw err;
    }
  };

  const updateCampaign = async (id: string, updates: Partial<BroadcastCampaign>) => {
    try {
      setCampaigns(prev => 
        prev.map(campaign => 
          campaign.id === id 
            ? { ...campaign, ...updates, updated_at: new Date().toISOString() }
            : campaign
        )
      );
    } catch (err) {
      console.error('Erro ao atualizar campanha:', err);
      throw err;
    }
  };

  const deleteCampaign = async (id: string) => {
    try {
      setCampaigns(prev => prev.filter(campaign => campaign.id !== id));
    } catch (err) {
      console.error('Erro ao deletar campanha:', err);
      throw err;
    }
  };

  const startCampaign = async (id: string) => {
    try {
      await updateCampaign(id, { status: 'running' });
      return true;
    } catch (err) {
      console.error('Erro ao iniciar campanha:', err);
      return false;
    }
  };

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    createCampaign,
    updateCampaign,
    deleteCampaign,
    startCampaign
  };
};
