
export interface BroadcastCampaign {
  id: string;
  name: string;
  message_text: string;
  target_type: string;
  target_config: any;
  status: string;
  created_at: string;
  updated_at: string;
  created_by_user_id: string;
  scheduled_at?: string;
  rate_limit_per_minute: number;
  business_hours_only: boolean;
  media_type?: string;
  media_url?: string;
}
