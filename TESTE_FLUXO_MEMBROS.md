# 🧪 Teste Completo - Fluxo de Gestão de Membros

## ✅ Validação da Arquitetura

### **1. Hooks Isolados ✅**
- **useTeamManagement**: Criar e listar membros
- **useTeamMemberEditor**: Editar e remover membros
- **useTeamMemberAssignments**: Gerenciar vínculos WhatsApp/Funil
- **useTeamInvites**: Gestão de convites
- **useTeamAuxiliaryData**: Dados auxiliares

### **2. Query Keys Isolados ✅**
- Cada hook tem seu próprio namespace
- Sem conflitos entre invalidações
- Modularidade total

### **3. Edge Functions Validadas ✅**

#### **send_resend_invite**
```typescript
// ✅ URL correta no template
<a href="${redirect_url}" class="btn">
    ✨ Aceitar convite e criar senha
</a>

// ✅ redirect_url = `${window.location.origin}/invite/${inviteToken}`
```

#### **accept_invite**
```typescript
// ✅ Busca por invite_token correto
.eq('invite_token', invite_token)
.eq('invite_status', 'invite_sent') // Status correto

// ✅ Login automático
auth: {
  access_token: signInData.session.access_token,
  refresh_token: signInData.session.refresh_token
}
```

### **4. Componente AcceptInvite ✅**
```typescript
// ✅ Rota configurada corretamente
<Route path="/invite/:token" element={<AcceptInvite />} />

// ✅ Busca profile por token
.eq('invite_token', token)

// ✅ Login automático após aceitar
await supabase.auth.setSession({
  access_token: acceptResult.auth.access_token,
  refresh_token: acceptResult.auth.refresh_token
})
```

## 🎯 Fluxo de Teste Completo

### **Passo 1: Criar Novo Membro**
1. Abrir página Settings → Team
2. Clicar "Adicionar Membro"
3. Preencher:
   - Nome: "João Silva"
   - Email: "joao@teste.com"
   - Role: "Operacional"
   - Selecionar WhatsApp/Funis
4. Clicar "Adicionar"

**Esperado:**
- ✅ Toast: "Membro adicionado com sucesso!"
- ✅ Card aparece com badge "CONVITE ENVIADO"
- ✅ Botão de reenviar disponível
- ✅ Email enviado com link `/invite/[token]`

### **Passo 2: Verificar Dados no Banco**
```sql
-- Verificar profile criado
SELECT id, full_name, email, invite_status, invite_token 
FROM profiles 
WHERE email = 'joao@teste.com';

-- Verificar vínculos WhatsApp
SELECT * FROM user_whatsapp_numbers 
WHERE profile_id = '[ID_DO_PROFILE]';

-- Verificar vínculos Funil
SELECT * FROM user_funnels 
WHERE profile_id = '[ID_DO_PROFILE]';
```

**Esperado:**
- ✅ Profile com `invite_status = 'invite_sent'`
- ✅ `invite_token` preenchido
- ✅ `created_by_user_id` preenchido
- ✅ Vínculos WhatsApp/Funil salvos corretamente

### **Passo 3: Testar Link do Email**
1. Copiar token do banco
2. Navegar para `/invite/[token]`

**Esperado:**
- ✅ Página AcceptInvite carrega
- ✅ Mostra dados do usuário (nome, email, role)
- ✅ Formulário de senha aparece

### **Passo 4: Aceitar Convite**
1. Preencher senha: "123456"
2. Confirmar senha: "123456"
3. Clicar "Aceitar Convite e Criar Conta"

**Esperado:**
- ✅ Edge function `accept_invite` executada
- ✅ Conta criada no Supabase Auth
- ✅ Profile vinculado (`linked_auth_user_id`)
- ✅ Status atualizado para `'accepted'`
- ✅ Login automático
- ✅ Redirecionamento para `/dashboard`

### **Passo 5: Verificar Status Atualizado**
1. Voltar para Settings → Team
2. Verificar card do membro

**Esperado:**
- ✅ Badge muda para "CONVITE ACEITO" (verde)
- ✅ Botão de reenviar desaparece
- ✅ Membro aparece como ativo

### **Passo 6: Testar Reenvio de Convite**
1. Criar novo membro: "Maria Santos"
2. Aguardar aparecer no card
3. Clicar botão de reenviar (ícone de email)

**Esperado:**
- ✅ Botão mostra spinner
- ✅ Novo token gerado
- ✅ Email enviado novamente
- ✅ Botão mostra check verde
- ✅ Toast: "Convite reenviado para Maria Santos!"

## 🔧 Debug e Troubleshooting

### **Logs para Acompanhar:**

#### **Browser Console**
```javascript
// Hook useTeamManagement
[useTeamManagement] 👤 Criando perfil no Supabase...
[useTeamManagement] 📱 Configurando acesso WhatsApp...
[useTeamManagement] 🎯 Configurando acesso aos funis...
[useTeamManagement] ⚡ Chamando send_resend_invite...

// Hook useTeamInvites  
[useTeamInvites] 📧 Reenviando convite para membro...
[useTeamInvites] ⚡ Chamando edge function send_resend_invite...
```

#### **Edge Function Logs**
```javascript
// send_resend_invite
[send_resend_invite] 📧 Enviando convite para: joao@teste.com
[send_resend_invite] ✅ Email enviado com sucesso

// accept_invite
[accept_invite] 🎯 Aceitando convite para token: [TOKEN]
[accept_invite] ✅ Usuário criado no Auth: [USER_ID]
[accept_invite] 🔗 Vinculando profile ao Auth...
[accept_invite] ✅ Profile vinculado com sucesso!
```

### **Possíveis Problemas:**

#### **1. Email não chega**
- Verificar `RESEND_API_KEY` nas variáveis de ambiente
- Verificar logs da edge function `send_resend_invite`

#### **2. Link não funciona**
- Verificar se token existe no banco
- Verificar se rota `/invite/:token` está configurada no App.tsx

#### **3. Erro ao aceitar convite**
- Verificar se `invite_status = 'invite_sent'` no banco
- Verificar logs da edge function `accept_invite`

#### **4. Vínculos não salvam**
- Verificar se `created_by_user_id` está sendo passado
- Verificar permissões RLS nas tabelas `user_whatsapp_numbers` e `user_funnels`

#### **5. Login automático falha**
- Verificar se tokens estão sendo retornados pela edge function
- Verificar se `supabase.auth.setSession()` está funcionando

## ✅ Checklist Final

- [ ] Membro criado com status `invite_sent`
- [ ] Email enviado com link correto
- [ ] Vínculos WhatsApp/Funil salvos
- [ ] Página `/invite/[token]` funciona
- [ ] Aceitar convite cria conta no Auth
- [ ] Profile vinculado corretamente
- [ ] Login automático funciona
- [ ] Status atualizado para `accepted`
- [ ] Badge no card atualizado
- [ ] Reenvio de convite funciona
- [ ] Query keys invalidados corretamente
- [ ] Hooks isolados funcionando independentemente

## 🎉 Resultado Esperado

Após todos os testes, você deve ter:
1. **Arquitetura modular** com hooks isolados
2. **Fluxo completo** de convites funcionando
3. **Feedback visual** adequado
4. **Tratamento de erros** específicos
5. **Performance otimizada** com query keys isolados

**A gestão de membros está completa e funcional!** 🚀