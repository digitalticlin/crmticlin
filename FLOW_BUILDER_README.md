# 🎨 Flow Builder - Página de Teste

## 📍 Como Acessar

Navegue para: **http://localhost:5173/flow-builder-test**

> ⚠️ Requer autenticação como admin

---

## 🎯 O que foi criado

### ✅ Arquivos Criados

1. **`src/types/flowBuilder.ts`** - Tipos TypeScript completos
   - `FlowStepNode` - Estrutura de cada passo
   - `Decision` - Conexões entre passos
   - `ConversationFlow` - Configuração completa do fluxo
   - `FlowValidationError` - Erros de validação

2. **`src/utils/flowValidator.ts`** - Validador anti-loop
   - ✅ Detecta loops infinitos
   - ✅ Encontra nós sem saída (dead ends)
   - ✅ Identifica nós órfãos
   - ✅ Detecta mensagens duplicadas
   - ✅ Valida ponto de entrada
   - ✅ Valida conexões

3. **`src/components/flow-builder/CustomStepNode.tsx`** - Nó visual customizado
   - Ícones por tipo de ação
   - Cores diferenciadas
   - Badges de status
   - Botões de editar/deletar
   - Preview da mensagem

4. **`src/pages/FlowBuilderTest.tsx`** - Página principal de teste
   - Canvas com ReactFlow
   - Paleta de blocos
   - Editor de passos
   - Validador em tempo real
   - Export para JSON

---

## 🚀 Como Usar

### 1. **Adicionar Blocos**

Na sidebar esquerda, clique nos blocos para adicionar ao canvas:

- 💬 **Perguntar** - Fazer uma pergunta ao cliente
- 📄 **Pedir Documento** - Solicitar arquivo/documento
- ⏱️ **Esperar** - Aguardar resposta
- 📤 **Avisar** - Enviar mensagem sem esperar resposta
- 🔀 **Decisão** - Ramificar baseado em condições
- ✅ **Finalizar** - Encerrar conversa

### 2. **Editar Passo**

Clique em "Editar" no bloco para configurar:
- **Nome do Passo** - Identificação amigável
- **Mensagem** - O que a IA deve dizer
- **É o último passo?** - Marca como terminal

### 3. **Conectar Passos**

Arraste da bolinha verde (embaixo) até a bolinha azul (em cima) do próximo passo.

### 4. **Definir Entrada**

Na sidebar direita, selecione qual será o **primeiro passo** do fluxo.

### 5. **Validar Fluxo**

Clique em "Validar Fluxo" para verificar:
- ❌ Loops infinitos
- ❌ Passos sem saída
- ⚠️ Passos desconectados
- ⚠️ Mensagens duplicadas

### 6. **Exportar JSON**

Clique em "Exportar JSON" para baixar a configuração do fluxo.

---

## 📊 Estrutura do JSON Exportado

```json
{
  "flowId": "step_1234567890_abc",
  "flowName": "Fluxo de Teste",
  "version": "1.0",
  "entryPoint": "step_xxx",
  "steps": [
    {
      "id": "step_xxx",
      "type": "ask_question",
      "position": { "x": 250, "y": 50 },
      "data": {
        "label": "Cumprimento",
        "messages": [
          {
            "type": "text",
            "content": "Oi! Sou a Amanda, qual o seu nome?"
          }
        ],
        "stepType": "ask_question",
        "isTerminal": false,
        "decisions": []
      }
    }
  ],
  "edges": [
    {
      "id": "edge_xxx_yyy",
      "source": "step_xxx",
      "target": "step_yyy",
      "type": "smoothstep",
      "animated": true
    }
  ]
}
```

---

## 🎨 Interface Visual

### **Layout**

```
┌─────────────────────────────────────────────────────┐
│  🎨 Flow Builder - Teste                            │
├──────────┬──────────────────────────────┬───────────┤
│          │                              │           │
│  Paleta  │         Canvas               │ Controles │
│  (Left)  │      (ReactFlow)             │  (Right)  │
│          │                              │           │
│  💬 Perguntar                           │ Passo     │
│  📄 Pedir Doc    [Nodes aqui]           │ Inicial   │
│  ⏱️ Esperar                              │           │
│  📤 Avisar                               │ Total: 5  │
│  🔀 Decisão                              │ Conexões  │
│  ✅ Finalizar                            │           │
│                                          │ [Validar] │
│                                          │           │
│                                          │ [Export]  │
└──────────┴──────────────────────────────┴───────────┘
```

