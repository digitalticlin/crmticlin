# 📋 PLANO DE IMPLEMENTAÇÃO - SISTEMA DE EQUIPES COM PERMISSÕES

## 📊 ANÁLISE DA ESTRUTURA ATUAL

### ✅ O que já temos implementado:

1. **Sistema de Autenticação Base:**
   - `AuthContext` com sessão Supabase
   - `useAuth` para gerenciamento de usuários
   - Login/logout funcionando

2. **Sistema de Perfis e Roles:**
   - Tabela `profiles` com roles: `admin`, `manager`, `operational`
   - `useUserRole` - detecta role do usuário logado
   - `useUserPermissions` - define permissões por role
   - `useAccessControl` - controla acessos a funis e WhatsApp

3. **Sistema de Convites (Parcialmente Implementado):**
   - Tabela `profiles` com colunas de convite
   - `send_team_invite` Edge Function
   - `AcceptInvite.tsx` componente
   - `accept_team_invite_safely` RPC function

4. **Sistema de Atribuições:**
   - Tabela `user_funnels` para vincular usuários a funis
   - Tabela `user_whatsapp_numbers` para vincular usuários a WhatsApp
   - Triggers automáticos para atualizar `owner_id` dos leads

5. **RLS Policies Básicas:**
   - Políticas para `user_funnels` e `user_whatsapp_numbers`
   - Algumas políticas para `profiles`

### ❌ O que precisa ser implementado/ajustado:

1. **Owner_id nos Leads:** Não está sendo usado consistentemente
2. **RLS Policies para Leads:** Faltam policies baseadas em `owner_id`
3. **Frontend Filtros:** Hooks não filtram por permissões de usuário
4. **Dashboard Contextual:** Dashboard não respeita roles
5. **Route Guards:** Proteção de rotas administrativas
6. **Sistema de Sincronização:** Leads existentes sem owner_id

---

## 🚀 PLANO DE IMPLEMENTAÇÃO (8 FASES)

### **FASE 1: BACKEND SCHEMA E SINCRONIZAÇÃO** 
**⏱️ Estimativa: 2-3 horas**

#### 1.1 Adicionar `owner_id` aos leads (se necessário)
```sql
-- Verificar se coluna existe, se não existir, adicionar
ALTER TABLE leads ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES auth.users(id);
CREATE INDEX IF NOT EXISTS idx_leads_owner_id ON leads(owner_id);
```

#### 1.2 Sincronizar leads existentes
```sql
-- Função para sincronizar leads sem owner_id
CREATE OR REPLACE FUNCTION sync_lead_ownership()
RETURNS void AS $$
BEGIN
    -- Para leads com funil atribuído
    UPDATE leads 
    SET owner_id = get_funnel_owner(funnel_id)
    WHERE owner_id IS NULL 
    AND funnel_id IS NOT NULL;
    
    -- Para leads com WhatsApp atribuído
    UPDATE leads 
    SET owner_id = get_whatsapp_owner(whatsapp_instance_id)
    WHERE owner_id IS NULL 
    AND whatsapp_instance_id IS NOT NULL;
    
    -- Para leads órfãos, usar created_by_user_id
    UPDATE leads 
    SET owner_id = created_by_user_id
    WHERE owner_id IS NULL;
END;
$$ LANGUAGE plpgsql;
```

#### 1.3 Executar sincronização
```sql
SELECT sync_lead_ownership();
```

---

### **FASE 2: TRIGGERS AUTOMÁTICOS**
**⏱️ Estimativa: 1-2 horas**

#### 2.1 Trigger para novos leads via funil
```sql
CREATE OR REPLACE FUNCTION set_lead_owner_on_insert()
RETURNS TRIGGER AS $$
BEGIN
    -- Definir owner_id baseado no funil ou WhatsApp
    IF NEW.funnel_id IS NOT NULL THEN
        NEW.owner_id := get_funnel_owner(NEW.funnel_id);
    ELSIF NEW.whatsapp_instance_id IS NOT NULL THEN
        NEW.owner_id := get_whatsapp_owner(NEW.whatsapp_instance_id);
    ELSE
        NEW.owner_id := NEW.created_by_user_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_lead_owner_on_insert
    BEFORE INSERT ON leads
    FOR EACH ROW
    EXECUTE FUNCTION set_lead_owner_on_insert();
```

#### 2.2 Trigger para atualização de atribuições
```sql
-- Os triggers de update_leads_owner_on_funnel_change() e 
-- update_leads_owner_on_whatsapp_change() já existem
```

