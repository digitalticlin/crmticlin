
-- Migração para adicionar políticas RLS para service_role
-- Necessário para webhooks funcionarem corretamente

-- Política para service_role acessar tabela leads (necessário para FK constraints)
CREATE POLICY "service_role_leads_policy" ON "public"."leads"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política para service_role acessar tabela messages 
CREATE POLICY "service_role_messages_policy" ON "public"."messages"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política para service_role acessar tabela whatsapp_instances (usado nas políticas existentes)
CREATE POLICY "service_role_whatsapp_instances_policy" ON "public"."whatsapp_instances"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true); 
