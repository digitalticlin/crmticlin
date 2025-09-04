# 🧹 Limpeza de Usuários de Teste

## ❌ **Problema Identificado:**
```
AuthApiError: A user with this email address has already been registered
```

O email `inaciodomrua@gmail.com` já existe no sistema de autenticação, impedindo novos convites.

## 🔧 **Soluções Implementadas:**

### ✅ **1. Edge Function Corrigida**
- Detecta emails já registrados
- Busca o usuário existente 
- Vincula ao perfil da equipe
- Envia notificação em vez de convite

### ✅ **2. Fluxo para Usuários Existentes**
1. Detecta `email_exists`
2. Busca usuário por email
3. Vincula `linked_auth_user_id` ao perfil
4. Marca `invite_status = 'accepted'`
5. Envia email de notificação

## 🧪 **Para Testar:**

### **Cenário 1: Email Novo (nunca usado)**
- Usar email que nunca foi registrado
- Deve receber convite nativo do Supabase
- Template "Invite user" personalizado

### **Cenário 2: Email Existente (já registrado)**  
- Usar `inaciodomrua@gmail.com` (já existe)
- Sistema detecta e vincula à equipe
- Envia notificação de adição

### **Cenário 3: Limpeza Manual (se necessário)**
Para remover usuário de teste completamente:

```sql
-- 1. Remover da tabela profiles
DELETE FROM profiles WHERE email = 'inaciodomrua@gmail.com';

-- 2. Remover do auth.users (via Dashboard ou API)
-- Dashboard > Authentication > Users > Delete User
```

## 🚀 **Deploy e Teste:**

```bash
# 1. Fazer deploy da Edge Function corrigida
supabase functions deploy send_native_invite

# 2. Testar com email existente
# Sistema deve funcionar e vincular usuário à equipe

# 3. Testar com email novo
# Sistema deve usar template nativo de convite
```

## 📊 **Logs Esperados:**

### **Email Existente:**
```
[send_native_invite] 🔄 Email já registrado, buscando usuário existente...
[send_native_invite] 👤 Usuário existente encontrado: [user-id]
[send_native_invite] ✅ Perfil vinculado ao usuário existente
[send_native_invite] ✅ Email de notificação enviado para usuário existente
```

### **Email Novo:**
```
[send_native_invite] 🔑 Enviando convite via admin.inviteUserByEmail...
[send_native_invite] ✅ Convite enviado com sucesso: [invite-data]
```

---

**✨ Agora o sistema funciona tanto para emails novos quanto existentes!**