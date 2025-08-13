-- Otimização de Índices para Busca de Leads
-- Esta migração resolve o problema de leads não encontrados na busca
-- criando índices GIN apropriados para queries ILIKE

-- Habilitar extensão trigram para busca eficiente
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. ÍNDICES GIN para busca de texto eficiente com ILIKE
-- Estes índices aceleram drasticamente as queries de busca

-- Índice GIN para campo name (busca por nome)
CREATE INDEX IF NOT EXISTS idx_leads_name_gin 
ON public.leads USING GIN (name gin_trgm_ops);

-- Índice GIN para campo email (busca por email)
CREATE INDEX IF NOT EXISTS idx_leads_email_gin 
ON public.leads USING GIN (email gin_trgm_ops);

-- Índice GIN para campo notes (busca por anotações)
CREATE INDEX IF NOT EXISTS idx_leads_notes_gin 
ON public.leads USING GIN (notes gin_trgm_ops);

-- Índice GIN para campo company (busca por empresa)
CREATE INDEX IF NOT EXISTS idx_leads_company_gin 
ON public.leads USING GIN (company gin_trgm_ops);

-- 2. ÍNDICES COMPOSTOS para queries com filtros combinados
-- Estes índices otimizam as queries que filtram por usuário + campo de busca

-- Índice composto: user + name (WhatsApp Chat, Clientes)
CREATE INDEX IF NOT EXISTS idx_leads_user_name 
ON public.leads (created_by_user_id, name);

-- Índice composto: user + phone (WhatsApp Chat, Clientes)  
CREATE INDEX IF NOT EXISTS idx_leads_user_phone 
ON public.leads (created_by_user_id, phone);

-- Índice composto: user + email (WhatsApp Chat, Clientes)
CREATE INDEX IF NOT EXISTS idx_leads_user_email 
ON public.leads (created_by_user_id, email);

-- Índice composto: funnel + updated_at (Sales Funnel)
CREATE INDEX IF NOT EXISTS idx_leads_funnel_updated 
ON public.leads (funnel_id, updated_at DESC);

-- Índice composto: user + last_message_time (WhatsApp Chat ordering)
CREATE INDEX IF NOT EXISTS idx_leads_user_last_message 
ON public.leads (created_by_user_id, last_message_time DESC NULLS LAST);

-- 3. FUNÇÃO DE BUSCA NORMALIZADA (opcional - para casos avançados)
-- Esta função trata acentos e formatação de telefone

CREATE OR REPLACE FUNCTION search_leads_normalized(
  user_id UUID,
  search_query TEXT,
  limit_count INTEGER DEFAULT 50,
  offset_count INTEGER DEFAULT 0
) 
RETURNS TABLE (
  id UUID,
  name TEXT,
  phone TEXT,
  email TEXT,
  company TEXT,
  notes TEXT,
  last_message TEXT,
  last_message_time TIMESTAMP WITH TIME ZONE,
  unread_count INTEGER,
  purchase_value NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) 
LANGUAGE sql STABLE
AS $$
  SELECT 
    l.id, l.name, l.phone, l.email, l.company, l.notes,
    l.last_message, l.last_message_time, l.unread_count, 
    l.purchase_value, l.created_at, l.updated_at
  FROM leads l
  WHERE l.created_by_user_id = user_id
  AND (
    unaccent(l.name) ILIKE unaccent('%' || search_query || '%') OR
    unaccent(l.email) ILIKE unaccent('%' || search_query || '%') OR
    unaccent(l.company) ILIKE unaccent('%' || search_query || '%') OR
    regexp_replace(l.phone, '[^0-9]', '', 'g') ILIKE 
    regexp_replace('%' || search_query || '%', '[^0-9]', '', 'g') OR
    unaccent(l.notes) ILIKE unaccent('%' || search_query || '%')
  )
  ORDER BY l.last_message_time DESC NULLS LAST, l.created_at DESC
  LIMIT limit_count OFFSET offset_count;
$$;

-- 4. COMENTÁRIOS E DOCUMENTAÇÃO
COMMENT ON INDEX idx_leads_name_gin IS 'Índice GIN para busca eficiente por nome usando ILIKE';
COMMENT ON INDEX idx_leads_email_gin IS 'Índice GIN para busca eficiente por email usando ILIKE';
COMMENT ON INDEX idx_leads_notes_gin IS 'Índice GIN para busca eficiente por notes usando ILIKE';
COMMENT ON INDEX idx_leads_company_gin IS 'Índice GIN para busca eficiente por company usando ILIKE';
COMMENT ON INDEX idx_leads_user_name IS 'Índice composto para filtro por usuário + nome';
COMMENT ON INDEX idx_leads_user_phone IS 'Índice composto para filtro por usuário + telefone';
COMMENT ON INDEX idx_leads_user_email IS 'Índice composto para filtro por usuário + email';
COMMENT ON INDEX idx_leads_funnel_updated IS 'Índice composto para filtro por funil + data atualização';
COMMENT ON INDEX idx_leads_user_last_message IS 'Índice composto para ordenação WhatsApp Chat';

COMMENT ON FUNCTION search_leads_normalized IS 'Função de busca normalizada que trata acentos e formatação de telefone';

-- 5. ESTATÍSTICAS PARA VERIFICAÇÃO
-- Execute depois da migração para verificar o impacto:
-- ANALYZE public.leads;

-- Para testar performance, use:
-- EXPLAIN ANALYZE SELECT * FROM leads WHERE created_by_user_id = 'uuid' AND name ILIKE '%test%';