# 🔧 Configuração Supabase para app.ticlin.com.br

## 🎯 Configurações Específicas para Produção

### 📧 **Email Templates (Authentication > Settings > Email Templates)**

#### Template: "Invite user"
```
Subject: Convite para Equipe Ticlin

Redirect URL: https://app.ticlin.com.br/invite/{{ .Token }}

Body (sugestão):
Olá!

Você foi convidado para fazer parte da equipe Ticlin.

Para aceitar o convite e criar sua conta, clique no link abaixo:
{{ .ConfirmationURL }}

Se você não esperava este convite, pode ignorar este email.

Bem-vindo à equipe! 🚀
```

### 🌐 **Site URL (Authentication > Settings)**

```
Site URL: https://app.ticlin.com.br

Additional Redirect URLs:
https://app.ticlin.com.br/invite/*
http://localhost:5173/invite/*
```

### 📨 **SMTP Settings (Authentication > Settings > SMTP)**

**Configurar com seu provedor de email preferido:**

#### Gmail (exemplo):
```
SMTP Host: smtp.gmail.com
SMTP Port: 587
SMTP User: noreply@ticlin.com.br
SMTP Password: [senha de app]
Sender Email: noreply@ticlin.com.br
Sender Name: Equipe Ticlin
```

#### SendGrid (recomendado):
```
SMTP Host: smtp.sendgrid.net
SMTP Port: 587
SMTP User: apikey
SMTP Password: [sua-api-key]
Sender Email: noreply@ticlin.com.br
Sender Name: Equipe Ticlin
```

## ✅ **Checklist de Configuração**

- [ ] Template "Invite user" configurado
- [ ] Redirect URL: `https://app.ticlin.com.br/invite/{{ .Token }}`
- [ ] Site URL: `https://app.ticlin.com.br`
- [ ] Redirect URLs adicionadas
- [ ] SMTP configurado
- [ ] Email teste enviado
- [ ] Migration aplicada: `supabase db push`
- [ ] Função de teste executada: `SELECT * FROM check_team_invite_setup();`

## 🧪 **Como Testar**

1. **Aplicar migration:**
   ```bash
   supabase db push
   ```

2. **Configurar no Dashboard** (itens acima)

3. **Testar criação de membro:**
   - Ir para Settings > Team
   - Clicar "Adicionar Membro"
   - Preencher dados
   - Verificar logs no console
   - Email deve ser enviado automaticamente

4. **Testar link de convite:**
   - Copiar URL do console: `https://app.ticlin.com.br/invite/[token]`
   - Abrir em nova aba/navegador
   - Interface de aceite deve carregar
   - Processo de criação de conta deve funcionar

## 🔧 **URLs de Convite Geradas**

O sistema gerará URLs no formato:
```
https://app.ticlin.com.br/invite/12345678-1234-1234-1234-123456789abc
```

Estes links são seguros, únicos e temporários para cada convite.

## 🚨 **Troubleshooting**

### Email não chega:
1. Verificar pasta de spam
2. Confirmar SMTP configurado
3. Verificar logs no console
4. Testar com diferentes provedores de email

### Link de convite não funciona:
1. Verificar se Site URL está correto
2. Confirmar Redirect URLs configuradas
3. Testar URL manualmente

### "User not allowed":
1. ✅ Problema resolvido na nova implementação
2. Sistema agora usa perfis temporários
3. Não requer permissões de admin no frontend