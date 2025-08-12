-- Adicionar campo profile_pic_url à tabela leads para fotos de perfil dos contatos
-- Esta migração permite armazenar as fotos de perfil dos leads obtidas via WhatsApp

-- Adicionar coluna profile_pic_url
ALTER TABLE public.leads 
ADD COLUMN IF NOT EXISTS profile_pic_url TEXT;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.leads.profile_pic_url IS 'URL da foto de perfil do lead obtida via WhatsApp API';

-- Criar índice para performance (opcional, para buscas por leads com/sem foto)
CREATE INDEX IF NOT EXISTS idx_leads_profile_pic_url ON public.leads(profile_pic_url) 
WHERE profile_pic_url IS NOT NULL;

-- Registrar migração
INSERT INTO public.schema_migrations (version) VALUES ('20250811_add_profile_pic_to_leads')
ON CONFLICT (version) DO NOTHING;