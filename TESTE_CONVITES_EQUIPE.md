# 🧪 Teste Completo - Sistema de Convites de Equipe

## ✅ Sistema Implementado e Pronto

### 🔧 Funcionalidades Ativadas:

1. **✅ Geração de Token Temporário**
   - Token único UUID gerado no frontend
   - Armazenado na tabela `profiles.invite_token`
   - Válido até ser aceito

2. **✅ Envio de Email Nativo do Supabase**
   - Usa `supabase.auth.admin.inviteUserByEmail()`
   - Fallback para `supabase.auth.signInWithOtp()` 
   - Template de email configurável no dashboard

3. **✅ Página de Aceite de Convite**
   - Rota: `/invite/{token}`
   - Validação de token
   - Criação de conta
   - Vinculação ao perfil temporário

## 📋 Passos para Testar

### 1. Configurar SMTP no Supabase Dashboard
```
Dashboard > Authentication > Settings > SMTP Settings

Exemplo Gmail:
- Host: smtp.gmail.com
- Port: 587
- User: seu-email@gmail.com
- Password: senha-de-app-do-gmail
- Sender: seu-email@gmail.com
```

### 2. Configurar Template de Email
```
Dashboard > Authentication > Settings > Email Templates > Invite user

Subject: Convite para Equipe - {{.SiteName}}
Redirect URL: {{.SiteURL}}/invite/{{.Token}}
```

### 3. Configurar URLs
```
Dashboard > Authentication > Settings > Site URL
- Site URL: https://app.ticlin.com.br (ou seu domínio)
- Additional Redirect URLs: 
  - https://app.ticlin.com.br/invite/*
  - http://localhost:5173/invite/* (para desenvolvimento)
```

### 4. Testar o Fluxo Completo

#### 4.1. Adicionar Novo Membro
1. Ir para Configurações > Equipe
2. Clicar em "Adicionar Membro"
3. Preencher dados:
   - Nome: "João Teste"
   - Email: "joao@teste.com"
   - Gerar senha automática
   - Escolher função (Operacional/Gestor)
   - Configurar acessos (se operacional)
4. Clicar "Adicionar Membro"

#### 4.2. Verificar Logs
Console deve mostrar:
```
[useTeamManagement] 🚀 Criando novo membro: João Teste
[useTeamManagement] 🔑 Token de convite gerado: {uuid}
[useTeamManagement] ✅ Perfil criado: {profile-id}
[useTeamManagement] 📧 Enviando convite via Supabase Auth nativo...
[useTeamManagement] ✅ Convite enviado via sistema nativo
[useTeamManagement] 🔗 Link do convite (para teste): http://localhost:5173/invite/{token}
```

#### 4.3. Email Recebido
Email deve conter:
- Assunto: "Convite para Equipe - Sua Empresa"
- Botão "Aceitar Convite"
- Link: `https://app.ticlin.com.br/invite/{token}`

#### 4.4. Aceitar Convite
1. Clicar no link do email
2. Página deve carregar com dados do convite
3. Definir nova senha
4. Clicar "Aceitar Convite e Criar Conta"
5. Redirecionamento para página de login

#### 4.5. Fazer Login
1. Usar email do convite
2. Usar nova senha definida
3. Login deve funcionar normalmente
4. Usuário deve ter acesso conforme função definida

## 🔍 Pontos de Verificação

### ✅ No Console do Navegador:
- Logs de criação do perfil
- Token gerado corretamente
- Email enviado com sucesso
- Link do convite disponível

### ✅ No Email:
- Email recebido na caixa de entrada
- Template personalizado
- Link funcionando

### ✅ Na Página de Convite:
- Token válido reconhecido
- Dados do usuário exibidos
- Formulário funcionando
- Redirecionamento após aceite

### ✅ No Dashboard Supabase:
- Perfil criado na tabela `profiles`
- `invite_status` = 'invite_sent'
- `invite_token` preenchido
- Usuário criado no `auth.users` após aceite
- `linked_auth_user_id` preenchido após aceite

## 🚨 Troubleshooting

### Email não chega:
1. Verificar configuração SMTP
2. Verificar spam/lixo eletrônico
3. Verificar logs do console - link manual disponível
4. Testar com provedores diferentes (Gmail, Outlook)

### Link de convite não funciona:
1. Verificar Site URL no dashboard
2. Verificar Additional Redirect URLs
3. Token pode ter expirado
4. Usar link manual do console

### Erro "User not allowed":
- Sistema novo não usa mais `auth.admin.createUser`
- Usa perfis temporários + convite
- Erro resolvido na implementação atual

### Falha no envio:
- Sistema tenta método nativo primeiro
- Se falhar, usa OTP como fallback
- Ambos logs aparecem no console

## 🎯 Resultado Final

✅ **Sistema 100% Nativo do Supabase**
✅ **Tokens únicos por convite**
✅ **Emails automáticos**
✅ **Template personalizável**
✅ **Página de aceite moderna**
✅ **Vinculação automática**
✅ **Fallback em caso de falha**
✅ **Logs completos para debug**

## 🚀 Comandos de Teste Rápido

```javascript
// No console do navegador após adicionar membro:
console.log('Link manual do último convite:', window.lastInviteLink);

// Verificar status do convite:
window.supabase.from('profiles').select('*').eq('email', 'joao@teste.com').single()

// Debug do sistema de auth:
window.debugAuth()
```

---

**🎉 Sistema pronto para produção!**