---

### **FASE 3: RLS POLICIES PARA LEADS**
**⏱️ Estimativa: 2 horas**

#### 3.1 Habilitar RLS na tabela leads
```sql
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
```

#### 3.2 Criar policies baseadas em owner_id
```sql
-- Policy para admins e managers verem todos os leads
CREATE POLICY "Admins and managers see all leads" ON leads
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role IN ('admin', 'manager')
    )
);

-- Policy para operacionais verem apenas seus leads
CREATE POLICY "Operational users see only their leads" ON leads
FOR SELECT USING (
    owner_id = auth.uid()
);

-- Policy para inserção - apenas admins/managers ou em recursos atribuídos
CREATE POLICY "Insert leads with proper ownership" ON leads
FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role IN ('admin', 'manager')
    )
    OR
    owner_id = auth.uid()
);

-- Policy para atualização
CREATE POLICY "Update leads with proper ownership" ON leads
FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role IN ('admin', 'manager')
    )
    OR
    owner_id = auth.uid()
);

-- Policy para deleção - apenas admins
CREATE POLICY "Only admins can delete leads" ON leads
FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles p 
        WHERE p.linked_auth_user_id = auth.uid()
        AND p.role = 'admin'
    )
);
```

---

### **FASE 4: FRONTEND AUTH ENHANCEMENTS**
**⏱️ Estimativa: 2 horas**

#### 4.1 Atualizar useAuth Hook
```typescript
// src/hooks/useAuth.ts
interface AuthUser extends User {
  profile?: {
    role: 'admin' | 'manager' | 'operational';
    full_name: string;
  }
}

export const useAuth = () => {
  // Buscar profile junto com user
  // Adicionar isAdmin, isManager, isOperational
}
```

#### 4.2 Criar contexto de permissões
```typescript
// src/contexts/PermissionsContext.tsx
interface PermissionsContextType {
  isAdmin: boolean;
  isManager: boolean;
  isOperational: boolean;
  canViewAllData: boolean;
  canDeleteData: boolean;
  canManageTeam: boolean;
}
```

---

### **FASE 5: ROUTE GUARDS**
**⏱️ Estimativa: 1-2 horas**

#### 5.1 Componente RoleGuard
```typescript
// src/components/auth/RoleGuard.tsx
interface RoleGuardProps {
  allowedRoles: Array<'admin' | 'manager' | 'operational'>;
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({
  allowedRoles,
  children,
  fallback = <AccessDenied />
}) => {
  const { permissions } = useUserPermissions();
  
  if (!allowedRoles.includes(permissions.role)) {
    return fallback;
  }
  
  return children;
};
```

#### 5.2 AdminGuard específico
```typescript
// src/components/auth/AdminGuard.tsx
export const AdminGuard: React.FC<{children: React.ReactNode}> = ({ children }) => {
  return (
    <RoleGuard allowedRoles={['admin']}>
      {children}
    </RoleGuard>
  );
};
```

---

### **FASE 6: DASHBOARD CONTEXTUAL**
**⏱️ Estimativa: 3 horas**

#### 6.1 Atualizar Dashboard baseado em role
```typescript
// src/pages/Dashboard.tsx
const Dashboard = () => {
  const { permissions } = useUserPermissions();
  
  return (
    <div>
      {permissions.role === 'admin' && <AdminDashboard />}
      {permissions.role === 'manager' && <ManagerDashboard />}
      {permissions.role === 'operational' && <OperationalDashboard />}
    </div>
  );
};
```

#### 6.2 Componentes específicos por role
- `AdminDashboard` - métricas globais, gestão de equipe
- `ManagerDashboard` - métricas de todos os leads, sem gestão de equipe
- `OperationalDashboard` - apenas métricas dos próprios leads

---

### **FASE 7: LEADS PAGE COM FILTROS**
**⏱️ Estimativa: 3-4 horas**

#### 7.1 Atualizar useLeads hook
```typescript
// src/hooks/salesFunnel/useLeadsDatabase.ts
export function useLeadsDatabase(funnelId?: string) {
  const { user } = useAuth();
  const { permissions } = useUserPermissions();
  
  const { data: leads = [] } = useQuery({
    queryKey: ["kanban-leads", funnelId, permissions.role],
    queryFn: async () => {
      let query = supabase
        .from("leads")
        .select(`*`)
        .eq("funnel_id", funnelId);
      
      // Para operacionais, filtrar por owner_id
      if (permissions.role === 'operational') {
        query = query.eq("owner_id", user.id);
      }
      // Para admins/managers, mostrar todos
      
      return query.order("order_position");
    },
    enabled: !!funnelId && !!user?.id,
  });
}
```

