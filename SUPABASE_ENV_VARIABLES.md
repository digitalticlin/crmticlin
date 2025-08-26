# Variáveis de Ambiente - Supabase Edge Functions

Para que as Edge Functions funcionem corretamente após as correções de segurança, é necessário adicionar as seguintes variáveis de ambiente no projeto Supabase:

## 🔧 Configuração no Supabase Dashboard

Acesse: Supabase Dashboard > Settings > Environment Variables (ou Edge Functions > Secrets)

### Variáveis Obrigatórias:

```bash
# VPS WhatsApp Server
VPS_BASE_URL=http://31.97.163.57:3001
VPS_API_TOKEN=seu_token_aqui_se_necessario

# Configurações Opcionais
VPS_TIMEOUT_MS=60000
```

## 🚨 Impacto da Alteração

**ANTES**: As Edge Functions tinham URLs hardcoded como fallback
**DEPOIS**: Agora exigem as variáveis de ambiente obrigatoriamente

### Edge Functions afetadas:
- `whatsapp_messaging_service` 
- `ai_messaging_service`
- `whatsapp_instance_manager` ⚠️ **TAMBÉM** tinha webhookUrl hardcoded
- `whatsapp_instance_delete`
- `whatsapp_qr_manager`
- `profile_pic_receiver` (já implementada corretamente)

## ⚡ Deploy Necessário

Após adicionar as variáveis no Supabase Dashboard, faça o deploy das Edge Functions:

```bash
supabase functions deploy whatsapp_messaging_service
supabase functions deploy ai_messaging_service
```

## ✅ Validação

Teste as Edge Functions para garantir que não há mais erro de `VPS_BASE_URL undefined`.