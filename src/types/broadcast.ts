
export interface BroadcastTarget {
  type: 'all' | 'funnel' | 'stage' | 'tags' | 'custom';
  config?: {
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
  schedule_type: 'immediate' | 'scheduled' | 'recurring';
  scheduled_at?: string;
  rate_limit_per_minute: number;
  business_hours_only: boolean;
}