---

## 🔍 Validações Implementadas

### ✅ **1. Loop Infinito**
```
❌ ERRO: Loop detectado
Passo A → Passo B → Passo A
```
**Solução**: Adicione condição de saída ou limite de tentativas

### ✅ **2. Sem Saída**
```
❌ ERRO: Passo sem saída
Passo C não tem conexões e não é terminal
```
**Solução**: Adicione conexão ou marque como "último passo"

### ✅ **3. Nó Órfão**
```
⚠️ AVISO: Passo desconectado
Passo D não está conectado ao fluxo principal
```
**Solução**: Conecte ao fluxo ou remova

### ✅ **4. Mensagem Duplicada**
```
⚠️ AVISO: Mensagem repetida
Mesma mensagem nos Passos E e F
```
**Solução**: Reutilize o mesmo passo ou diferencie as mensagens

---

## 🧪 Próximos Passos (Após Aprovação)

Quando você aprovar esta página de teste, vamos:

1. ✅ **Integrar com o Modal Existente** (`AIAgentModal.tsx`)
   - Adicionar nova aba "Fluxo"
   - Manter abas: "Básico", "Prompt", "Fluxo"

2. ✅ **Salvar no Banco de Dados**
   - Adicionar coluna `flow` (JSONB) na tabela `ai_agent_prompts`
   - Salvar estrutura de nodes e edges

3. ✅ **Interpretar Fluxo na IA**
   - Processar JSON do fluxo
   - Gerar prompt dinâmico baseado nos passos
   - Implementar lógica de decisões

4. ✅ **Features Avançadas**
   - Templates por indústria (E-commerce, Advocacia, Suporte)
   - Editor de decisões (condições SE/ENTÃO)
   - Variáveis do fluxo (capturar nome, email, etc)
   - Pré-validações (verificar se já perguntou antes)

---

## 🐛 Reportar Problemas

Durante o teste, observe:
- ✅ Blocos são criados corretamente?
- ✅ Conexões funcionam?
- ✅ Editor salva as alterações?
- ✅ Validação detecta erros?
- ✅ Export gera JSON correto?
- ✅ Interface é intuitiva?

---

## 💡 Sugestões de Teste

### **Teste 1: Fluxo Linear Simples**
```
Cumprimento → Apresentação → Solicitar Extrato → Finalizar
```

### **Teste 2: Fluxo com Decisão**
```
Perguntar → Decisão:
  ├─ SE "sim" → Pedir Documento
  └─ SE "não" → Ensinar a Conseguir
```

### **Teste 3: Fluxo com Loop (deve dar erro)**
```
Passo A → Passo B → Passo A (loop infinito)
```

### **Teste 4: Nó Órfão (deve dar warning)**
```
Fluxo Principal: A → B → C
Nó Órfão: D (sem conexão)
```

---

## 📝 Linguagem Ultra Simples

A interface usa linguagem leiga:
- ❌ "targetStepId" ✅ "Para onde ir depois?"
- ❌ "preValidation" ✅ "Antes de fazer isso, verificar..."
- ❌ "isTerminal" ✅ "Este é o último passo?"

---

## 🎓 Comparação com o Prompt Original

| Conceito no RETORNO | Implementação no Flow Builder |
|---------------------|-------------------------------|
| PASSO A, B, C... | Blocos no canvas |
| "MENSAGEM PRINCIPAL" | Campo "O que a IA deve dizer?" |
| "DECISÕES" | Conexões entre blocos |
| "SE lead fornece nome → IR PARA PASSO B" | Edges do ReactFlow |
| "VALIDAÇÃO" | Botão "Validar Fluxo" |
| Anti-loop | Detector automático de loops |

---

Pronto para testar! 🚀
