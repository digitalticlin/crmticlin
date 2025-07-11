
-- Criar tabela para armazenar os agentes de IA
CREATE TABLE public.ai_agents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('attendance', 'sales', 'support', 'custom')),
  status TEXT NOT NULL DEFAULT 'inactive' CHECK (status IN ('active', 'inactive')),
  funnel_id UUID REFERENCES public.funnels(id) ON DELETE SET NULL,
  whatsapp_number_id UUID REFERENCES public.whatsapp_instances(id) ON DELETE SET NULL,
  messages_count INTEGER NOT NULL DEFAULT 0,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela para armazenar os prompts dos agentes de IA
CREATE TABLE public.ai_agent_prompts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  agent_id UUID NOT NULL REFERENCES public.ai_agents(id) ON DELETE CASCADE,
  agent_function TEXT NOT NULL,
  communication_style TEXT NOT NULL,
  company_info TEXT,
  product_service_info TEXT,
  prohibitions TEXT,
  objectives JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by_user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Habilitar RLS para ai_agents
ALTER TABLE public.ai_agents ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ai_agents
CREATE POLICY "Users can view their own agents" 
  ON public.ai_agents 
  FOR SELECT 
  USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can create their own agents" 
  ON public.ai_agents 
  FOR INSERT 
  WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can update their own agents" 
  ON public.ai_agents 
  FOR UPDATE 
  USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can delete their own agents" 
  ON public.ai_agents 
  FOR DELETE 
  USING (created_by_user_id = auth.uid());

-- Habilitar RLS para ai_agent_prompts
ALTER TABLE public.ai_agent_prompts ENABLE ROW LEVEL SECURITY;

-- Políticas RLS para ai_agent_prompts
CREATE POLICY "Users can view their own agent prompts" 
  ON public.ai_agent_prompts 
  FOR SELECT 
  USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can create their own agent prompts" 
  ON public.ai_agent_prompts 
  FOR INSERT 
  WITH CHECK (created_by_user_id = auth.uid());

CREATE POLICY "Users can update their own agent prompts" 
  ON public.ai_agent_prompts 
  FOR UPDATE 
  USING (created_by_user_id = auth.uid());

CREATE POLICY "Users can delete their own agent prompts" 
  ON public.ai_agent_prompts 
  FOR DELETE 
  USING (created_by_user_id = auth.uid());

-- Adicionar trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_ai_agents_updated_at 
  BEFORE UPDATE ON public.ai_agents 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_agent_prompts_updated_at 
  BEFORE UPDATE ON public.ai_agent_prompts 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Criar índices para melhorar performance
CREATE INDEX idx_ai_agents_created_by_user_id ON public.ai_agents(created_by_user_id);
CREATE INDEX idx_ai_agents_status ON public.ai_agents(status);
CREATE INDEX idx_ai_agent_prompts_agent_id ON public.ai_agent_prompts(agent_id);
