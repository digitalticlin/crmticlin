
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface BroadcastCampaign {
  id: string;
  name: string;
  message_text: string;
  media_type?: string;
  media_url?: string;
  target_type: 'all' | 'funnel' | 'stage' | 'tags' | 'custom';
  target_config: any;
  schedule_type: 'immediate' | 'scheduled' | 'recurring';
  scheduled_at?: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'failed';
  total_recipients: number;
  sent_count: number;
  failed_count: number;
  rate_limit_per_minute: number;
  business_hours_only: boolean;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export const useBroadcastCampaigns = () => {
  const [campaigns, setCampaigns] = useState<BroadcastCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const fetchCampaigns = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      const { data, error } = await supabase
        .from('broadcast_campaigns')
        .select('*')
        .eq('created_by_user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setCampaigns((data || []).map(campaign => ({
        ...campaign,
        target_type: campaign.target_type as 'all' | 'tags' | 'funnel' | 'stage' | 'custom',
        schedule_type: campaign.schedule_type as 'immediate' | 'scheduled' | 'recurring'
      })));
    } catch (err: any) {
      console.error('Error fetching campaigns:', err);
      setError(err.message);
      toast.error('Erro ao carregar campanhas');
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaignData: Omit<BroadcastCampaign, 'id' | 'created_at' | 'updated_at' | 'total_recipients' | 'sent_count' | 'failed_count'>) => {
    if (!user?.id) {
      toast.error('Usuário não autenticado');
      return null;
    }

    try {
      const { data, error } = await supabase.functions.invoke('broadcast_campaign_manager', {
        body: {
          action: 'create_campaign',
          ...campaignData,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success('Campanha criada com sucesso!');
        await fetchCampaigns(); // Refresh list
        return data.campaign;
      } else {
        throw new Error(data.error || 'Erro ao criar campanha');
      }
    } catch (err: any) {
      console.error('Error creating campaign:', err);
      toast.error(err.message || 'Erro ao criar campanha');
      return null;
    }
  };

  const startCampaign = async (campaignId: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('broadcast_campaign_manager', {
        body: {
          action: 'start_campaign',
          campaign_id: campaignId,
        }
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Campanha iniciada com ${data.recipients_count} destinatários!`);
        await fetchCampaigns(); // Refresh list
        return true;
      } else {
        throw new Error(data.error || 'Erro ao iniciar campanha');
      }
    } catch (err: any) {
      console.error('Error starting campaign:', err);
      toast.error(err.message || 'Erro ao iniciar campanha');
      return false;
    }
  };

  useEffect(() => {
    fetchCampaigns();
  }, [user?.id]);

  return {
    campaigns,
    loading,
    error,
    fetchCampaigns,
    createCampaign,
    startCampaign,
  };
};
