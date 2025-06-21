
-- Create ENUM types
CREATE TYPE public.user_role AS ENUM ('admin', 'operational', 'manager');
CREATE TYPE public.message_status AS ENUM ('sent', 'delivered', 'read', 'failed');
CREATE TYPE public.media_type AS ENUM ('text', 'image', 'video', 'audio', 'document');

-- 1. PROFILES TABLE (Perfis de usuários)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  username TEXT,
  document_id TEXT,
  whatsapp TEXT,
  role user_role DEFAULT 'admin',
  created_by_user_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 2. WHATSAPP INSTANCES TABLE
CREATE TABLE public.whatsapp_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  instance_name TEXT NOT NULL,
  vps_instance_id TEXT,
  phone TEXT,
  profile_name TEXT,
  profile_pic_url TEXT,
  connection_status TEXT DEFAULT 'disconnected',
  connection_type TEXT DEFAULT 'web',
  web_status TEXT,
  qr_code TEXT,
  server_url TEXT,
  n8n_webhook_url TEXT,
  date_connected TIMESTAMP WITH TIME ZONE,
  date_disconnected TIMESTAMP WITH TIME ZONE,
  session_data JSONB,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. FUNNELS TABLE (Funis de vendas)
CREATE TABLE public.funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 4. KANBAN STAGES TABLE (Estágios do funil)
CREATE TABLE public.kanban_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  color TEXT DEFAULT '#e0e0e0',
  order_position INTEGER DEFAULT 0,
  is_won BOOLEAN DEFAULT false,
  is_lost BOOLEAN DEFAULT false,
  is_fixed BOOLEAN DEFAULT false,
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 5. LEADS TABLE (Leads/Contatos)
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  address TEXT,
  company TEXT,
  document_id TEXT,
  notes TEXT,
  purchase_value NUMERIC(10,2) DEFAULT 0,
  owner_id TEXT,
  kanban_stage_id UUID REFERENCES public.kanban_stages(id),
  funnel_id UUID NOT NULL REFERENCES public.funnels(id),
  whatsapp_number_id UUID REFERENCES public.whatsapp_instances(id),
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER DEFAULT 0,
  order_position INTEGER DEFAULT 0,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 6. MESSAGES TABLE (Mensagens WhatsApp)
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  text TEXT,
  from_me BOOLEAN DEFAULT false,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status message_status DEFAULT 'sent',
  media_type media_type DEFAULT 'text',
  media_url TEXT,
  lead_id UUID REFERENCES public.leads(id) ON DELETE CASCADE,
  whatsapp_number_id UUID NOT NULL REFERENCES public.whatsapp_instances(id),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 7. TAGS TABLE (Tags para categorização)
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT DEFAULT '#3b82f6',
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 8. LEAD TAGS TABLE (Relacionamento leads-tags)
CREATE TABLE public.lead_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  tag_id UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(lead_id, tag_id)
);

-- 9. USER WHATSAPP NUMBERS TABLE (Permissões WhatsApp)
CREATE TABLE public.user_whatsapp_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  whatsapp_number_id UUID NOT NULL REFERENCES public.whatsapp_instances(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, whatsapp_number_id)
);

-- 10. USER FUNNELS TABLE (Permissões de funis)
CREATE TABLE public.user_funnels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  funnel_id UUID NOT NULL REFERENCES public.funnels(id) ON DELETE CASCADE,
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(profile_id, funnel_id)
);

-- 11. DEALS TABLE (Histórico de negócios)
CREATE TABLE public.deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id),
  status TEXT NOT NULL CHECK (status IN ('won', 'lost')),
  value NUMERIC(10,2) DEFAULT 0,
  note TEXT,
  date TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_by_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 12. LOG TABLES (Para admin/diagnósticos)
CREATE TABLE public.auto_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  execution_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL,
  instances_found INTEGER DEFAULT 0,
  instances_added INTEGER DEFAULT 0,
  instances_updated INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  execution_duration_ms INTEGER,
  error_details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE TABLE public.sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  function_name TEXT NOT NULL,
  status TEXT NOT NULL,
  execution_time TEXT,
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- INDEXES for performance
CREATE INDEX idx_profiles_created_by_user_id ON public.profiles(created_by_user_id);
CREATE INDEX idx_whatsapp_instances_created_by_user_id ON public.whatsapp_instances(created_by_user_id);
CREATE INDEX idx_whatsapp_instances_connection_status ON public.whatsapp_instances(connection_status);
CREATE INDEX idx_whatsapp_instances_instance_name ON public.whatsapp_instances(instance_name);
CREATE INDEX idx_funnels_created_by_user_id ON public.funnels(created_by_user_id);
CREATE INDEX idx_kanban_stages_funnel_id ON public.kanban_stages(funnel_id);
CREATE INDEX idx_kanban_stages_created_by_user_id ON public.kanban_stages(created_by_user_id);
CREATE INDEX idx_leads_created_by_user_id ON public.leads(created_by_user_id);
CREATE INDEX idx_leads_funnel_id ON public.leads(funnel_id);
CREATE INDEX idx_leads_kanban_stage_id ON public.leads(kanban_stage_id);
CREATE INDEX idx_leads_phone ON public.leads(phone);
CREATE INDEX idx_messages_lead_id ON public.messages(lead_id);
CREATE INDEX idx_messages_whatsapp_number_id ON public.messages(whatsapp_number_id);
CREATE INDEX idx_messages_created_by_user_id ON public.messages(created_by_user_id);
CREATE INDEX idx_tags_created_by_user_id ON public.tags(created_by_user_id);
CREATE INDEX idx_lead_tags_lead_id ON public.lead_tags(lead_id);
CREATE INDEX idx_lead_tags_tag_id ON public.lead_tags(tag_id);

