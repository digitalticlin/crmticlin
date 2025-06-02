
-- Habilitar RLS nas tabelas do WhatsApp
ALTER TABLE public.whatsapp_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Políticas para whatsapp_instances
CREATE POLICY "Users can view their company instances" 
  ON public.whatsapp_instances 
  FOR SELECT 
  USING (
    public.is_super_admin() OR 
    (public.get_user_company_id() = company_id)
  );

CREATE POLICY "Users can create instances for their company" 
  ON public.whatsapp_instances 
  FOR INSERT 
  WITH CHECK (
    public.is_super_admin() OR 
    (public.get_user_company_id() = company_id)
  );

CREATE POLICY "Users can update their company instances" 
  ON public.whatsapp_instances 
  FOR UPDATE 
  USING (
    public.is_super_admin() OR 
    (public.get_user_company_id() = company_id)
  );

CREATE POLICY "Users can delete their company instances" 
  ON public.whatsapp_instances 
  FOR DELETE 
  USING (
    public.is_super_admin() OR 
    (public.get_user_company_id() = company_id)
  );

-- Políticas para messages
CREATE POLICY "Users can view messages from their WhatsApp numbers" 
  ON public.messages 
  FOR SELECT 
  USING (
    public.is_super_admin() OR 
    public.user_has_whatsapp_number(whatsapp_number_id)
  );

CREATE POLICY "Users can create messages for their WhatsApp numbers" 
  ON public.messages 
  FOR INSERT 
  WITH CHECK (
    public.is_super_admin() OR 
    public.user_has_whatsapp_number(whatsapp_number_id)
  );

-- Políticas para leads (já implementadas mas vou garantir que estão corretas)
DROP POLICY IF EXISTS "Users can view accessible leads" ON public.leads;
CREATE POLICY "Users can view accessible leads" 
  ON public.leads 
  FOR SELECT 
  USING (public.user_can_access_lead(id));

DROP POLICY IF EXISTS "Users can create leads for their WhatsApp numbers" ON public.leads;
CREATE POLICY "Users can create leads for their WhatsApp numbers" 
  ON public.leads 
  FOR INSERT 
  WITH CHECK (
    public.is_super_admin() OR 
    public.user_has_whatsapp_number(whatsapp_number_id)
  );

DROP POLICY IF EXISTS "Users can update accessible leads" ON public.leads;
CREATE POLICY "Users can update accessible leads" 
  ON public.leads 
  FOR UPDATE 
  USING (public.user_can_access_lead(id));

-- Habilitar realtime para as tabelas
ALTER TABLE public.whatsapp_instances REPLICA IDENTITY FULL;
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.leads REPLICA IDENTITY FULL;

-- Adicionar às publicações realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.whatsapp_instances;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.leads;
