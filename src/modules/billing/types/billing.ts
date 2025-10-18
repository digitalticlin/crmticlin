
export interface PlanSubscription {
  id: string;
  user_id: string;
  stripe_customer_id?: string;
  stripe_subscription_id?: string;
  plan_type: 'messages_1k' | 'messages_3k' | 'messages_5k';
  status: 'active' | 'canceled' | 'past_due' | 'trialing';
  current_period_start?: string;
  current_period_end?: string;
  created_at: string;
  updated_at: string;
}

export interface MessageUsageTracking {
  id: string;
  user_id: string;
  plan_subscription_id: string;
  period_start: string;
  period_end: string;
  ai_messages_sent: number;
  manual_messages_sent: number;
  plan_limit: number;
  custom_limit: number | null;
  bonus_messages: number;
  custom_limit_reason: string | null;
  custom_limit_expires_at: string | null;
  granted_by_admin_id: string | null;
  message_signature_enabled: boolean;
  status: 'active' | 'warning' | 'exceeded';
  last_reset_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface UsageAlert {
  id: string;
  user_id: string;
  alert_type: 'warning_75' | 'warning_90' | 'limit_reached';
  current_usage: number;
  plan_limit: number;
  percentage_used: number;
  sent_at: string;
  acknowledged: boolean;
  created_at: string;
}

export interface MessagePlan {
  id: string;
  name: string;
  price: number;
  message_limit: number;
  description: string;
  features: string[];
  stripe_price_id: string;
  is_trial?: boolean;
  is_popular?: boolean;
  is_enterprise?: boolean;
  max_users?: number;
  max_whatsapp_numbers?: number;
}

export interface UsageLimitCheck {
  allowed: boolean;
  remaining: number;
  current_usage: number;
  plan_limit: number;
  percentage_used: number;
  status: 'active' | 'warning' | 'exceeded' | 'blocked';
}
