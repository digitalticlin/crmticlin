-- Criar bucket de storage para imagens da Base de Conhecimento
-- Este bucket armazenará fotos de produtos e serviços dos agentes

-- Criar o bucket (público para permitir acesso às imagens)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'agent-knowledge',
  'agent-knowledge',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Política de upload (usuários autenticados podem fazer upload)
CREATE POLICY "Users can upload knowledge images"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'agent-knowledge' AND
  auth.uid() IS NOT NULL
);

-- Política de leitura pública (qualquer pessoa pode ver as imagens)
CREATE POLICY "Public can read knowledge images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'agent-knowledge');

-- Política de atualização (usuários podem atualizar suas próprias imagens)
CREATE POLICY "Users can update their knowledge images"
ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'agent-knowledge' AND
  auth.uid() IS NOT NULL
);

-- Política de exclusão (usuários podem deletar suas próprias imagens)
CREATE POLICY "Users can delete their knowledge images"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'agent-knowledge' AND
  auth.uid() IS NOT NULL
);
