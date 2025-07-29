
-- Criar tabela de assinaturas de planos
CREATE TABLE public.plan_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT UNIQUE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('messages_1k', 'messages_3k', 'messages_5k')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de rastreamento de uso de mensagens
CREATE TABLE public.message_usage_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_subscription_id UUID REFERENCES plan_subscriptions(id) ON DELETE CASCADE,
  period_start TIMESTAMP WITH TIME ZONE NOT NULL,
  period_end TIMESTAMP WITH TIME ZONE NOT NULL,
  messages_sent_count INTEGER NOT NULL DEFAULT 0,
  messages_received_count INTEGER NOT NULL DEFAULT 0,
  total_messages_count INTEGER NOT NULL DEFAULT 0,
  plan_limit INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'warning', 'exceeded', 'blocked')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de alertas de uso
CREATE TABLE public.usage_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('warning_75', 'warning_90', 'limit_reached')),
  current_usage INTEGER NOT NULL,
  plan_limit INTEGER NOT NULL,
  percentage_used NUMERIC NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  acknowledged BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.plan_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_usage_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_alerts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para plan_subscriptions
CREATE POLICY "Users can view their own subscriptions" ON public.plan_subscriptions
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own subscriptions" ON public.plan_subscriptions
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all subscriptions" ON public.plan_subscriptions
FOR ALL USING (true) WITH CHECK (true);

-- Políticas RLS para message_usage_tracking
CREATE POLICY "Users can view their own usage" ON public.message_usage_tracking
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all usage" ON public.message_usage_tracking
FOR ALL USING (true) WITH CHECK (true);

-- Políticas RLS para usage_alerts
CREATE POLICY "Users can view their own alerts" ON public.usage_alerts
FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can acknowledge their alerts" ON public.usage_alerts
FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all alerts" ON public.usage_alerts
FOR ALL USING (true) WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_plan_subscriptions_user_id ON public.plan_subscriptions(user_id);
CREATE INDEX idx_plan_subscriptions_stripe_customer_id ON public.plan_subscriptions(stripe_customer_id);
CREATE INDEX idx_message_usage_tracking_user_id ON public.message_usage_tracking(user_id);
CREATE INDEX idx_message_usage_tracking_period ON public.message_usage_tracking(period_start, period_end);
CREATE INDEX idx_usage_alerts_user_id ON public.usage_alerts(user_id);
CREATE INDEX idx_usage_alerts_acknowledged ON public.usage_alerts(acknowledged);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers para atualizar updated_at
CREATE TRIGGER update_plan_subscriptions_updated_at
    BEFORE UPDATE ON public.plan_subscriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_message_usage_tracking_updated_at
    BEFORE UPDATE ON public.message_usage_tracking
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
