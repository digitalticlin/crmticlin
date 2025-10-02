# 🤖 Nova Experiência de Criação de Agentes IA

## 📋 Visão Geral

Nova interface de criação de agentes de IA com **Wizard em 4 etapas**, proporcionando uma experiência guiada, intuitiva e completa.

## 🎯 Estrutura do Wizard

### **Etapa 1: Básico** (30 segundos)
- ✅ Nome do agente
- ✅ Objetivo principal (Vendas, Suporte ou Qualificação)
- ✅ Vincular ao Funil (opcional)
- ✅ Vincular ao WhatsApp (opcional)

**Componente:** `Step1Basic.tsx`

---

### **Etapa 2: Personalidade** (1 minuto)
- ✅ Estilo de Conversa (Formal, Equilibrado, Descontraído)
- ✅ Perfil e Comportamento do Agente
- ✅ Assinatura nas Mensagens (opcional)
- ✅ Proibições (o que o agente NÃO deve fazer)

**Componente:** `Step2Personality.tsx`

---

### **Etapa 3: Base de Conhecimento** (2-3 minutos)
- ✅ Informações sobre a Empresa (obrigatório)
- ✅ Perguntas & Respostas Frequentes (opcional, accordion)

**Componente:** `Step3Knowledge.tsx`

---

### **Etapa 4: Fluxo de Atendimento** (5-10 minutos)
- ✅ Flow Builder completo com ReactFlow
- ✅ 15+ tipos de blocos organizados por categoria
- ✅ Editores específicos para cada tipo de bloco
- ✅ Preview em tempo real

**Componente:** `Step4Flow.tsx`

---

## 📁 Arquitetura de Arquivos

```
src/
├── pages/
│   ├── AIAgents2.tsx                    # Lista de agentes (versão 2)
│   └── ai-agents-2/
│       ├── CreateAgent.tsx              # Wizard de criação
│       ├── EditAgent.tsx                # Wizard de edição
│       └── README.md                    # Esta documentação
│
└── components/
    └── ai-agents-2/
        ├── WizardSteps.tsx              # Componente de progresso visual
        ├── Step1Basic.tsx               # Etapa 1: Básico
        ├── Step2Personality.tsx         # Etapa 2: Personalidade
        ├── Step3Knowledge.tsx           # Etapa 3: Conhecimento
        └── Step4Flow.tsx                # Etapa 4: Fluxo (Flow Builder)
```

---

## 🚀 Rotas

### Principais
- `/ai-agents-2` - Lista de agentes (nova versão)
- `/ai-agents-2/create` - Criar novo agente (Wizard)
- `/ai-agents-2/edit/:id` - Editar agente existente (Wizard)

### Antiga (manter até aprovação)
- `/ai-agents` - Lista antiga (será substituída)

---

## 🎨 Design System

### Cores
- **Primária:** `#FFC107` (Ticlin Yellow)
- **Sucesso:** `#10B981` (Green)
- **Erro:** `#EF4444` (Red)
- **Info:** `#3B82F6` (Blue)

### Componentes
- **Glassmorphism:** `bg-white/40 backdrop-blur-md border border-white/30`
- **Cards:** `glass-card` (classe customizada)
- **Botões:** Material com shadow-lg

---

## 💾 Salvamento de Dados

### Tabelas Utilizadas
1. **`ai_agents`** - Dados básicos do agente
   - name, type, funnel_id, whatsapp_number_id

2. **`ai_agent_prompts`** - Configurações detalhadas
   - agent_function (perfil do agente)
   - communication_style
   - company_info
   - prohibitions (array JSONB)
   - client_objections (FAQ em JSONB)
   - flow (passos do fluxo)

---

## ✨ Diferenciais UX

1. ✅ **Wizard Visual** - Progresso claro e etapas numeradas
2. ✅ **Previews em Tempo Real** - Mostra como ficará a conversa
3. ✅ **Validação Progressiva** - Valida cada etapa antes de avançar
4. ✅ **Navegação Flexível** - Pode voltar e avançar livremente
5. ✅ **Flow Builder Integrado** - Editor visual completo na Etapa 4
6. ✅ **Responsivo** - Funciona em desktop, tablet e mobile

---

## 🔄 Migração

### Quando Aprovado:
1. Excluir página antiga `/ai-agents`
2. Renomear `/ai-agents-2` para `/ai-agents`
3. Atualizar links na sidebar
4. Remover componentes antigos não utilizados

---

## 🧪 Testing

### Fluxo de Teste
1. Acessar `/ai-agents-2`
2. Clicar em "Criar Novo Agente"
3. Preencher Etapa 1 (Básico)
4. Preencher Etapa 2 (Personalidade)
5. Preencher Etapa 3 (Conhecimento)
6. Criar Fluxo na Etapa 4
7. Salvar e verificar na lista

### Casos de Teste
- [ ] Criar agente completo
- [ ] Criar agente mínimo (apenas campos obrigatórios)
- [ ] Editar agente existente
- [ ] Cancelar criação (confirmar perda de dados)
- [ ] Validação de campos obrigatórios
- [ ] Flow Builder com múltiplos blocos
- [ ] Conexões entre blocos no flow

---

## 📝 TODO

- [x] Estrutura de arquivos
- [x] Wizard de 4 etapas
- [x] Integração com Flow Builder
- [x] Salvamento no banco
- [ ] Auto-save a cada etapa (futuro)
- [ ] Templates pré-configurados (futuro)
- [ ] Exportar/Importar agentes (futuro)

---

## 🐛 Problemas Conhecidos

- Flow Builder: Nodes precisam ter callbacks atualizados ao carregar
- Edição: Flow precisa ser reconstruído a partir dos dados salvos

---

## 📞 Suporte

Para dúvidas ou problemas:
1. Verificar console do navegador
2. Verificar logs do Supabase
3. Consultar documentação dos componentes

---

**Versão:** 2.0.0
**Data:** Outubro 2025
**Autor:** Claude + Inácio
