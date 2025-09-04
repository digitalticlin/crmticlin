# 🎯 Implementação do Template de Convite NATIVO do Supabase

## ✅ **O que foi implementado:**

### 🚀 **Edge Function Nativa (`send_native_invite`)**
- Criada em `supabase/functions/send_native_invite/index.ts`
- Usa `supabase.auth.admin.inviteUserByEmail()` com service_role
- Aciona o template "Invite user" do dashboard do Supabase
- Sistema 100% nativo e seguro

### 🔧 **Hook Atualizado**
- `src/hooks/useTeamManagement.ts` modificado
- Tenta Edge Function nativa primeiro
- Fallback para Edge Function Resend se falhar
- Logs detalhados para debug

## 📋 **Próximos Passos para Ativação:**

### 1. **Deploy da Edge Function**
```bash
cd C:\Users\inaci\Desktop\Cursor\crmticlin
supabase functions deploy send_native_invite
```

### 2. **Configurar Variável de Ambiente**
No dashboard do Supabase:
```
Project > Settings > Environment variables > Add variable
Name: SUPABASE_SERVICE_ROLE_KEY
Value: [sua-service-role-key]
```

### 3. **Configurar Template "Invite user"**
Dashboard > Authentication > Email Templates > Invite user:

**Subject:**
```
Convite para Equipe - {{.SiteName}}
```

**Body HTML:**
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Convite para Equipe</title>
</head>
<body style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
    <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px; border-radius: 10px;">
        <h1 style="color: #4f46e5; text-align: center;">🎉 Bem-vindo à Equipe!</h1>
        
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 8px; color: white; text-align: center; margin: 20px 0;">
            <p style="margin: 0; font-size: 18px;">Você foi convidado para se juntar à nossa equipe!</p>
        </div>
        
        <div style="text-align: center; margin: 30px 0;">
            <a href="{{ .ConfirmationURL }}" style="display: inline-block; background-color: #4f46e5; color: white; text-decoration: none; padding: 15px 30px; border-radius: 8px; font-weight: bold;">
                ✨ ACEITAR CONVITE
            </a>
        </div>
        
        <div style="background-color: #f8f9fa; padding: 15px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 0; font-size: 14px; color: #666;">
                <strong>Link direto:</strong><br>
                <span style="font-family: monospace; font-size: 12px; word-break: break-all;">{{ .ConfirmationURL }}</span>
            </p>
        </div>
        
        <div style="text-align: center; color: #666; font-size: 14px; margin-top: 30px;">
            <p>Se você não reconhece este convite, pode ignorar este email.</p>
            <p><strong>Equipe TicLin CRM</strong> 🚀</p>
        </div>
    </div>
</body>
</html>
```

**Redirect URL:**
```
{{.SiteURL}}/invite/{{.Token}}
```

### 4. **Configurar Site URL**
Dashboard > Authentication > Settings:
```
Site URL: https://app.ticlin.com.br
Additional Redirect URLs:
- https://app.ticlin.com.br/invite/*
- http://localhost:5173/invite/*
```

## 🧪 **Como Testar:**

### 1. **Verificar Edge Function Deployada**
```bash
supabase functions list
# Deve aparecer 'send_native_invite'
```

### 2. **Testar Convite**
1. Ir para Settings > Equipe
2. Clicar "Adicionar Membro"
3. Preencher dados e enviar
4. Verificar logs no console:
   - ✅ "Convite enviado via template NATIVO"
   - ❌ Se falhar: "Fallback: usando Edge Function Resend"

### 3. **Verificar Email Recebido**
O email deve:
- Ter assunto "Convite para Equipe - [SiteName]"
- Usar template configurado no dashboard
- Link redirecionar para `/invite/{token}`
- **NÃO** ser "magic link" genérico

## 🔍 **Diferenças do Sistema Anterior:**

### ❌ **Antes (Magic Link):**
- Usava `signInWithOtp()` ou `signUp()`
- Email genérico "Sign in to [app]"
- Template de "confirmação de conta"

### ✅ **Agora (Convite Nativo):**
- Usa `admin.inviteUserByEmail()`
- Email personalizado "Convite para Equipe"
- Template específico de "convite de usuário"
- Variáveis customizadas disponíveis

## 🚨 **Troubleshooting:**

### Edge Function falha:
- Verificar se `SUPABASE_SERVICE_ROLE_KEY` está configurada
- Verificar logs da função no dashboard
- Sistema usa fallback Resend automaticamente

### Template não personalizado:
- Verificar configuração no dashboard
- Template "Invite user" deve estar configurado
- Site URL e Redirect URLs devem estar corretos

### Email não chega:
- Verificar configuração SMTP no dashboard
- Verificar spam/lixo eletrônico
- Logs mostram se email foi enviado com sucesso

---

**✨ Resultado: Sistema usa template NATIVO "Invite user" do Supabase em vez de magic link genérico!**