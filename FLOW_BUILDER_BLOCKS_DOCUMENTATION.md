# 📚 DOCUMENTAÇÃO COMPLETA - BLOCOS DO FLOW BUILDER

## 🎯 OBJETIVO DESTE DOCUMENTO

Este documento serve como **guia definitivo** para agentes de IA entenderem **todos os blocos existentes no Flow Builder** e suas estruturas JSONB completas.

O agente deve usar este documento para:
- ✅ Entender qual **PASSO** está executando
- ✅ Saber qual **PASSO** deve seguir após a execução
- ✅ Identificar qual **AÇÃO** executar em cada etapa
- ✅ Processar decisões e ramificações do fluxo
- ✅ Validar se uma etapa já foi concluída
- ✅ Gerenciar dados e contexto da conversa

---

## 📋 ÍNDICE DE BLOCOS POR CATEGORIA

### 🗣️ COMUNICAÇÃO (Envio de mensagens)
1. [INÍCIO (start)](#1-início-start)
2. [Fazer Pergunta (ask_question)](#2-fazer-pergunta-ask_question)
3. [Enviar Mensagem (send_message)](#3-enviar-mensagem-send_message)
4. [Solicitar Documento (request_document)](#4-solicitar-documento-request_document)
5. [Enviar Link (send_link)](#5-enviar-link-send_link)
6. [Enviar Mídia (send_media)](#6-enviar-mídia-send_media)

### 🧠 LÓGICA E DECISÃO (Controle de fluxo)
7. [Tomar Decisão (branch_decision)](#7-tomar-decisão-branch_decision)
8. [Verificar se Concluído (check_if_done)](#8-verificar-se-concluído-check_if_done)
9. [Repetir com Variação (retry_with_variation)](#9-repetir-com-variação-retry_with_variation)
10. [Validar Documento (validate_document)](#10-validar-documento-validate_document)

### 💾 GESTÃO DE DADOS (Atualizar CRM)
11. [Atualizar Lead (update_lead_data)](#11-atualizar-lead-update_lead_data)
12. [Mover no Funil (move_lead_in_funnel)](#12-mover-no-funil-move_lead_in_funnel)

### 🔔 NOTIFICAÇÃO (Avisar equipe)
13. [Avisar Humano (transfer_to_human)](#13-avisar-humano-transfer_to_human)

### 📚 CONHECIMENTO (Base de dados)
14. [Ensinar Informação (provide_instructions)](#14-ensinar-informação-provide_instructions)
15. [Buscar na Base (search_knowledge)](#15-buscar-na-base-search_knowledge)

### 🛒 LISTA DE PEDIDOS (Gestão de orders)
16. [Adicionar ao Pedido (add_to_list)](#16-adicionar-ao-pedido-add_to_list)
17. [Confirmar Pedido (confirm_list)](#17-confirmar-pedido-confirm_list)
18. [Remover do Pedido (remove_from_list)](#18-remover-do-pedido-remove_from_list)

### 🏁 CONTROLE (Finalizar)
19. [Finalizar Conversa (end_conversation)](#19-finalizar-conversa-end_conversation)

---

## 🔑 CONCEITOS FUNDAMENTAIS

### 📍 Sistema de PASSOS e VARIAÇÕES

O Flow Builder organiza o fluxo em **PASSOS** e **VARIAÇÕES**:

```
INÍCIO → PASSO A → PASSO B → PASSO C → FIM
           ├─ A1      ├─ B1      └─ C1
           └─ A2      └─ B2
```

- **PASSO** = Grupo de blocos na mesma **distância** do início (via BFS)
- **VARIAÇÃO** = Blocos individuais dentro do mesmo passo (ex: A1, A2, B1, B2)

**Exemplo prático:**
```
INÍCIO (distância 0)
  └─> Pergunta 1 (distância 1) = PASSO A1
      ├─> Se SIM → Enviar mensagem (distância 2) = PASSO B1
      └─> Se NÃO → Enviar outra mensagem (distância 2) = PASSO B2
```

### 🎯 Tipos de Ação (action.type)

Todo bloco tem um **action.type** que define seu comportamento:

| Tipo | Comportamento | Exemplos |
|------|--------------|----------|
| `send_and_wait` | Envia mensagem e **aguarda resposta** do usuário | ask_question, request_document, confirm_list |
| `send_only` | Apenas envia mensagem, **não aguarda** resposta | send_message, send_link, send_media |
| `decision` | Toma decisão baseada em condições | branch_decision, check_if_done |
| `update_data` | Atualiza dados no CRM ou executa tool | update_lead_data, move_lead_in_funnel, add_to_list |
| `end` | Finaliza a conversa | end_conversation |

### 🔗 Sistema de Decisões (decisions)

Blocos podem ter **decisões** que definem qual PASSO seguir:

```typescript
decisoes: [
  {
    numero: 1,
    se_cliente_falar: "sim, quero",
    entao_ir_para: "PASSO B1",
    prioridade: "alta"
  },
  {
    numero: 2,
    se_cliente_falar: "não, obrigado",
    entao_ir_para: "PASSO B2",
    prioridade: "média"
  }
]
```

### ✅ Sistema de Validação (validacao)

Todo bloco pode ter validação para **evitar repetir ações já feitas**:

```typescript
validacao: {
  verificar_antes_de_executar: true,
  verificar_no_contexto: "nome_do_cliente",
  se_ja_feito: {
    pular_para: "PASSO C",
    motivo: "Nome já coletado anteriormente"
  }
}
```

---

## 📦 ESTRUTURA JSONB COMPLETA DE CADA BLOCO

---

### 1. INÍCIO (start)

**Descrição:** Primeiro bloco do fluxo. Inicia a conversa com apresentação.

**Categoria:** 🗣️ Comunicação

**Action Type:** `send_and_wait`

**Estrutura Completa:**

```json
{
  "variacao_id": "INÍCIO",
  "variacao_nome": "Apresentação Inicial",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Dar boas-vindas e apresentar o objetivo do atendimento",
    "o_que_fazer": "enviar_mensagem_e_aguardar_resposta",

    "mensagens_da_ia": [
      {
        "tipo": "apresentacao",
        "conteudo": "Olá! Seja bem-vindo(a)! 👋\n\nSou o assistente virtual e estou aqui para te ajudar.",
        "aguardar_segundos": 1
      }
    ],

    "decisoes": [
      {
        "numero": 1,
        "se_cliente_falar": "qualquer resposta",
        "entao_ir_para": "PASSO A",
        "prioridade": "alta",
        "tipo": "resposta_usuario"
      }
    ],

    "regra_critica": "Sempre cumprimentar com educação e apresentar objetivo",
    "importante": "Criar primeiro contato positivo"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 100, "y": 100 },
    "id_original_node": "1",
    "tipo_tecnico": "start"
  }
}
```

**Quando usar:**
- ✅ Sempre como **primeiro bloco** do fluxo
- ✅ Para apresentar o agente e definir expectativas
- ✅ Para coletar primeira resposta do usuário

**Outputs:** 1 ou mais (conforme decisões configuradas)

---

### 2. Fazer Pergunta (ask_question)

**Descrição:** Faz uma pergunta e aguarda resposta do usuário.

**Categoria:** 🗣️ Comunicação

**Action Type:** `send_and_wait`

**Estrutura Completa:**

```json
{
  "variacao_id": "A1",
  "variacao_nome": "Coletar Nome",

  "validacao": {
    "verificar_antes_de_executar": true,
    "verificar_no_contexto": "nome_do_cliente",
    "se_ja_feito": {
      "pular_para": "PASSO B",
      "motivo": "Nome já coletado"
    }
  },

  "instrucoes": {
    "objetivo": "Coletar o nome completo do cliente",
    "o_que_fazer": "fazer_pergunta_e_aguardar_resposta",

    "mensagens_da_ia": [
      {
        "tipo": "pergunta",
        "conteudo": "Para começar, qual é o seu nome completo?",
        "aguardar_segundos": 0
      }
    ],

    "decisoes": [
      {
        "numero": 1,
        "se_cliente_falar": "fornece nome",
        "acao": "ARMAZENAR no contexto como 'nome_do_cliente'",
        "entao_ir_para": "PASSO B",
        "prioridade": "alta",
        "tipo": "resposta_usuario"
      }
    ],

    "regra_critica": "Nunca repetir pergunta se já foi respondida",
    "importante": "Aguardar resposta antes de prosseguir",

    "fallback": {
      "se_nao_entender": {
        "acao": "reformular",
        "tentativas_maximas": 2,
        "mensagem_alternativa": "Desculpe, não consegui entender. Poderia me dizer seu nome?",
        "se_falhar": {
          "acao": "transferir_humano",
          "mensagem": "Vou te transferir para um atendente."
        }
      }
    }
  },

  "controle": {
    "tentativas_maximas": 3,
    "campo_obrigatorio": true,
    "timeout_segundos": 300
  },

  "_metadata": {
    "posicao_canvas": { "x": 400, "y": 100 },
    "id_original_node": "2",
    "tipo_tecnico": "ask_question"
  }
}
```

**Quando usar:**
- ✅ Para **coletar informações** do usuário
- ✅ Quando precisa de **resposta obrigatória**
- ✅ Para validar dados antes de prosseguir

**Outputs:** 1 ou mais (conforme decisões)

---

### 3. Enviar Mensagem (send_message)

**Descrição:** Apenas envia uma mensagem informativa, sem aguardar resposta.

**Categoria:** 🗣️ Comunicação

**Action Type:** `send_only`

**Estrutura Completa:**

```json
{
  "variacao_id": "B1",
  "variacao_nome": "Explicar Processo",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Explicar como funciona o processo de atendimento",
    "o_que_fazer": "apenas_enviar_mensagem",

    "mensagens_da_ia": [
      {
        "tipo": "explicacao",
        "conteudo": "Perfeito! Agora vou te explicar como funciona nosso processo...",
        "aguardar_segundos": 0
      }
    ],

    "decisoes": [],

    "regra_critica": "Enviar mensagem clara e objetiva",
    "importante": "Manter contexto da conversa"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 700, "y": 100 },
    "id_original_node": "3",
    "tipo_tecnico": "send_message"
  }
}
```

**Quando usar:**
- ✅ Para **informar** o usuário
- ✅ Explicações que **não requerem resposta**
- ✅ Confirmações simples

**Outputs:** 1 (sempre segue para o próximo bloco)

---

### 4. Solicitar Documento (request_document)

**Descrição:** Solicita upload de documento (PDF, imagem, etc) e aguarda.

**Categoria:** 🗣️ Comunicação

**Action Type:** `send_and_wait`

**Estrutura Completa:**

```json
{
  "variacao_id": "C1",
  "variacao_nome": "Solicitar RG",

  "validacao": {
    "verificar_antes_de_executar": true,
    "verificar_no_contexto": "documento_rg_enviado",
    "se_ja_feito": {
      "pular_para": "PASSO D",
      "motivo": "RG já enviado"
    }
  },

  "instrucoes": {
    "objetivo": "Coletar documento de identificação (RG ou CNH)",
    "o_que_fazer": "solicitar_documento_e_aguardar",

    "mensagens_da_ia": [
      {
        "tipo": "solicitacao",
        "conteudo": "Preciso que você envie uma foto do seu RG ou CNH.\n\nPode ser frente e verso.",
        "aguardar_segundos": 0
      }
    ],

    "decisoes": [
      {
        "numero": 1,
        "se_cliente_falar": "envia documento (imagem/PDF)",
        "acao": "ARMAZENAR documento como 'documento_rg_enviado'",
        "entao_ir_para": "PASSO D",
        "prioridade": "alta",
        "tipo": "resposta_usuario"
      }
    ],

    "dados_extras": {
      "document_type": "RG ou CNH",
      "timeout": 600,
      "checkField": "documento_rg_enviado",
      "saveVariable": "documento_rg_enviado"
    },

    "regra_critica": "Especificar formato e tipo de documento solicitado",
    "importante": "Explicar por que documento é necessário"
  },

  "controle": {
    "tentativas_maximas": 3,
    "campo_obrigatorio": true,
    "timeout_segundos": 600
  },

  "_metadata": {
    "posicao_canvas": { "x": 1000, "y": 100 },
    "id_original_node": "4",
    "tipo_tecnico": "request_document"
  }
}
```

**Quando usar:**
- ✅ Para **coletar documentos** do usuário
- ✅ Quando precisa de **comprovação visual**
- ✅ Upload de imagens/PDFs

**Outputs:** 1 ou mais (conforme decisões)

---

### 5. Enviar Link (send_link)

**Descrição:** Envia um link clicável para o usuário.

**Categoria:** 🗣️ Comunicação

**Action Type:** `send_only`

**Estrutura Completa:**

```json
{
  "variacao_id": "D1",
  "variacao_nome": "Enviar Link de Pagamento",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Enviar link para pagamento via Pix",
    "o_que_fazer": "enviar_link",

    "mensagens_da_ia": [
      {
        "tipo": "link",
        "conteudo": "Aqui está o link para realizar o pagamento:",
        "aguardar_segundos": 0,
        "link_url": "https://pagamento.exemplo.com/pix/12345"
      }
    ],

    "decisoes": [],

    "regra_critica": "SEMPRE incluir https:// antes do link",
    "importante": "Link deve ser clicável no WhatsApp"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 1300, "y": 100 },
    "id_original_node": "5",
    "tipo_tecnico": "send_link"
  }
}
```

**Quando usar:**
- ✅ Para enviar **links de pagamento**
- ✅ URLs de formulários externos
- ✅ Links de documentos/catálogos

**Outputs:** 1

---

### 6. Enviar Mídia (send_media)

**Descrição:** Envia imagem, vídeo ou áudio para o usuário.

**Categoria:** 🗣️ Comunicação

**Action Type:** `send_only`

**Estrutura Completa:**

```json
{
  "variacao_id": "E1",
  "variacao_nome": "Enviar Catálogo",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Enviar catálogo de produtos em imagem",
    "o_que_fazer": "enviar_midia",

    "mensagens_da_ia": [
      {
        "tipo": "midia",
        "conteudo": "Aqui está nosso catálogo atualizado! 📋",
        "aguardar_segundos": 0,
        "media_id": "abc123xyz789"
      }
    ],

    "decisoes": [],

    "regra_critica": "Verificar se URL da mídia está acessível",
    "importante": "Mídia deve carregar corretamente no WhatsApp"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 1600, "y": 100 },
    "id_original_node": "6",
    "tipo_tecnico": "send_media"
  }
}
```

**Quando usar:**
- ✅ Para enviar **imagens de produtos**
- ✅ Vídeos explicativos
- ✅ Áudios de confirmação

**Outputs:** 1

---

### 7. Tomar Decisão (branch_decision)

**Descrição:** Avalia condições do contexto e decide qual caminho seguir.

**Categoria:** 🧠 Lógica e Decisão

**Action Type:** `decision`

**Estrutura Completa:**

```json
{
  "variacao_id": "F1",
  "variacao_nome": "Verificar Tipo de Cliente",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Decidir fluxo baseado no tipo de cliente (novo ou recorrente)",
    "o_que_fazer": "tomar_decisao_baseada_em_condicoes",

    "mensagens_da_ia": [],

    "decisoes": [
      {
        "numero": 1,
        "se_cliente_falar": "é cliente novo",
        "entao_ir_para": "PASSO G1",
        "prioridade": "alta",
        "tipo": "condicao"
      },
      {
        "numero": 2,
        "se_cliente_falar": "é cliente recorrente",
        "entao_ir_para": "PASSO G2",
        "prioridade": "alta",
        "tipo": "condicao"
      }
    ],

    "dados_extras": {
      "modo_ia": "decision_logic",
      "tipo_decisao": "baseada_em_contexto",
      "campos_analisados": ["historico_compras", "cadastro_existente"],
      "logica_fallback": {
        "se_nenhuma_condicao_atendida": "PASSO H",
        "motivo": "Não foi possível determinar tipo de cliente"
      }
    },

    "regra_critica": "Avaliar TODAS as condições na ordem de prioridade antes de decidir",
    "importante": "Decisão deve ser tomada com base em dados do contexto da conversa"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 1900, "y": 100 },
    "id_original_node": "7",
    "tipo_tecnico": "branch_decision"
  }
}
```

**Quando usar:**
- ✅ Para **ramificar fluxo** baseado em condições
- ✅ Avaliar dados do contexto (idade, localização, etc)
- ✅ Lógica condicional complexa

**Outputs:** Múltiplos (1 para cada decisão + 1 fallback)

---

### 8. Verificar se Concluído (check_if_done)

**Descrição:** Verifica se uma etapa anterior já foi concluída antes de repetir.

**Categoria:** 🧠 Lógica e Decisão

**Action Type:** `decision`

**Estrutura Completa:**

```json
{
  "variacao_id": "H1",
  "variacao_nome": "Verificar se Nome Foi Coletado",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Verificar se o nome do cliente já foi coletado anteriormente",
    "o_que_fazer": "verificar_se_etapa_foi_concluida",

    "mensagens_da_ia": [],

    "decisoes": [
      {
        "numero": 1,
        "se_cliente_falar": "nome já coletado (existe no contexto)",
        "entao_ir_para": "PASSO J",
        "prioridade": "alta",
        "tipo": "condicao"
      },
      {
        "numero": 2,
        "se_cliente_falar": "nome NÃO coletado (não existe no contexto)",
        "entao_ir_para": "PASSO I",
        "prioridade": "média",
        "tipo": "condicao"
      }
    ],

    "dados_extras": {
      "modo_ia": "validation_check",
      "campo_para_verificar": "nome_do_cliente",
      "bloco_referencia_id": "PASSO A1",
      "tipo_verificacao": "campo_contexto",
      "criterio_validacao": {
        "campo_existe": true,
        "campo_nao_vazio": true,
        "valor_especifico": null
      }
    },

    "regra_critica": "SEMPRE verificar no contexto antes de solicitar novamente",
    "importante": "Evitar repetir ações que o lead já realizou"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 2200, "y": 100 },
    "id_original_node": "8",
    "tipo_tecnico": "check_if_done"
  }
}
```

**Quando usar:**
- ✅ Para **evitar perguntas repetidas**
- ✅ Verificar se dados já foram coletados
- ✅ Validação antes de solicitar novamente

**Outputs:** 2 (JÁ FEITO / NÃO FEITO)

---

### 9. Repetir com Variação (retry_with_variation)

**Descrição:** Repete uma pergunta anterior, mas com palavras diferentes.

**Categoria:** 🧠 Lógica e Decisão

**Action Type:** `send_and_wait`

**Estrutura Completa:**

```json
{
  "variacao_id": "I1",
  "variacao_nome": "Reformular Pergunta de Nome",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Reformular pergunta sobre nome de forma mais clara",
    "o_que_fazer": "tentar_novamente_com_variacao",

    "mensagens_da_ia": [
      {
        "tipo": "pergunta",
        "conteudo": "Deixa eu reformular... Como você gostaria de ser chamado(a)?",
        "aguardar_segundos": 0
      }
    ],

    "decisoes": [
      {
        "numero": 1,
        "se_cliente_falar": "fornece nome",
        "acao": "ARMAZENAR no contexto como 'nome_do_cliente'",
        "entao_ir_para": "PASSO J",
        "prioridade": "alta",
        "tipo": "resposta_usuario"
      }
    ],

    "dados_extras": {
      "modo_ia": "retry_variation",
      "voltar_para_passo": "PASSO A1",
      "bloco_original_nome": "Coletar Nome",
      "numero_tentativa": 2,
      "maximo_tentativas": 3,
      "estrategia_variacao": "mudar_tom",
      "variacoes_disponiveis": [
        "Deixa eu reformular...",
        "De outro jeito...",
        "Explicando melhor..."
      ]
    },

    "regra_critica": "Variar abordagem sem repetir texto anterior exatamente",
    "importante": "Manter mesmo objetivo mas com palavras e tom diferentes"
  },

  "controle": {
    "tentativas_maximas": 3,
    "campo_obrigatorio": true,
    "timeout_segundos": 300
  },

  "_metadata": {
    "posicao_canvas": { "x": 2500, "y": 300 },
    "id_original_node": "9",
    "tipo_tecnico": "retry_with_variation"
  }
}
```

**Quando usar:**
- ✅ Quando usuário **não entendeu** a pergunta
- ✅ Para **reformular** de forma mais clara
- ✅ Após falhas em coletar informação

**Outputs:** 1 ou mais

---

### 10. Validar Documento (validate_document)

**Descrição:** Valida se documento enviado está legível e correto.

**Categoria:** 🧠 Lógica e Decisão

**Action Type:** `decision`

**Estrutura Completa:**

```json
{
  "variacao_id": "J1",
  "variacao_nome": "Validar RG Enviado",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Verificar se RG enviado está legível e completo",
    "o_que_fazer": "validar_documento_recebido",

    "mensagens_da_ia": [],

    "decisoes": [
      {
        "numero": 1,
        "se_cliente_falar": "documento válido e legível",
        "entao_ir_para": "PASSO K",
        "prioridade": "alta",
        "tipo": "condicao"
      },
      {
        "numero": 2,
        "se_cliente_falar": "documento ilegível ou incompleto",
        "entao_ir_para": "PASSO C1",
        "prioridade": "média",
        "tipo": "condicao",
        "observacao": "Voltar para solicitar novamente"
      }
    ],

    "dados_extras": {
      "documentVariable": "documento_rg_enviado",
      "validationCriteria": [
        "legibilidade",
        "frente_e_verso",
        "dados_visiveis"
      ]
    },

    "regra_critica": "Verificar legibilidade, formato e dados corretos",
    "importante": "Dar feedback claro sobre validação"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 2800, "y": 100 },
    "id_original_node": "10",
    "tipo_tecnico": "validate_document"
  }
}
```

**Quando usar:**
- ✅ Após receber **documento do usuário**
- ✅ Para garantir **qualidade da imagem/PDF**
- ✅ Validar dados antes de processar

**Outputs:** 2 (VÁLIDO / INVÁLIDO)

---

### 11. Atualizar Lead (update_lead_data)

**Descrição:** Atualiza campos do lead no CRM (nome, email, telefone, etc).

**Categoria:** 💾 Gestão de Dados

**Action Type:** `update_data`

**Estrutura Completa:**

```json
{
  "variacao_id": "K1",
  "variacao_nome": "Salvar Dados do Cliente",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Atualizar nome e email do lead no CRM",
    "o_que_fazer": "atualizar_dados_do_lead",

    "mensagens_da_ia": [],

    "decisoes": [],

    "dados_extras": {
      "modo_ia": "tool_execution",
      "tool_name": "update_lead_data",
      "field_updates": [
        {
          "fieldName": "name",
          "fieldValue": "{nome_do_cliente}"
        },
        {
          "fieldName": "email",
          "fieldValue": "{email_do_cliente}"
        }
      ]
    },

    "regra_critica": "Confirmar dados antes de atualizar",
    "importante": "Dados atualizados devem refletir no CRM"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 3100, "y": 100 },
    "id_original_node": "11",
    "tipo_tecnico": "update_lead_data"
  }
}
```

**Quando usar:**
- ✅ Para **salvar dados no CRM**
- ✅ Atualizar nome, email, telefone
- ✅ Campos customizados do lead

**Outputs:** 1

**Campos atualizáveis:**
- `name` - Nome do lead
- `email` - Email
- `phone` - Telefone
- `cpf` - CPF
- `city` - Cidade
- `state` - Estado
- Campos customizados definidos no CRM

---

### 12. Mover no Funil (move_lead_in_funnel)

**Descrição:** Move o lead para outra etapa do funil de vendas.

**Categoria:** 💾 Gestão de Dados

**Action Type:** `update_data`

**Estrutura Completa:**

```json
{
  "variacao_id": "L1",
  "variacao_nome": "Mover para Qualificado",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Mover lead para etapa 'Qualificado' do funil de vendas",
    "o_que_fazer": "mover_lead_no_funil",

    "mensagens_da_ia": [
      {
        "tipo": "confirmacao",
        "conteudo": "Perfeito! Seus dados foram salvos e você está qualificado.",
        "aguardar_segundos": 0
      }
    ],

    "decisoes": [],

    "dados_extras": {
      "modo_ia": "tool_execution",
      "tool_name": "move_lead_in_funnel",
      "field_updates": [
        {
          "fieldName": "funnel_id",
          "fieldValue": "abc-123-funil"
        },
        {
          "fieldName": "kanban_stage_id",
          "fieldValue": "xyz-456-etapa"
        }
      ],
      "funnel_name": "Funil de Vendas Principal",
      "stage_name": "Qualificado"
    },

    "regra_critica": "Verificar se funil e etapa existem",
    "importante": "Movimentação deve ser registrada no histórico"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 3400, "y": 100 },
    "id_original_node": "12",
    "tipo_tecnico": "move_lead_in_funnel"
  }
}
```

**Quando usar:**
- ✅ Para **mover lead entre etapas** do funil
- ✅ Atualizar status do cliente
- ✅ Organizar pipeline de vendas

**Outputs:** 1

---

### 13. Avisar Humano (transfer_to_human)

**Descrição:** Notifica a equipe via WhatsApp + opcionalmente move lead no funil.

**Categoria:** 🔔 Notificação

**Action Type:** `update_data`

**Estrutura Completa:**

```json
{
  "variacao_id": "M1",
  "variacao_nome": "Avisar Gerente de Vendas",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Notificar gerente de vendas via WhatsApp sobre lead qualificado",
    "o_que_fazer": "notificar_equipe_e_mover_lead",

    "mensagens_da_ia": [
      {
        "tipo": "despedida",
        "conteudo": "Obrigado! Um membro da nossa equipe entrará em contato em breve.",
        "aguardar_segundos": 0
      }
    ],

    "decisoes": [],

    "dados_extras": {
      "modo_ia": "tool_execution",
      "tool_name": "transfer_to_human",
      "transfer_to_human": {
        "notify_enabled": true,
        "phone": "5511999999999",
        "notification_message": "🔔 LEAD QUALIFICADO!\n\nNome: {nome_do_cliente}\nEmail: {email_do_cliente}\n\nPor favor, entre em contato."
      },
      "field_updates": [
        {
          "fieldName": "funnel_id",
          "fieldValue": "abc-123-funil"
        },
        {
          "fieldName": "kanban_stage_id",
          "fieldValue": "xyz-789-etapa-humano"
        }
      ],
      "funnel_name": "Funil de Vendas Principal",
      "stage_name": "Aguardando Contato Humano"
    },

    "regra_critica": "Avisar lead antes de transferir e notificar equipe",
    "importante": "Equipe deve ser notificada imediatamente no WhatsApp"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 3700, "y": 100 },
    "id_original_node": "13",
    "tipo_tecnico": "transfer_to_human"
  }
}
```

**Quando usar:**
- ✅ Para **notificar equipe humana**
- ✅ Transferir atendimento complexo
- ✅ Alertar sobre leads importantes

**Outputs:** 1

**Componentes:**
1. **Notificação (obrigatória):**
   - `phone` - Telefone do responsável
   - `notification_message` - Mensagem da notificação

2. **Movimentação (opcional):**
   - `funnel_id` - ID do funil
   - `kanban_stage_id` - ID da etapa

---

### 14. Ensinar Informação (provide_instructions)

**Descrição:** Armazena conhecimento para o agente usar em futuras conversas.

**Categoria:** 📚 Conhecimento

**Action Type:** `send_only`

**Estrutura Completa:**

```json
{
  "variacao_id": "N1",
  "variacao_nome": "Ensinar Sobre Política de Troca",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Ensinar ao agente as regras de troca e devolução",
    "o_que_fazer": "ensinar_informacao_ao_agente",

    "mensagens_da_ia": [],

    "decisoes": [],

    "dados_extras": {
      "modo_ia": "knowledge_storage",
      "tipo_conhecimento": "politicas",
      "topico": "Política de Troca e Devolução",
      "conteudo_para_aprender": "Nós aceitamos trocas em até 30 dias após a compra. O produto deve estar sem uso, com etiqueta e na embalagem original. Devolução do dinheiro em até 7 dias úteis.",
      "contexto_de_uso": "Usar quando cliente perguntar sobre troca, devolução ou garantia"
    },

    "regra_critica": "Garantir que informação seja compreensível e armazenável",
    "importante": "Informação deve ser armazenada para uso futuro em conversas"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 4000, "y": 100 },
    "id_original_node": "14",
    "tipo_tecnico": "provide_instructions"
  }
}
```

**Quando usar:**
- ✅ Para **treinar o agente** com informações
- ✅ Armazenar políticas da empresa
- ✅ Criar base de conhecimento dinâmica

**Outputs:** 1

**Tipos de conhecimento:**
- `geral` - Informações gerais
- `politicas` - Políticas da empresa
- `produtos` - Detalhes de produtos
- `processos` - Processos internos

---

### 15. Buscar na Base (search_knowledge)

**Descrição:** Busca produto/serviço na base de conhecimento e responde ao cliente.

**Categoria:** 📚 Conhecimento

**Action Type:** `send_and_wait`

**Estrutura Completa:**

```json
{
  "variacao_id": "O1",
  "variacao_nome": "Buscar Produto",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Cliente pergunta sobre um produto e o agente busca na base",
    "o_que_fazer": "buscar_na_base_de_conhecimento",

    "mensagens_da_ia": [],

    "decisoes": [
      {
        "numero": 1,
        "se_cliente_falar": "Produto/serviço encontrado",
        "acao": "Responder com informações do produto",
        "entao_ir_para": "PASSO P1",
        "prioridade": "alta",
        "tipo": "condicao"
      },
      {
        "numero": 2,
        "se_cliente_falar": "Produto/serviço não encontrado",
        "acao": "Informar que não temos esse produto",
        "entao_ir_para": "PASSO P2",
        "prioridade": "média",
        "tipo": "condicao"
      }
    ],

    "dados_extras": {
      "modo_ia": "tool_execution_then_send",
      "tool_name": "search_product",
      "instrucao_ia": "Quando cliente mencionar nome de produto/serviço, buscar na base de conhecimento e responder de forma natural com as informações encontradas (nome, descrição, preço se tiver). Adaptar resposta conforme o que foi encontrado.",
      "mensagem_busca": "Temos sim! Aqui estão as informações: [nome, descrição e preço do produto encontrado]",
      "mensagem_nao_encontrado": "No momento não temos esse produto/serviço disponível. Posso te ajudar com algo mais?"
    },

    "regra_critica": "Buscar na base apenas quando cliente perguntar especificamente sobre um produto/serviço. Responder de forma natural e conversacional com as informações encontradas",
    "importante": "A base pode ter produtos COM preço (ex: 'Notebook Dell - R$ 2.500') ou SEM preço (ex: 'Consultoria personalizada - consulte valores'). Adaptar resposta conforme disponível. NUNCA inventar informações que não existem na base"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 4300, "y": 100 },
    "id_original_node": "15",
    "tipo_tecnico": "search_knowledge"
  }
}
```

**Quando usar:**
- ✅ Cliente **pergunta sobre produto**
- ✅ Consultar catálogo/base de produtos
- ✅ Responder com informações da base

**Outputs:** 2 (ENCONTRADO / NÃO ENCONTRADO)

**Tool disponível:**
- `search_product(query: string)` - Busca produto na base

---

### 16. Adicionar ao Pedido (add_to_list)

**Descrição:** Adiciona item ao pedido do cliente (lista de produtos).

**Categoria:** 🛒 Lista de Pedidos

**Action Type:** `update_data`

**Estrutura Completa:**

```json
{
  "variacao_id": "P1",
  "variacao_nome": "Adicionar Produto ao Carrinho",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Adicionar produto que cliente solicitou à lista de pedidos",
    "o_que_fazer": "adicionar_item_ao_pedido",

    "mensagens_da_ia": [],

    "decisoes": [],

    "dados_extras": {
      "modo_ia": "tool_execution",
      "tool_name": "add_list",
      "instrucao_ia": "Extrair nome do produto, quantidade e preço da última mensagem do cliente e adicionar à lista de pedidos. Confirmar item adicionado com resumo: 'Adicionei: [QTD]x [PRODUTO] - R$ [PREÇO]'",
      "mensagem_confirmacao": "Ok! Vou adicionar ao seu pedido.",
      "orientacao_descricao": "Anotar observações do cliente conforme a conversa (ex: como quer o corte, tipo de embalagem, preferências)"
    },

    "regra_critica": "USAR tool add_to_list quando cliente SOLICITAR adicionar produto. Extrair nome, descrição conforme orientações e preço (se informado). SEMPRE confirmar item adicionado",
    "importante": "Cada item = 1 registro na tabela. Preencher descrição seguindo orientações configuradas. Se cliente não informar preço, deixar em branco. Capturar observações naturalmente da conversa"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 4600, "y": 100 },
    "id_original_node": "16",
    "tipo_tecnico": "add_to_list"
  }
}
```

**Quando usar:**
- ✅ Cliente **solicita adicionar produto**
- ✅ Montar carrinho de compras
- ✅ Lista de itens do pedido

**Outputs:** 1

**Tool disponível:**
- `add_to_list(item_name, quantity, price, description)` - Adiciona item

**Campos:**
- `item_name` - Nome do produto
- `quantity` - Quantidade
- `price` - Preço (opcional)
- `description` - Observações do cliente

---

### 17. Confirmar Pedido (confirm_list)

**Descrição:** Mostra lista completa de itens e solicita confirmação do cliente.

**Categoria:** 🛒 Lista de Pedidos

**Action Type:** `send_and_wait`

**Estrutura Completa:**

```json
{
  "variacao_id": "Q1",
  "variacao_nome": "Confirmar Itens do Pedido",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Exibir lista completa de itens e pedir confirmação do cliente",
    "o_que_fazer": "confirmar_pedido_completo",

    "mensagens_da_ia": [],

    "decisoes": [
      {
        "numero": 1,
        "se_cliente_falar": "confirma pedido",
        "entao_ir_para": "PASSO R",
        "prioridade": "alta",
        "tipo": "resposta_usuario"
      },
      {
        "numero": 2,
        "se_cliente_falar": "quer alterar/remover item",
        "acao": "USAR tool remove_from_list e voltar para confirmar",
        "entao_ir_para": "PASSO Q1",
        "prioridade": "média",
        "tipo": "resposta_usuario",
        "observacao": "Loop de edição"
      }
    ],

    "dados_extras": {
      "modo_ia": "tool_execution_then_send",
      "tool_name": "get_list",
      "instrucao_ia": "USAR tool get_list para mostrar lista. Se cliente pedir REMOVER item, usar tool remove_from_list e EXECUTAR get_list NOVAMENTE. Se cliente pedir ALTERAR item, usar remove_from_list (item antigo) + add_to_list (item novo) + get_list. NUNCA confirmar sem autorização explícita",
      "mensagem_principal": "Aqui está o resumo do seu pedido:\n\n[LISTA DE ITENS]\n\nEstá tudo certo ou quer alterar algo?",
      "formato_exibicao": "numerada_com_precos",
      "exibir_total": true,
      "permitir_edicao": true
    },

    "regra_critica": "NUNCA confirmar sem autorização explícita",
    "importante": "Sempre reexecutar get_list após qualquer edição (remoção ou alteração) para cliente confirmar mudanças. Perguntar 'Agora está correto?' após cada alteração"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": true,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 4900, "y": 100 },
    "id_original_node": "17",
    "tipo_tecnico": "confirm_list"
  }
}
```

**Quando usar:**
- ✅ Após adicionar **todos os itens**
- ✅ Solicitar **confirmação final** do pedido
- ✅ Permitir edições antes de finalizar

**Outputs:** 2 (CONFIRMADO / EDITAR)

**Tools disponíveis:**
- `get_list()` - Retorna lista completa de itens
- `remove_from_list(item_id)` - Remove item específico
- `add_to_list()` - Adiciona novo item

---

### 18. Remover do Pedido (remove_from_list)

**Descrição:** Remove item específico ou limpa lista completa.

**Categoria:** 🛒 Lista de Pedidos

**Action Type:** `update_data`

**Estrutura Completa:**

```json
{
  "variacao_id": "R1",
  "variacao_nome": "Limpar Lista de Pedidos",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Limpar toda a lista de pedidos após finalizar",
    "o_que_fazer": "remover_item_do_pedido",

    "mensagens_da_ia": [],

    "decisoes": [],

    "dados_extras": {
      "modo_ia": "tool_execution",
      "tool_name": "remove_from_list",
      "instrucao_ia": "LIMPAR toda a lista de pedidos (após pedido confirmado)",
      "mensagem_principal": "",
      "mensagem_confirmacao": "Lista limpa!",
      "identificar_por": "item_id",
      "modo_limpeza": "deletar_tudo"
    },

    "regra_critica": "Tool usada em 2 cenários: (1) Cliente pede remover item específico durante GET_LIST - remover e voltar para confirmar. (2) FINAL do fluxo - limpar ou deletar TODA a lista conforme configurado",
    "importante": "Modo individual: remover 1 item e voltar para get_list. Modo total: limpar ou deletar toda lista (final do fluxo). Confirmar qual modo usar conforme configuração do bloco"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 5200, "y": 100 },
    "id_original_node": "18",
    "tipo_tecnico": "remove_from_list"
  }
}
```

**Quando usar:**
- ✅ Cliente quer **remover item** específico
- ✅ **Limpar carrinho** após finalizar pedido
- ✅ Cancelar pedido completo

**Outputs:** 1

**Tool disponível:**
- `remove_from_list(item_id?)` - Remove item ou limpa tudo

**Modos de operação:**
1. **Individual:** Remove 1 item e volta para `confirm_list`
2. **Total:** Limpa/deleta toda a lista (fim do fluxo)

---

### 19. Finalizar Conversa (end_conversation)

**Descrição:** Encerra a conversa com despedida educada.

**Categoria:** 🏁 Controle

**Action Type:** `end`

**Estrutura Completa:**

```json
{
  "variacao_id": "S1",
  "variacao_nome": "Despedida Final",

  "validacao": {
    "verificar_antes_de_executar": false,
    "verificar_no_contexto": "",
    "se_ja_feito": null
  },

  "instrucoes": {
    "objetivo": "Finalizar conversa com despedida educada",
    "o_que_fazer": "finalizar_conversa",

    "mensagens_da_ia": [
      {
        "tipo": "despedida",
        "conteudo": "Foi um prazer te atender! Se precisar de algo, é só chamar. Até logo! 👋",
        "aguardar_segundos": 0
      }
    ],

    "decisoes": [],

    "dados_extras": {
      "reason": "Atendimento concluído com sucesso",
      "farewellMessage": "Foi um prazer te atender! Se precisar de algo, é só chamar. Até logo! 👋"
    },

    "regra_critica": "Sempre despedir educadamente",
    "importante": "Deixar canal aberto para futuro contato"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false,
    "timeout_segundos": null
  },

  "_metadata": {
    "posicao_canvas": { "x": 5500, "y": 100 },
    "id_original_node": "19",
    "tipo_tecnico": "end_conversation"
  }
}
```

**Quando usar:**
- ✅ **Finalizar fluxo** completo
- ✅ Despedida após concluir objetivo
- ✅ Encerrar atendimento com sucesso

**Outputs:** 0 (não tem saída)

---

## 🔄 FLUXO DE NAVEGAÇÃO - Como o Agente Segue os Passos

### 1️⃣ Início da Execução

```typescript
// O agente recebe o JSONB completo do fluxo
const fluxo = {
  passos: [...],
  conexoes: [...],
  informacoes_fluxo: {...}
}

// Identificar PASSO atual
const passoAtual = "INÍCIO"; // ou "PASSO A", "PASSO B", etc
```

### 2️⃣ Executar o Bloco Atual

```typescript
// Encontrar o bloco no JSONB
const bloco = fluxo.passos.find(p => p.passo_id === passoAtual);
const variacao = bloco.variacoes[0]; // Normalmente 1 variação por passo

// Verificar VALIDAÇÃO
if (variacao.validacao.verificar_antes_de_executar) {
  const campo = variacao.validacao.verificar_no_contexto;
  if (contexto[campo]) {
    // Campo já existe! Pular para próximo passo
    return variacao.validacao.se_ja_feito.pular_para; // "PASSO B"
  }
}

// Executar AÇÃO baseada no tipo
switch (variacao.instrucoes.o_que_fazer) {
  case "enviar_mensagem_e_aguardar_resposta":
    // Enviar mensagem
    await enviarMensagem(variacao.instrucoes.mensagens_da_ia[0].conteudo);
    // Aguardar resposta do usuário
    const resposta = await aguardarResposta();
    // Processar DECISÕES
    break;

  case "apenas_enviar_mensagem":
    // Enviar e seguir direto para próximo
    await enviarMensagem(variacao.instrucoes.mensagens_da_ia[0].conteudo);
    break;

  case "atualizar_dados_do_lead":
    // Executar tool
    await updateLeadData(variacao.instrucoes.dados_extras.field_updates);
    break;
}
```

### 3️⃣ Processar Decisões (se houver)

```typescript
// Se bloco tem decisões
if (variacao.instrucoes.decisoes.length > 0) {
  // Avaliar cada decisão na ordem de prioridade
  for (const decisao of variacao.instrucoes.decisoes) {
    if (avaliarCondicao(decisao.se_cliente_falar, respostaUsuario)) {
      // Condição atendida! Seguir para próximo passo
      proximoPasso = decisao.entao_ir_para; // "PASSO B1"
      break;
    }
  }
}
```

### 4️⃣ Navegar para Próximo Passo

```typescript
// Usar conexões para encontrar próximo bloco
const conexao = fluxo.conexoes.find(c =>
  c.origem === variacao._metadata.id_original_node
);

const proximoBloco = encontrarBloco(conexao.destino);
executarBloco(proximoBloco);
```

---

## 🛠️ TOOLS DISPONÍVEIS PARA O AGENTE

O agente tem acesso a ferramentas (tools) para executar ações específicas:

### 📊 CRM Tools

```typescript
// Atualizar dados do lead
update_lead_data({
  field_updates: [
    { fieldName: "name", fieldValue: "João Silva" },
    { fieldName: "email", fieldValue: "joao@email.com" }
  ]
})

// Mover lead no funil
move_lead_in_funnel({
  funnel_id: "abc-123",
  kanban_stage_id: "xyz-456"
})

// Notificar humano
transfer_to_human({
  phone: "5511999999999",
  notification_message: "Lead qualificado!"
})
```

### 🛒 Lista Tools

```typescript
// Adicionar item ao pedido
add_to_list({
  item_name: "Pizza Margherita",
  quantity: 2,
  price: 45.00,
  description: "Borda recheada com catupiry"
})

// Buscar lista completa
get_list()
// Retorna: [{ id: 1, name: "Pizza...", qty: 2, price: 45 }]

// Remover item
remove_from_list(item_id: 1)

// Limpar lista completa
remove_from_list() // sem ID = limpa tudo
```

### 📚 Knowledge Tools

```typescript
// Buscar produto na base
search_product("notebook dell")
// Retorna: { found: true, data: { name: "...", price: 2500 } }
```

---

## ✅ CHECKLIST DE VALIDAÇÃO PARA O AGENTE

Antes de executar um bloco, o agente deve verificar:

- [ ] **PASSO atual está correto?** (ex: "PASSO A", "PASSO B")
- [ ] **Validação está configurada?** Verificar se campo já existe no contexto
- [ ] **Qual AÇÃO executar?** (send_and_wait, send_only, decision, update_data, end)
- [ ] **Mensagens estão corretas?** Interpolar variáveis do contexto (ex: `{nome_do_cliente}`)
- [ ] **Decisões estão configuradas?** Avaliar na ordem de prioridade
- [ ] **Próximo PASSO está definido?** Usar `entao_ir_para` das decisões
- [ ] **Tool precisa ser executada?** Verificar `dados_extras.tool_name`
- [ ] **Fallback está configurado?** Lidar com respostas fora do contexto

---

## 🎓 EXEMPLOS DE FLUXOS COMPLETOS

### Exemplo 1: Coleta de Nome Simples

```
INÍCIO → Pergunta Nome → Salvar Nome → Fim

JSONB:
{
  "passos": [
    { "passo_id": "INÍCIO", ... },
    { "passo_id": "PASSO A", ... },
    { "passo_id": "PASSO B", ... },
    { "passo_id": "PASSO C", ... }
  ]
}
```

### Exemplo 2: Fluxo com Ramificação

```
INÍCIO → Pergunta Tipo Cliente
         ├─ Cliente Novo → Apresentar Empresa → Fim
         └─ Cliente Recorrente → Ofertar Desconto → Fim

JSONB:
{
  "passos": [
    { "passo_id": "INÍCIO", variacoes: [...] },
    { "passo_id": "PASSO A", variacoes: [...] }, // Pergunta tipo
    { "passo_id": "PASSO B", variacoes: [
        { variacao_id: "B1", ... }, // Cliente Novo
        { variacao_id: "B2", ... }  // Cliente Recorrente
      ]
    }
  ]
}
```

---

## 📝 RESUMO RÁPIDO

| Categoria | Blocos | Action Type |
|-----------|--------|-------------|
| 🗣️ Comunicação | start, ask_question, send_message, request_document, send_link, send_media | send_and_wait, send_only |
| 🧠 Lógica | branch_decision, check_if_done, retry_with_variation, validate_document | decision, send_and_wait |
| 💾 Dados | update_lead_data, move_lead_in_funnel | update_data |
| 🔔 Notificação | transfer_to_human | update_data |
| 📚 Conhecimento | provide_instructions, search_knowledge | send_only, send_and_wait |
| 🛒 Pedidos | add_to_list, confirm_list, remove_from_list | update_data, send_and_wait |
| 🏁 Controle | end_conversation | end |

---

## 🚀 VERSÃO DO DOCUMENTO

**Versão:** 1.0
**Data:** 2025-01-22
**Compatível com:** Flow Builder v2.0 (100% PT Markdown)

---

*Documento gerado para auxiliar agentes de IA a processar fluxos do Flow Builder de forma autônoma e inteligente.*
