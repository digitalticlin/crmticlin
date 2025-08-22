
import { supabase } from '@/integrations/supabase/client';

export interface BroadcastTarget {
  type: 'all' | 'funnel' | 'stage' | 'tags' | 'custom';
  config: {
    funnel_id?: string;
    stage_id?: string;
    tag_ids?: string[];
    phone_numbers?: string[];
  };
}

export interface CreateCampaignData {
  name: string;
  message_text: string;
  media_type?: string;
  media_url?: string;
  target: BroadcastTarget;
  schedule_type?: 'immediate' | 'scheduled';
  scheduled_at?: string;
  rate_limit_per_minute?: number;
  business_hours_only?: boolean;
}

export class BroadcastService {
  static async getFunnels() {
    const { data, error } = await supabase
      .from('funnels')
      .select('id, name')
      .eq('is_active', true)
      .order('name');

    if (error) throw error;
    return data || [];
  }

  static async getStagesByFunnel(funnelId: string) {
    const { data, error } = await supabase
      .from('kanban_stages')
      .select('id, title')
      .eq('funnel_id', funnelId)
      .order('order_position');

    if (error) throw error;
    return data || [];
  }

  static async getTags() {
    const { data, error } = await supabase
      .from('tags')
      .select('id, name, color')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  static async getLeadsPreview(target: BroadcastTarget) {
    let query = supabase.from('leads').select('id, name, phone', { count: 'exact' });

    switch (target.type) {
      case 'all':
        // No additional filters
        break;
      
      case 'funnel':
        if (target.config.funnel_id) {
          query = query.eq('funnel_id', target.config.funnel_id);
        }
        break;
      
      case 'stage':
        if (target.config.stage_id) {
          query = query.eq('kanban_stage_id', target.config.stage_id);
        }
        break;
      
      case 'tags':
        if (target.config.tag_ids && target.config.tag_ids.length > 0) {
          // Mock implementation - in real app you'd use a join or subquery
          query = query.limit(100);
        }
        break;
      
      case 'custom':
        if (target.config.phone_numbers && target.config.phone_numbers.length > 0) {
          query = query.in('phone', target.config.phone_numbers);
        }
        break;
    }

    // Filter out leads without phone
    query = query.not('phone', 'is', null).not('phone', 'eq', '');

    const { data, error, count } = await query.limit(100);

    if (error) throw error;

    return {
      leads: data || [],
      totalCount: count || 0
    };
  }

  static async createCampaign(campaignData: CreateCampaignData) {
    // Mock implementation since broadcast tables don't exist
    console.log('Creating campaign:', campaignData);
    return {
      success: true,
      campaign_id: 'mock-campaign-id',
      message: 'Campaign created successfully'
    };
  }

  static async startCampaign(campaignId: string) {
    // Mock implementation
    console.log('Starting campaign:', campaignId);
    return {
      success: true,
      message: 'Campaign started successfully'
    };
  }

  static async getCampaignHistory(campaignId: string) {
    // Mock implementation since tables don't exist
    return [];
  }

  static async getCampaignQueue(campaignId: string) {
    // Mock implementation since tables don't exist
    return [];
  }
}
