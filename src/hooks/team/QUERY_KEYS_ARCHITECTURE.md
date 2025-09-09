# Arquitetura de Query Keys - Team Management

## Princípios de Design

1. **Isolamento Total**: Cada hook tem seus próprios query keys
2. **Modularidade**: Mudanças em um hook não afetam outros
3. **Namespace Único**: Cada hook usa prefixos diferentes para evitar colisões
4. **Tipo Seguro**: Todos os keys são `as const` para type safety

## Query Keys por Hook

### useTeamManagement
```typescript
const TEAM_MANAGEMENT_KEYS = {
  list: (companyId) => ['teamMembers', companyId],
  all: ['teamMembers']
}
```
- **Responsabilidade**: Lista de membros e criação
- **Namespace**: `teamMembers`

### useTeamMemberEditor
```typescript
const TEAM_EDITOR_KEYS = {
  list: (companyId) => ['teamMembers', companyId],
  member: (memberId) => ['teamMember', memberId]
}
```
- **Responsabilidade**: Edição e remoção de membros
- **Namespace**: `teamMember` (singular para detalhes)

### useTeamMemberAssignments
```typescript
const TEAM_ASSIGNMENTS_KEYS = {
  list: (companyId) => ['teamMembers', companyId],
  assignments: (memberId) => ['memberAssignments', memberId],
  whatsappAssignments: (memberId) => ['memberWhatsappAssignments', memberId],
  funnelAssignments: (memberId) => ['memberFunnelAssignments', memberId]
}
```
- **Responsabilidade**: Vínculos WhatsApp/Funil
- **Namespace**: `memberAssignments`, `memberWhatsappAssignments`, `memberFunnelAssignments`

### useTeamInvites
```typescript
const TEAM_INVITES_KEYS = {
  list: (companyId) => ['teamMembers', companyId],
  invites: (companyId) => ['teamInvites', companyId],
  inviteStatus: (memberId) => ['inviteStatus', memberId]
}
```
- **Responsabilidade**: Gestão de convites
- **Namespace**: `teamInvites`, `inviteStatus`

### useTeamAuxiliaryData
```typescript
const TEAM_AUXILIARY_KEYS = {
  whatsapp: (companyId) => ['teamWhatsappInstances', companyId],
  funnels: (companyId) => ['teamFunnels', companyId],
  all: (companyId) => ['teamAuxiliaryData', companyId]
}
```
- **Responsabilidade**: Dados auxiliares (WhatsApp/Funis disponíveis)
- **Namespace**: `teamWhatsappInstances`, `teamFunnels`, `teamAuxiliaryData`

## Regras de Invalidação

### Quando criar membro:
- Invalida: `['teamMembers', companyId]`

### Quando editar perfil:
- Invalida: `['teamMembers', companyId]` e `['teamMember', memberId]`

### Quando atualizar vínculos:
- Invalida: `['teamMembers', companyId]` e `['memberAssignments', memberId]`

### Quando reenviar convite:
- Invalida: `['teamMembers', companyId]` e `['inviteStatus', memberId]`

### Quando remover membro:
- Invalida: `['teamMembers', companyId]` e `['teamMember', memberId]`

## Benefícios desta Arquitetura

1. **Sem Conflitos**: Cada hook gerencia seus próprios keys
2. **Fácil Manutenção**: Mudanças isoladas não quebram outros hooks
3. **Performance**: Invalidações precisas, sem over-fetching
4. **Debugging**: Fácil rastrear qual hook está invalidando qual query
5. **Escalabilidade**: Novos hooks podem ser adicionados sem afetar existentes

## Padrão de Nomenclatura

- **Listas**: Plural (`teamMembers`, `teamInvites`)
- **Detalhes**: Singular (`teamMember`, `inviteStatus`)
- **Relações**: Descrição + tipo (`memberAssignments`, `memberWhatsappAssignments`)
- **Auxiliares**: Prefixo `team` + recurso (`teamWhatsappInstances`, `teamFunnels`)

## Migração Futura

Se precisar centralizar no futuro, cada hook já tem seus keys isolados, facilitando a migração para um sistema centralizado sem quebrar a funcionalidade.