#### 7.2 Atualizar componentes de leads
- Filtrar leads na `SalesFunnelContent`
- Atualizar `LeadCard` com informações de ownership
- Adicionar indicador visual para leads de outros usuários

---

### **FASE 8: WHATSAPP FILTROS**
**⏱️ Estimativa: 2-3 horas**

#### 8.1 Atualizar useWhatsAppContacts
```typescript
// src/hooks/whatsapp/useWhatsAppContacts.ts
const loadContacts = async () => {
  let query = supabase
    .from("leads")
    .select(`*`)
    .eq("whatsapp_instance_id", activeInstanceId);
  
  // Para operacionais, filtrar por owner_id
  if (permissions.role === 'operational') {
    query = query.eq("owner_id", user.id);
  }
  
  return query;
};
```

#### 8.2 Filtrar conversas WhatsApp
- Atualizar lista de contatos baseada em permissões
- Mostrar apenas conversas que o usuário operacional tem acesso

---

## 🔧 FLUXOS OPERACIONAIS

### **ADMIN LOGADO:**
1. Acessa TeamSettings existente
2. Convida operacional via `send_team_invite` 
3. Vincula a funil/WhatsApp via interface
4. Triggers atualizam `owner_id` automaticamente

### **OPERACIONAL LOGADO:**
1. Dashboard mostra apenas seus leads
2. Sales Funnel filtra por `owner_id` 
3. WhatsApp mostra apenas conversas vinculadas
4. Sem acesso a configurações administrativas

### **CONVITE FLOW (já existe):**
1. Admin usa `send_native_invite` Edge Function
2. Usuário recebe email e acessa `AcceptInvite.tsx`
3. `accept_team_invite_safely` RPC valida e ativa usuário
4. Sistema fica operacional

---

## ⚠️ PONTOS DE ATENÇÃO

### **Segurança:**
- RLS policies protegem dados no nível do banco
- Frontend valida permissões para UX
- Nunca confiar apenas no frontend

### **Performance:**
- Índices em `owner_id` para consultas rápidas
- Cache de permissões no frontend
- Paginação em listas grandes

### **Dados Existentes:**
- Sincronização de leads sem `owner_id`
- Backup antes de mudanças estruturais
- Testes em ambiente de desenvolvimento

### **Compatibilidade:**
- Manter APIs existentes funcionando
- Edge Functions intactas
- Sistema de convites preservado

---

## 📊 CRONOGRAMA ESTIMADO

| Fase | Descrição | Tempo Estimado | Dependências |
|------|-----------|----------------|--------------|
| 1 | Backend Schema | 2-3h | - |
| 2 | Triggers Automáticos | 1-2h | Fase 1 |
| 3 | RLS Policies | 2h | Fase 1 |
| 4 | Frontend Auth | 2h | - |
| 5 | Route Guards | 1-2h | Fase 4 |
| 6 | Dashboard Contextual | 3h | Fase 4, 5 |
| 7 | Leads Page Filtros | 3-4h | Fase 1, 3, 4 |
| 8 | WhatsApp Filtros | 2-3h | Fase 1, 3, 4 |

**TOTAL ESTIMADO: 16-21 horas**

---

## 🧪 PLANO DE TESTES

### **Testes por Fase:**
1. **Sincronização:** Verificar se todos os leads têm `owner_id`
2. **Triggers:** Criar novo lead e verificar `owner_id` automático
3. **RLS:** Testar acesso com diferentes usuários
4. **Frontend:** Verificar componentes por role
5. **Route Guards:** Tentar acessar páginas proibidas
6. **Dashboard:** Métricas corretas por usuário
7. **Leads:** Filtros funcionando corretamente
8. **WhatsApp:** Conversas filtradas por usuário

### **Testes de Integração:**
- Fluxo completo de convite
- Mudança de atribuição de funil
- Login/logout de diferentes roles
- Sincronização em tempo real

---

## 🚀 PRÓXIMOS PASSOS

1. **Executar análise:** Rodar `analyze_current_structure.sql`
2. **Validar estrutura:** Confirmar estado atual
3. **Implementar fases:** Seguir ordem sequencial
4. **Testar incrementalmente:** Cada fase isoladamente
5. **Deploy gradual:** Ambiente dev → staging → produção

**Pronto para implementação! 🚀**