-- Script para aplicar manualmente no Dashboard do Supabase

-- 1. Adicionar política para permitir acesso público aos convites
CREATE POLICY "Allow public access to invite data by token" ON profiles
FOR SELECT USING (
  invite_token IS NOT NULL  
  AND invite_status IN ('pending', 'invite_sent') 
);

-- 2. Corrigir tipo da coluna (se necessário)
-- ALTER TABLE profiles ALTER COLUMN invite_token TYPE text;