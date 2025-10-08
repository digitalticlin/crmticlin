# 📤 IMPLEMENTAÇÃO - UPLOAD DE MÍDIA PARA STORAGE

## 🎯 OBJETIVO
Permitir que o usuário faça upload de imagens/vídeos no bloco "Enviar Mídia" e armazene no Supabase Storage, salvando a URL no JSONB para o agente de IA usar.

---

## 📋 SITUAÇÃO ATUAL

### ❌ Problemas:
1. **Linha 72-74 do SendMediaEditor.tsx:** Upload não implementado (apenas TODO)
2. **Arquivo só fica em memória:** Não é enviado para storage
3. **Usuário precisa digitar URL manualmente:** Não há upload real

### ✅ Solução Necessária:
1. Upload de arquivo para Supabase Storage bucket `flow-media`
2. Retornar URL pública do arquivo
3. Salvar URL no JSONB do bloco
4. Agente de IA usar URL para enviar mídia via WhatsApp

---

## 🔧 IMPLEMENTAÇÃO

### **1. Criar Bucket no Supabase**

```sql
-- Executar no SQL Editor do Supabase
INSERT INTO storage.buckets (id, name, public)
VALUES ('flow-media', 'flow-media', true);

-- Configurar política de acesso público para leitura
CREATE POLICY "Public read access"
ON storage.objects FOR SELECT
USING (bucket_id = 'flow-media');

-- Permitir upload autenticado
CREATE POLICY "Authenticated upload"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'flow-media'
  AND auth.role() = 'authenticated'
);
```

---

### **2. Atualizar SendMediaEditor.tsx**

**Adicionar imports:**
```typescript
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
```

**Adicionar estados:**
```typescript
const { user } = useAuth();
const [isUploading, setIsUploading] = useState(false);
const [uploadProgress, setUploadProgress] = useState(0);
const [uploadError, setUploadError] = useState<string | null>(null);
```

**Implementar função de upload:**
```typescript
const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  if (!file || !user) return;

  setIsUploading(true);
  setUploadError(null);

  try {
    // 1. Gerar nome único para o arquivo
    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    // 2. Upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('flow-media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 3. Obter URL pública
    const { data: { publicUrl } } = supabase.storage
      .from('flow-media')
      .getPublicUrl(uploadData.path);

    // 4. Atualizar estados
    setUploadedFile(file);
    setMediaUrl(publicUrl);

    console.log('✅ Upload concluído:', publicUrl);

  } catch (error: any) {
    console.error('❌ Erro no upload:', error);
    setUploadError(error.message || 'Erro ao fazer upload');
  } finally {
    setIsUploading(false);
  }
};
```

**Atualizar handleSave:**
```typescript
const handleSave = () => {
  setIsEditingLabel(false);

  const messages: MessageText[] = [
    {
      type: mediaType === 'image' ? 'image' : 'video',
      content: caption || '',  // Legenda da mídia
      media_id: mediaUrl,      // URL do storage
      delay: 0
    }
  ];

  onSave({
    label,
    description,
    messages,
    mediaType,
    mediaUrl,
    caption
  });

  onClose();
};
```

**Atualizar UI do upload:**
```tsx
<div className="space-y-2">
  <Label htmlFor="mediaUpload" className="text-sm font-medium text-gray-700">
    Upload da {mediaType === 'image' ? 'Imagem' : 'Vídeo'}
  </Label>

  <div className="flex items-center gap-3">
    <label htmlFor="mediaUpload" className="flex-1 cursor-pointer">
      <div className={`flex items-center gap-3 bg-white/30 border border-white/40 rounded-xl p-4 hover:bg-white/40 transition-all ${isUploading ? 'opacity-50' : ''}`}>
        <div className="p-2 rounded-lg bg-gradient-to-br from-pink-500 to-rose-600">
          {isUploading ? (
            <Loader2 className="h-5 w-5 text-white animate-spin" />
          ) : (
            <Upload className="h-5 w-5 text-white" />
          )}
        </div>
        <div className="flex-1">
          {isUploading ? (
            <div>
              <p className="text-sm font-medium text-gray-900">Fazendo upload...</p>
              <p className="text-xs text-gray-600">Aguarde</p>
            </div>
          ) : uploadedFile ? (
            <div>
              <p className="text-sm font-medium text-gray-900">✅ {uploadedFile.name}</p>
              <p className="text-xs text-gray-600">
                {(uploadedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700">
                Clique para fazer upload
              </p>
              <p className="text-xs text-gray-600">
                {mediaType === 'image' ? 'PNG, JPG, JPEG até 10MB' : 'MP4, MOV até 50MB'}
              </p>
            </div>
          )}
        </div>
      </div>
    </label>
    <input
      id="mediaUpload"
      type="file"
      accept={mediaType === 'image' ? 'image/*' : 'video/*'}
      onChange={handleFileUpload}
      disabled={isUploading}
      className="hidden"
    />
  </div>

  {uploadError && (
    <p className="text-xs text-red-600">
      ❌ {uploadError}
    </p>
  )}

  {mediaUrl && (
    <p className="text-xs text-green-600">
      ✅ Mídia salva no storage
    </p>
  )}
</div>
```

