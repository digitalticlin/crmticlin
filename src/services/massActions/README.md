# Mass Actions Service

Serviço modular e isolado para operações em massa na aplicação de CRM.

## 📁 Estrutura

```
src/services/massActions/
├── massActionsService.ts    # Serviço principal
└── README.md               # Documentação
```

## 🚀 Funcionalidades

### **Consultas (Queries)**
- `getFunnels()` - Buscar todos os funis disponíveis
- `getStagesByFunnel(funnelId)` - Buscar etapas de um funil específico
- `getTags()` - Buscar todas as tags disponíveis
- `getUsers()` - Buscar todos os usuários da equipe

### **Operações em Massa (Mutations)**
- `deleteLeads(leadIds)` - Excluir múltiplos leads
- `moveLeads(leadIds, stageId, funnelId)` - Mover leads para nova etapa/funil
- `addTagsToLeads(leadIds, tagIds)` - Adicionar tags aos leads
- `removeTagsFromLeads(leadIds, tagIds)` - Remover tags dos leads
- `assignUserToLeads(leadIds, userId)` - Atribuir responsável aos leads

## 💻 Uso

```typescript
import { MassActionsService } from '@/services/massActions/massActionsService';

// Buscar funis
const funnels = await MassActionsService.getFunnels();

// Mover leads
const result = await MassActionsService.moveLeads(['lead1', 'lead2'], 'stageId', 'funnelId');
if (result.success) {
  console.log(result.message);
}
```

## 🔒 Características

### **Modularidade**
- Totalmente independente de outros serviços
- Interface padronizada para todas as operações
- Facilmente testável e extensível

### **Tratamento de Erros**
- Todas as funções retornam resultado estruturado
- Logs detalhados para debug
- Mensagens de erro amigáveis

### **Segurança**
- Validação de parâmetros
- Operações transacionais quando necessário
- Sanitização automática de dados

### **Performance**
- Operações em batch otimizadas
- Minimal queries para o banco
- Cache-friendly quando aplicável

## 📊 Tipos de Retorno

```typescript
interface MassActionResult {
  success: boolean;
  message: string;
  affectedCount?: number;
}

interface FunnelOption {
  id: string;
  name: string;
}

interface StageOption {
  id: string;
  title: string;
  funnel_id: string;
}

interface TagOption {
  id: string;
  name: string;
  color: string;
}

interface UserOption {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
}
```

## 🛠️ Manutenção

Para adicionar novas operações em massa:

1. Criar método no `MassActionsService`
2. Seguir padrão de retorno `MassActionResult`
3. Implementar validações necessárias
4. Atualizar documentação

## 🔄 Componentes que Usam

- `MassMoveModal` - Modal para mover leads
- `MassTagModal` - Modal para gerenciar tags
- `MassDeleteModal` - Modal para exclusão
- `MassAssignUserModal` - Modal para atribuição

## 🎯 Benefícios

- **Código Limpo**: Separação clara de responsabilidades
- **Manutenção**: Bugs centralizados, fácil de corrigir
- **Performance**: Operações otimizadas para o banco
- **Consistência**: Interface padrão para todas as ações
- **Testabilidade**: Fácil de criar testes unitários