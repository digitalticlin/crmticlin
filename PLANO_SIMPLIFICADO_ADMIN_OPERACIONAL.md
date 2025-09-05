# 📋 PLANO SIMPLIFICADO - SISTEMA ADMIN + OPERACIONAL

## 🎯 **ESTRUTURA SIMPLIFICADA**

### **2 ROLES APENAS:**
- **ADMIN:** Acesso total, gerencia equipe, vê todos os leads
- **OPERACIONAL:** Acesso apenas aos leads/instâncias atribuídos

### **FLUXO:**
1. Admin convida operacional (sistema já existe)
2. Admin vincula FUNIL + INSTÂNCIA WHATSAPP ao operacional  
3. Operacional vê apenas leads dos recursos atribuídos
4. RLS filtra automaticamente no banco

---

## 🚀 **IMPLEMENTAÇÃO - 5 FASES SIMPLIFICADAS**

### **FASE 1: BACKEND - CORRIGIR OWNER_ID** 
**⏱️ Estimativa: 1-2 horas**

#### 1.1 Corrigir tipo owner_id (TEXT → UUID)
```sql
-- Backup da coluna atual
ALTER TABLE leads ADD COLUMN owner_id_backup text;
UPDATE leads SET owner_id_backup = owner_id WHERE owner_id IS NOT NULL;

-- Remover coluna TEXT
ALTER TABLE leads DROP COLUMN owner_id;

-- Criar coluna UUID
ALTER TABLE leads ADD COLUMN owner_id uuid REFERENCES auth.users(id);
CREATE INDEX idx_leads_owner_id ON leads(owner_id);
```

#### 1.2 Sincronizar leads sem owner_id
```sql
-- Função melhorada para sincronizar
CREATE OR REPLACE FUNCTION sync_lead_ownership()
RETURNS TABLE(
    total_updated INTEGER,
    funnel_updated INTEGER,
    whatsapp_updated INTEGER,
    fallback_updated INTEGER
) AS $$
DECLARE
    funnel_count INTEGER := 0;
    whatsapp_count INTEGER := 0;
    fallback_count INTEGER := 0;
    total_count INTEGER := 0;
BEGIN
    -- 1. Leads com funil atribuído a operacional
    UPDATE leads l
    SET owner_id = p.linked_auth_user_id
    FROM user_funnels uf
    JOIN profiles p ON uf.profile_id = p.id
    WHERE l.funnel_id = uf.funnel_id
    AND l.owner_id IS NULL
    AND p.linked_auth_user_id IS NOT NULL
    AND p.role = 'operational';
    
    GET DIAGNOSTICS funnel_count = ROW_COUNT;
    
    -- 2. Leads com WhatsApp atribuído a operacional  
    UPDATE leads l
    SET owner_id = p.linked_auth_user_id
    FROM user_whatsapp_numbers uwn
    JOIN profiles p ON uwn.profile_id = p.id
    WHERE l.whatsapp_instance_id = uwn.whatsapp_number_id
    AND l.owner_id IS NULL
    AND p.linked_auth_user_id IS NOT NULL
    AND p.role = 'operational';
    
    GET DIAGNOSTICS whatsapp_count = ROW_COUNT;
    
    -- 3. Leads sem atribuição → usar created_by_user_id (admin)
    UPDATE leads
    SET owner_id = created_by_user_id
    WHERE owner_id IS NULL;
    
    GET DIAGNOSTICS fallback_count = ROW_COUNT;
    
    total_count := funnel_count + whatsapp_count + fallback_count;
    
    RETURN QUERY SELECT total_count, funnel_count, whatsapp_count, fallback_count;
END;
$$ LANGUAGE plpgsql;

-- Executar sincronização
SELECT * FROM sync_lead_ownership();
```

---

### **FASE 2: RLS POLICIES SIMPLIFICADAS**
**⏱️ Estimativa: 1 hora**

#### 2.1 Limpar policies antigas problemáticas
```sql
-- Remover policies muito permissivas
DROP POLICY IF EXISTS "Service role bypass - leads select" ON leads;
DROP POLICY IF EXISTS "Service role bypass - leads insert" ON leads;  
DROP POLICY IF EXISTS "Service role bypass - leads update" ON leads;
DROP POLICY IF EXISTS "authenticated_users_leads_access" ON leads;
```

#### 2.2 Criar policies Admin/Operacional
```sql
-- ADMIN: Acesso total
CREATE POLICY "Admin sees all leads" ON leads
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
);

-- OPERACIONAL: Apenas seus leads (owner_id)
CREATE POLICY "Operational sees only assigned leads" ON leads
FOR ALL USING (
    owner_id = auth.uid()
);

-- SERVICE_ROLE e WEBHOOK: Manter acesso
CREATE POLICY "Service role full access" ON leads
FOR ALL USING (current_setting('role') = 'service_role');

CREATE POLICY "Webhook access for lead creation" ON leads
FOR INSERT WITH CHECK (created_by_user_id IS NOT NULL);
```

---

### **FASE 3: TRIGGERS AUTOMÁTICOS MELHORADOS**
**⏱️ Estimativa: 30 minutos**

