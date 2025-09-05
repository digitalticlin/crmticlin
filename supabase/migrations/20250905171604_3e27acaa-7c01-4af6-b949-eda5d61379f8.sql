-- 🔧 CORREÇÕES CIRÚRGICAS DO BANCO DE DADOS
-- Adicionar campos ausentes que estão causando erros TypeScript

-- 1. Adicionar campos ausentes na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS invite_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS linked_auth_user_id UUID REFERENCES auth.users(id);

-- 2. Adicionar campos ausentes na tabela ai_agents (campos de prompt que estão faltando)
ALTER TABLE public.ai_agents 
ADD COLUMN IF NOT EXISTS agent_function TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS agent_objective TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS communication_style TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS company_info TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS products_services TEXT DEFAULT '',
ADD COLUMN IF NOT EXISTS rules_guidelines JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS prohibitions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS client_objections JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS flow JSONB DEFAULT '[]'::jsonb;

-- 3. Criar função RPC accept_team_invite_safely que está sendo chamada mas não existe
CREATE OR REPLACE FUNCTION public.accept_team_invite_safely(
  p_invite_token UUID,
  p_auth_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Atualizar o profile para vincular ao usuário auth e marcar como aceito
  UPDATE public.profiles 
  SET 
    linked_auth_user_id = p_auth_user_id,
    invite_status = 'accepted',
    updated_at = NOW()
  WHERE invite_token = p_invite_token
    AND invite_status = 'pending';

  -- Verificar se a atualização foi bem-sucedida
  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Convite não encontrado ou já foi aceito'
    );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Convite aceito com sucesso',
    'user_id', p_auth_user_id
  );
END;
$$;