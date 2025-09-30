
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
  messages_sent_count: number;
  messages_received_count: number;
  total_messages_count: number;
  plan_limit: number;
  status: 'active' | 'warning' | 'exceeded' | 'blocked';
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