---

### **3. JSONB Gerado Após Upload**

```json
{
  "passo_id": "PASSO I",
  "variacoes": [{
    "instrucoes": {
      "objetivo": "Enviar catálogo de produtos",
      "o_que_fazer": "enviar_midia",

      "mensagens_da_ia": [{
        "tipo": "explicacao",
        "conteudo": "Segue nosso catálogo de produtos!",
        "media_id": "https://xxxxx.supabase.co/storage/v1/object/public/flow-media/user123/1728394856.jpg"
      }],

      "dados_extras": {
        "modo_ia": "conversational",
        "tipo_midia": "image",
        "storage_path": "user123/1728394856.jpg",
        "tamanho_bytes": 2457600,
        "formato": "image/jpeg"
      }
    }
  }]
}
```

---

### **4. Como o Agente de IA Vai Usar**

```typescript
// 1. Agente recebe JSONB do passo
const mensagem = variacao.instrucoes.mensagens_da_ia[0];

// 2. Identifica que tem mídia
if (mensagem.media_id) {
  const mediaUrl = mensagem.media_id;
  const caption = mensagem.conteudo;

  // 3. Envia via WhatsApp
  await enviarMidiaWhatsApp({
    to: leadPhone,
    type: 'image',  // ou 'video'
    url: mediaUrl,
    caption: caption
  });
}
```

---

### **5. Fluxo Completo**

```
┌─────────────────────────┐
│ 1. USUÁRIO FAZ UPLOAD   │
│    (Seleciona arquivo)  │
└───────────┬─────────────┘
            │
            ↓
┌─────────────────────────────────────┐
│ 2. UPLOAD PARA SUPABASE STORAGE     │
│    Bucket: flow-media               │
│    Path: user123/1728394856.jpg     │
└───────────┬─────────────────────────┘
            │
            ↓
┌─────────────────────────────────────┐
│ 3. OBTER URL PÚBLICA                │
│    URL: https://xxxxx.supabase...   │
└───────────┬─────────────────────────┘
            │
            ↓
┌─────────────────────────────────────┐
│ 4. SALVAR NO JSONB                  │
│    media_id: URL do storage         │
└───────────┬─────────────────────────┘
            │
            ↓
┌─────────────────────────────────────┐
│ 5. AGENTE DE IA USA URL             │
│    Envia mídia via WhatsApp         │
└─────────────────────────────────────┘
```

---

## 🔒 SEGURANÇA

### **Validações Necessárias:**

1. **Tamanho máximo:**
```typescript
const MAX_IMAGE_SIZE = 10 * 1024 * 1024;  // 10MB
const MAX_VIDEO_SIZE = 50 * 1024 * 1024;  // 50MB

if (mediaType === 'image' && file.size > MAX_IMAGE_SIZE) {
  throw new Error('Imagem maior que 10MB');
}
if (mediaType === 'video' && file.size > MAX_VIDEO_SIZE) {
  throw new Error('Vídeo maior que 50MB');
}
```

2. **Tipos permitidos:**
```typescript
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];

if (mediaType === 'image' && !ALLOWED_IMAGE_TYPES.includes(file.type)) {
  throw new Error('Formato de imagem não permitido');
}
```

3. **Usuário autenticado:**
```typescript
if (!user) {
  throw new Error('Usuário não autenticado');
}
```

---

## 📊 BENEFÍCIOS

✅ **Mídia armazenada permanentemente** no Supabase Storage
✅ **URL pública acessível** para o agente de IA
✅ **Organização por usuário** (user_id/timestamp)
✅ **Controle de tamanho** e formato
✅ **Cache otimizado** (3600s)
✅ **Backup automático** pelo Supabase

---

## 🚀 PRÓXIMOS PASSOS

1. ✅ Criar bucket `flow-media` no Supabase
2. ✅ Implementar upload no `SendMediaEditor.tsx`
3. ✅ Validar tamanho e formato
4. ✅ Salvar URL no JSONB
5. ✅ Testar envio via agente de IA
6. ⚠️ Implementar exclusão de mídia antiga (limpeza)
7. ⚠️ Adicionar preview da mídia antes de salvar

---

**Documento criado:** 2025-10-08
**Status:** Pronto para implementação
