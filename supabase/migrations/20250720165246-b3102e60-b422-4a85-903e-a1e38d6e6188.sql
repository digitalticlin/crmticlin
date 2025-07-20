
-- Adicionar políticas específicas para service_role nas tabelas principais
-- Isso permitirá que a webhook funcione corretamente

-- Política para service_role acessar tabela leads
CREATE POLICY "service_role_leads_full_access" ON "public"."leads"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política para service_role acessar tabela messages  
CREATE POLICY "service_role_messages_full_access" ON "public"."messages"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política para service_role acessar tabela whatsapp_instances
CREATE POLICY "service_role_whatsapp_instances_full_access" ON "public"."whatsapp_instances"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política para service_role acessar tabela funnels
CREATE POLICY "service_role_funnels_access" ON "public"."funnels"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Política para service_role acessar tabela kanban_stages
CREATE POLICY "service_role_kanban_stages_access" ON "public"."kanban_stages"
AS PERMISSIVE FOR ALL
TO service_role
USING (true)
WITH CHECK (true);