-- UNIQUE CONSTRAINTS
ALTER TABLE public.whatsapp_instances ADD CONSTRAINT unique_instance_name_per_user 
  UNIQUE (instance_name, created_by_user_id);

ALTER TABLE public.tags ADD CONSTRAINT unique_tag_name_per_user 
  UNIQUE (name, created_by_user_id);

-- Enable Row Level Security on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kanban_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lead_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_whatsapp_numbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_funnels ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auto_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- RLS POLICIES for multi-tenant isolation

-- Profiles policies
CREATE POLICY "Users can view profiles in their organization" ON public.profiles
  FOR SELECT USING (created_by_user_id = auth.uid() OR id = auth.uid());

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Admins can manage profiles in their organization" ON public.profiles
  FOR ALL USING (created_by_user_id = auth.uid());

-- WhatsApp instances policies
CREATE POLICY "Users can view instances in their organization" ON public.whatsapp_instances
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can manage instances in their organization" ON public.whatsapp_instances
  FOR ALL USING (created_by_user_id = auth.uid());

-- Funnels policies
CREATE POLICY "Users can view funnels in their organization" ON public.funnels
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can manage funnels in their organization" ON public.funnels
  FOR ALL USING (created_by_user_id = auth.uid());

-- Kanban stages policies
CREATE POLICY "Users can view stages in their organization" ON public.kanban_stages
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can manage stages in their organization" ON public.kanban_stages
  FOR ALL USING (created_by_user_id = auth.uid());

-- Leads policies
CREATE POLICY "Users can view leads in their organization" ON public.leads
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can manage leads in their organization" ON public.leads
  FOR ALL USING (created_by_user_id = auth.uid());

-- Messages policies
CREATE POLICY "Users can view messages in their organization" ON public.messages
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can manage messages in their organization" ON public.messages
  FOR ALL USING (created_by_user_id = auth.uid());

-- Tags policies
CREATE POLICY "Users can view tags in their organization" ON public.tags
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can manage tags in their organization" ON public.tags
  FOR ALL USING (created_by_user_id = auth.uid());

-- Lead tags policies
CREATE POLICY "Users can view lead tags in their organization" ON public.lead_tags
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can manage lead tags in their organization" ON public.lead_tags
  FOR ALL USING (created_by_user_id = auth.uid());

-- User WhatsApp numbers policies
CREATE POLICY "Users can view assignments in their organization" ON public.user_whatsapp_numbers
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can manage assignments in their organization" ON public.user_whatsapp_numbers
  FOR ALL USING (created_by_user_id = auth.uid());

-- User funnels policies
CREATE POLICY "Users can view funnel assignments in their organization" ON public.user_funnels
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can manage funnel assignments in their organization" ON public.user_funnels
  FOR ALL USING (created_by_user_id = auth.uid());

-- Deals policies
CREATE POLICY "Users can view deals in their organization" ON public.deals
  FOR SELECT USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can manage deals in their organization" ON public.deals
  FOR ALL USING (created_by_user_id = auth.uid());

-- Log tables policies (admin access)
CREATE POLICY "Allow read access to sync logs" ON public.auto_sync_logs FOR SELECT USING (true);
CREATE POLICY "Allow read access to operation logs" ON public.sync_logs FOR SELECT USING (true);

-- Enable realtime for key tables
ALTER TABLE public.whatsapp_instances REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.kanban_stages REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.kanban_stages;

-- Create trigger to auto-update updated_at columns
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_whatsapp_instances_updated_at BEFORE UPDATE ON public.whatsapp_instances FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_funnels_updated_at BEFORE UPDATE ON public.funnels FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_kanban_stages_updated_at BEFORE UPDATE ON public.kanban_stages FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_leads_updated_at BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_tags_updated_at BEFORE UPDATE ON public.tags FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Create function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, created_by_user_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuário'),
    'admin',
    NEW.id  -- First user is admin of their own organization
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user registration
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