#### 3.1 Trigger para novos leads
```sql
CREATE OR REPLACE FUNCTION set_lead_owner_on_insert()
RETURNS TRIGGER AS $$
DECLARE
    assigned_user_id uuid;
BEGIN
    -- 1. Buscar usuário atribuído ao funil
    IF NEW.funnel_id IS NOT NULL THEN
        SELECT p.linked_auth_user_id INTO assigned_user_id
        FROM user_funnels uf
        JOIN profiles p ON uf.profile_id = p.id
        WHERE uf.funnel_id = NEW.funnel_id
        AND p.linked_auth_user_id IS NOT NULL
        AND p.role = 'operational'
        ORDER BY uf.created_at DESC
        LIMIT 1;
    END IF;
    
    -- 2. Se não achou no funil, buscar no WhatsApp
    IF assigned_user_id IS NULL AND NEW.whatsapp_instance_id IS NOT NULL THEN
        SELECT p.linked_auth_user_id INTO assigned_user_id
        FROM user_whatsapp_numbers uwn
        JOIN profiles p ON uwn.profile_id = p.id
        WHERE uwn.whatsapp_number_id = NEW.whatsapp_instance_id
        AND p.linked_auth_user_id IS NOT NULL
        AND p.role = 'operational'
        ORDER BY uwn.created_at DESC
        LIMIT 1;
    END IF;
    
    -- 3. Se encontrou operacional, atribuir a ele
    IF assigned_user_id IS NOT NULL THEN
        NEW.owner_id := assigned_user_id;
    ELSE
        -- Senão, manter com o admin criador
        NEW.owner_id := NEW.created_by_user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_set_lead_owner_on_insert ON leads;
CREATE TRIGGER trigger_set_lead_owner_on_insert
    BEFORE INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION set_lead_owner_on_insert();
```

---

### **FASE 4: FRONTEND SIMPLIFICADO**
**⏱️ Estimativa: 2 horas**

#### 4.1 Atualizar useUserPermissions
```typescript
// src/hooks/useUserPermissions.ts
export type UserRole = "admin" | "operational";

export const useUserPermissions = () => {
  // ... código existente ...
  
  switch (role) {
    case "admin":
      newPermissions = {
        canViewAllData: true,
        canDeleteData: true,
        canManageTeam: true,
        canAccessSettings: true,
        canManageFunnels: true,
        canManageWhatsApp: true,
        canViewReports: true,
        role,
        allowedPages: ["dashboard", "sales-funnel", "chat", "clients", "settings", "team", "ai-agents"]
      };
      break;
    case "operational":
      newPermissions = {
        canViewAllData: false,
        canDeleteData: false,
        canManageTeam: false,
        canAccessSettings: false,
        canManageFunnels: false,
        canManageWhatsApp: false,
        canViewReports: false,
        role,
        allowedPages: ["dashboard", "sales-funnel", "chat", "clients"]
      };
      break;
    // Remover case "manager"
  }
};
```

#### 4.2 Atualizar useAccessControl
```typescript
// src/hooks/useAccessControl.ts
export const useAccessControl = (): AccessControl => {
  // ... código existente ...
  
  // Simplificar lógica - apenas admin ou operational
  const canAccessFunnel = (funnelId: string): boolean => {
    if (!permissions.role) return false;
    
    // Admin vê tudo
    if (permissions.role === 'admin') return true;
    
    // Operacional só vê funis atribuídos
    return userFunnels.includes(funnelId);
  };

  const canManageFunnel = (funnelId: string): boolean => {
    // Apenas admin pode gerenciar
    return permissions.role === 'admin';
  };
};
```

#### 4.3 Route Guards simplificados
```typescript
// src/components/auth/AdminGuard.tsx
export const AdminGuard: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const { permissions } = useUserPermissions();
  
  if (permissions.role !== 'admin') {
    return <div>Acesso negado. Apenas administradores.</div>;
  }
  
  return children;
};
```

---

### **FASE 5: CORRIGIR LINK CRIAR SENHA**
**⏱️ Estimativa: 30 minutos**

#### 5.1 Encontrar e corrigir componente AcceptInvite
```typescript
// src/components/invite/AcceptInvite.tsx
// Localizar botão/link de criar senha e corrigir URL
```

---

## 📊 **CRONOGRAMA SIMPLIFICADO**

| Fase | Descrição | Tempo | Status |
|------|-----------|-------|---------|
| 1 | Backend - Owner_id UUID | 1-2h | 🟡 Pronto |
| 2 | RLS Policies Admin/Op | 1h | 🟡 Pronto |
| 3 | Triggers Automáticos | 30min | 🟡 Pronto |
| 4 | Frontend 2 Roles | 2h | 🟡 Pronto |
| 5 | Link Criar Senha | 30min | 🟡 Pronto |

**TOTAL: 4-5 horas** ⚡

---

## 🧪 **TESTES FINAIS**

### **Fluxo Admin:**
1. Login como admin
2. Acessar TeamSettings
3. Convidar operacional
4. Vincular funil + WhatsApp
5. Verificar se leads novos vão para operacional

### **Fluxo Operacional:**  
1. Aceitar convite (link corrigido)
2. Login operacional
3. Dashboard só mostra leads próprios
4. Sales Funnel filtrado
5. WhatsApp apenas conversas atribuídas

---

## 🚀 **VAMOS IMPLEMENTAR?**

Estrutura muito mais simples:
- **2 roles apenas** (sem manager)
- **RLS direto** (admin vê tudo, operational filtrado)
- **Frontend simplificado** 
- **Sistema convite existente** (só corrigir link)

Qual fase você quer começar primeiro? 🎯