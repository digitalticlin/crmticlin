# 📧 Configuração de Email no Supabase para Convites de Equipe

## 🎯 Objetivo
Configurar o envio automático de emails de convite para novos membros da equipe via Supabase Auth.

## 🛠️ Passos para Configuração

### 1. Aplicar Migrations
```bash
# Aplicar as migrations que preparam o sistema de convites
supabase db push
# Esta migration apenas mostra instruções, não modifica templates
```

### 2. Configurar Email Templates no Supabase Dashboard

#### 📍 Localização:
`Supabase Dashboard > Authentication > Settings > Email Templates`

#### 📧 Template a Configurar:
**"Invite user"** - Este é o template que será usado para convites de equipe

#### 🔧 Configurações do Template:
```html
Subject: Convite para Equipe - {{ .SiteName }}

Body: 
[Use o editor visual do Supabase ou configure HTML customizado]

Redirect URL: https://app.ticlin.com.br/invite/{{ .Token }}
```

### 3. Configurar SMTP no Supabase Dashboard

#### 📍 Localização:
`Supabase Dashboard > Authentication > Settings > SMTP Settings`

#### ⚙️ Configurações Necessárias:

**Para Gmail (exemplo):**
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: seu-email@gmail.com  
SMTP Password: sua-senha-app (não a senha normal!)
Sender Email: seu-email@gmail.com
Sender Name: Sua Empresa
```

**Para SendGrid:**
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: SG.seu-api-key-aqui
Sender Email: noreply@suaempresa.com
Sender Name: Sua Empresa
```

**Para Mailgun:**
```
SMTP Host: smtp.mailgun.org
SMTP Port: 587
SMTP User: postmaster@mg.suaempresa.com
SMTP Password: sua-senha-mailgun
Sender Email: noreply@suaempresa.com
Sender Name: Sua Empresa
```

### 3. Configurações de Site URL

#### 📍 Localização:
`Supabase Dashboard > Authentication > Settings > Site URL`

```
Site URL: https://app.ticlin.com.br
Additional Redirect URLs: 
- https://app.ticlin.com.br/invite/*
- http://localhost:5173/invite/* (para desenvolvimento)
```

### 4. Testar Configuração

Execute no SQL Editor:
```sql
SELECT * FROM check_team_invite_setup();
```

Deve retornar:
```
profiles_table_ready: true
invite_columns_exist: true  
message: Team invite system configured...
```

## 🔧 Funcionalidades Implementadas

### ✅ Sistema de Convites Duplo:
1. **Método Principal:** `supabase.auth.admin.inviteUserByEmail()`
   - Email com template personalizado
   - Redirecionamento para página de convite customizada

2. **Método Fallback:** `supabase.auth.signInWithOtp()` 
   - Caso o primeiro falhe
   - Sistema OTP nativo do Supabase

### ✅ Template de Email Personalizado:
- Design responsivo e profissional
- Inclui informações do convite
- Botão claro para aceitar convite
- Link alternativo caso o botão não funcione

### ✅ Logs de Debug:
- Console mostra status de envio
- Identificação de falhas
- URL do convite para teste manual

## 🚨 Troubleshooting

### Problema: Emails não chegam
**Soluções:**
1. Verificar configuração SMTP no dashboard
2. Verificar spam/lixo eletrônico  
3. Testar com diferentes provedores de email
4. Verificar logs no console do navegador

### Problema: Link de convite não funciona
**Soluções:**
1. Verificar `Site URL` no Supabase
2. Verificar `Additional Redirect URLs`
3. Testar URL manualmente no console

### Problema: "User not allowed" 
**Solução:**
- Este sistema não usa mais `auth.admin.createUser`
- Usa perfis temporários + convite por email
- Erro resolvido na nova implementação

## 📋 Checklist de Configuração

- [ ] Migration aplicada (`20250901000002_configure_auth_email_templates.sql`)
- [ ] SMTP configurado no Supabase Dashboard
- [ ] Site URL configurada
- [ ] Redirect URLs configuradas
- [ ] Teste de configuração executado
- [ ] Email de teste enviado e recebido
- [ ] Fluxo completo de convite testado

## 🎉 Resultado Final

Com tudo configurado, ao adicionar um novo membro:
1. ✅ Perfil temporário criado instantaneamente
2. ✅ Email de convite enviado automaticamente
3. ✅ Usuário recebe email profissional com template customizado
4. ✅ Link leva para página de convite (/invite/token)
5. ✅ Usuário cria conta e é vinculado ao perfil
6. ✅ Sistema totalmente escalável para milhares de usuários

---

**💡 Dica:** Para desenvolvimento local, o sistema ainda funciona mesmo sem SMTP configurado. O link do convite aparece no console do navegador para teste manual.