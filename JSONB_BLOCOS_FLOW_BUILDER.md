# 📚 DOCUMENTAÇÃO COMPLETA - JSONB FLOW BUILDER

## Estrutura dos Blocos para o Agente de IA

Este documento contém a estrutura JSONB padronizada de **todos os 15 blocos** do Flow Builder.
O agente de IA receberá esta estrutura e deve identificar qual bloco executar baseado no campo `_metadata.tipo_tecnico`.

---

## 🎯 ESTRUTURA PADRÃO (Aplicada em TODOS os blocos)

```json
{
  "passo_id": "PASSO X",
  "passo_nome": "Nome do passo",
  "variacoes": [{
    "variacao_id": "X1",
    "variacao_nome": "Nome da variação",

    "validacao": {
      "verificar_antes_de_executar": boolean,
      "verificar_no_contexto": "campo_do_contexto",
      "se_ja_feito": {
        "pular_para": "PASSO Y",
        "motivo": "razão do pulo"
      } | null
    },

    "instrucoes": {
      "objetivo": "O que este bloco faz",
      "o_que_fazer": "acao_especifica",

      "mensagens_da_ia": [{
        "tipo": "apresentacao|pergunta|explicacao|solicitacao|confirmacao|despedida|nenhum",
        "conteudo": "Texto da mensagem"
      }],

      "decisoes": [{
        "numero": 1,
        "se_cliente_falar": "condição",
        "entao_ir_para": "PASSO Y",
        "prioridade": "alta|média|baixa",
        "tipo": "resposta_usuario|timeout|condicao|check|automatico"
      }],

      "regra_critica": "Regra principal deste bloco",
      "importante": "Observação importante",

      "dados_extras": {
        "modo_ia": "conversational|tool_execution|knowledge_storage|decision_logic|validation_check|retry_variation",
        // Campos específicos por tipo de bloco
      }
    },

    "controle": {
      "tentativas_maximas": number | null,
      "campo_obrigatorio": boolean,
      "timeout_segundos": number | null
    },

    "_metadata": {
      "posicao_canvas": { "x": number, "y": number },
      "tipo_tecnico": "start|ask_question|send_message|..."
    }
  }]
}
```

---

## 📋 BLOCO 1 - INÍCIO (start)

**Identificação:** `_metadata.tipo_tecnico = "start"`
**Modo IA:** `conversational`
**Tipo Mensagem:** `apresentacao`

```json
{
  "passo_id": "INÍCIO",
  "passo_nome": "Início",
  "condicao": "Primeira interação da conversa",
  "variacoes": [{
    "variacao_id": "INÍCIO",
    "variacao_nome": "Apresentação inicial",

    "validacao": {
      "verificar_antes_de_executar": true,
      "verificar_no_contexto": "conversa_ja_iniciada",
      "se_ja_feito": {
        "pular_para": "PASSO A",
        "motivo": "Conversa já foi iniciada anteriormente"
      }
    },

    "instrucoes": {
      "objetivo": "Se apresentar e entender a necessidade do cliente",
      "o_que_fazer": "enviar_mensagem_e_aguardar_resposta",

      "mensagens_da_ia": [
        {
          "tipo": "apresentacao",
          "conteudo": "Olá! Seja bem-vindo(a) à [Nome da Empresa] 👋"
        },
        {
          "tipo": "apresentacao",
          "conteudo": "Sou a assistente virtual e estou aqui para te ajudar!"
        }
      ],

      "decisoes": [{
        "numero": 1,
        "se_cliente_falar": "qualquer resposta",
        "entao_ir_para": "PASSO A",
        "prioridade": "alta",
        "tipo": "resposta_usuario"
      }],

      "regra_critica": "Sempre cumprimentar com educação e apresentar objetivo",
      "importante": "Criar primeiro contato positivo",

      "dados_extras": {
        "modo_ia": "conversational"
      }
    },

    "controle": {
      "tentativas_maximas": null,
      "campo_obrigatorio": true,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 250, "y": 250 },
      "tipo_tecnico": "start"
    }
  }]
}
```

---

## 📋 BLOCO 2 - FAZER PERGUNTA (ask_question)

**Identificação:** `_metadata.tipo_tecnico = "ask_question"`
**Modo IA:** `conversational`
**Tipo Mensagem:** `pergunta`

```json
{
  "passo_id": "PASSO A",
  "passo_nome": "Fazer pergunta",
  "variacoes": [{
    "variacao_id": "A1",
    "variacao_nome": "Perguntar nome do cliente",

    "validacao": {
      "verificar_antes_de_executar": true,
      "verificar_no_contexto": "nome_cliente",
      "se_ja_feito": {
        "pular_para": "PASSO B",
        "motivo": "Nome já foi informado anteriormente"
      }
    },

    "instrucoes": {
      "objetivo": "Obter nome completo do cliente",
      "o_que_fazer": "fazer_pergunta_e_aguardar_resposta",

      "mensagens_da_ia": [{
        "tipo": "pergunta",
        "conteudo": "Para começar, qual é o seu nome completo?"
      }],

      "decisoes": [
        {
          "numero": 1,
          "se_cliente_falar": "informar o nome",
          "entao_ir_para": "PASSO B",
          "prioridade": "alta",
          "tipo": "resposta_usuario",
          "observacao": "Armazenar nome no contexto"
        },
        {
          "numero": 2,
          "se_cliente_falar": "não quero informar",
          "entao_ir_para": "PASSO C",
          "prioridade": "média",
          "tipo": "resposta_usuario"
        },
        {
          "numero": 3,
          "se_condicao": "timeout de 5 minutos",
          "entao_ir_para": "PASSO D",
          "prioridade": "baixa",
          "tipo": "timeout"
        }
      ],

      "regra_critica": "Nunca repetir pergunta se já foi respondida",
      "importante": "Aguardar resposta antes de prosseguir",

      "dados_extras": {
        "modo_ia": "conversational"
      }
    },

    "controle": {
      "tentativas_maximas": 3,
      "campo_obrigatorio": true,
      "timeout_segundos": 300
    },

    "_metadata": {
      "posicao_canvas": { "x": 400, "y": 100 },
      "tipo_tecnico": "ask_question"
    }
  }]
}
```

---

## 📋 BLOCO 3 - ENVIAR MENSAGEM (send_message)

**Identificação:** `_metadata.tipo_tecnico = "send_message"`
**Modo IA:** `conversational`
**Tipo Mensagem:** `explicacao`

```json
{
  "passo_id": "PASSO B",
  "passo_nome": "Enviar mensagem informativa",
  "variacoes": [{
    "variacao_id": "B1",
    "variacao_nome": "Explicar sobre produto",

    "validacao": {
      "verificar_antes_de_executar": false,
      "verificar_no_contexto": "",
      "se_ja_feito": null
    },

    "instrucoes": {
      "objetivo": "Informar cliente sobre nossos produtos",
      "o_que_fazer": "apenas_enviar_mensagem",

      "mensagens_da_ia": [{
        "tipo": "explicacao",
        "conteudo": "Nossos produtos são de alta qualidade e com garantia de 12 meses! 🏆"
      }],

      "decisoes": [{
        "numero": 1,
        "comportamento": "ENVIAR_E_PROSSEGUIR",
        "entao_ir_para": "PASSO C",
        "prioridade": "alta",
        "tipo": "automatico"
      }],

      "regra_critica": "Enviar mensagem clara e objetiva",
      "importante": "Manter contexto da conversa",

      "dados_extras": {
        "modo_ia": "conversational"
      }
    },

    "controle": {
      "tentativas_maximas": null,
      "campo_obrigatorio": false,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 400, "y": 200 },
      "tipo_tecnico": "send_message"
    }
  }]
}
```

---

## 📋 BLOCO 4 - SOLICITAR DOCUMENTO (request_document)

**Identificação:** `_metadata.tipo_tecnico = "request_document"`
**Modo IA:** `conversational`
**Tipo Mensagem:** `solicitacao`

```json
{
  "passo_id": "PASSO C",
  "passo_nome": "Solicitar documento",
  "variacoes": [{
    "variacao_id": "C1",
    "variacao_nome": "Solicitar RG",

    "validacao": {
      "verificar_antes_de_executar": true,
      "verificar_no_contexto": "tem_rg",
      "se_ja_feito": {
        "pular_para": "PASSO D",
        "motivo": "RG já foi enviado anteriormente"
      }
    },

    "instrucoes": {
      "objetivo": "Obter foto do RG do cliente",
      "o_que_fazer": "solicitar_documento_e_aguardar",

      "mensagens_da_ia": [{
        "tipo": "solicitacao",
        "conteudo": "Por favor, envie uma foto do seu RG (frente e verso) 📸"
      }],

      "decisoes": [
        {
          "numero": 1,
          "se_cliente_falar": "enviar documento",
          "entao_ir_para": "PASSO E",
          "prioridade": "alta",
          "tipo": "resposta_usuario",
          "observacao": "Validar documento recebido"
        },
        {
          "numero": 2,
          "se_condicao": "timeout de 10 minutos",
          "entao_ir_para": "PASSO F",
          "prioridade": "baixa",
          "tipo": "timeout"
        }
      ],

      "regra_critica": "Especificar formato e tipo de documento solicitado",
      "importante": "Explicar por que documento é necessário",

      "dados_extras": {
        "modo_ia": "conversational",
        "tipo_documento": "RG",
        "formato_aceito": ["imagem/jpeg", "imagem/png", "application/pdf"],
        "tamanho_maximo_mb": 10
      }
    },

    "controle": {
      "tentativas_maximas": 3,
      "campo_obrigatorio": true,
      "timeout_segundos": 600
    },

    "_metadata": {
      "posicao_canvas": { "x": 400, "y": 300 },
      "tipo_tecnico": "request_document"
    }
  }]
}
```

---

## 📋 BLOCO 5 - ATUALIZAR DADOS DO LEAD (update_lead_data)

**Identificação:** `_metadata.tipo_tecnico = "update_lead_data"`
**Modo IA:** `tool_execution`
**Tipo Mensagem:** `confirmacao`

```json
{
  "passo_id": "PASSO D",
  "passo_nome": "Atualizar dados",
  "variacoes": [{
    "variacao_id": "D1",
    "variacao_nome": "Atualizar nome e email",

    "validacao": {
      "verificar_antes_de_executar": false,
      "verificar_no_contexto": "",
      "se_ja_feito": null
    },

    "instrucoes": {
      "objetivo": "Atualizar dados do lead no CRM",
      "o_que_fazer": "atualizar_dados_do_lead",

      "mensagens_da_ia": [{
        "tipo": "confirmacao",
        "conteudo": "Perfeito! Seus dados foram atualizados com sucesso ✅"
      }],

      "decisoes_diretas": [{
        "numero": 1,
        "comportamento": "EXECUTAR_TOOL_E_CONFIRMAR",
        "entao_ir_para": "PASSO E",
        "prioridade": "alta",
        "tipo": "automatico"
      }],

      "regra_critica": "Confirmar dados antes de atualizar",
      "importante": "Dados atualizados devem refletir no CRM",

      "dados_extras": {
        "modo_ia": "tool_execution",
        "tool_name": "update_lead_data",
        "field_updates": [
          {
            "fieldName": "name",
            "fieldValue": "{{extrair_do_contexto}}"
          },
          {
            "fieldName": "email",
            "fieldValue": "{{extrair_do_contexto}}"
          }
        ]
      }
    },

    "controle": {
      "tentativas_maximas": 1,
      "campo_obrigatorio": true,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 500, "y": 100 },
      "tipo_tecnico": "update_lead_data"
    }
  }]
}
```

---

## 📋 BLOCO 6 - MOVER LEAD NO FUNIL (move_lead_in_funnel)

**Identificação:** `_metadata.tipo_tecnico = "move_lead_in_funnel"`
**Modo IA:** `tool_execution`
**Tipo Mensagem:** `confirmacao`

```json
{
  "passo_id": "PASSO E",
  "passo_nome": "Mover no funil",
  "variacoes": [{
    "variacao_id": "E1",
    "variacao_nome": "Mover para etapa de negociação",

    "validacao": {
      "verificar_antes_de_executar": false,
      "verificar_no_contexto": "",
      "se_ja_feito": null
    },

    "instrucoes": {
      "objetivo": "Mover lead para próxima etapa do funil",
      "o_que_fazer": "mover_lead_no_funil",

      "mensagens_da_ia": [{
        "tipo": "confirmacao",
        "conteudo": "Ótimo! Você avançou para a etapa de negociação 🎯"
      }],

      "decisoes_diretas": [{
        "numero": 1,
        "comportamento": "EXECUTAR_TOOL",
        "entao_ir_para": "PASSO F",
        "prioridade": "alta",
        "tipo": "automatico"
      }],

      "regra_critica": "Verificar se funil e etapa existem",
      "importante": "Movimentação deve ser registrada no histórico",

      "dados_extras": {
        "modo_ia": "tool_execution",
        "tool_name": "move_lead_in_funnel",
        "field_updates": [
          {
            "fieldName": "funnel_id",
            "fieldValue": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
          },
          {
            "fieldName": "kanban_stage_id",
            "fieldValue": "f9e8d7c6-b5a4-3210-9876-543210fedcba"
          }
        ],
        "funnel_name": "Funil de Vendas Principal",
        "stage_name": "Negociação"
      }
    },

    "controle": {
      "tentativas_maximas": 1,
      "campo_obrigatorio": true,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 500, "y": 200 },
      "tipo_tecnico": "move_lead_in_funnel"
    }
  }]
}
```

**⚠️ IMPORTANTE PARA O CODE NODE N8N:**

Para extrair os UUIDs do funil e etapa, use o seguinte caminho:

```javascript
// Caminho correto no JSONB
variacao.instrucoes.dados_extras.field_updates[]

// Extrair UUIDs
const newKanbanStageId = fieldUpdates.find(f => f.fieldName === 'kanban_stage_id')?.fieldValue;
const newFunnelId = fieldUpdates.find(f => f.fieldName === 'funnel_id')?.fieldValue;
```

**Estrutura garantida:**
- ✅ `field_updates` sempre existe em `dados_extras`
- ✅ Contém array com `{fieldName, fieldValue}`
- ✅ `tool_name` é `"move_lead_in_funnel"` (não `update_lead_data`)
- ✅ Campos opcionais: `funnel_name` e `stage_name` (para referência)

---

## 📋 BLOCO 7 - FINALIZAR CONVERSA (end_conversation)

**Identificação:** `_metadata.tipo_tecnico = "end_conversation"`
**Modo IA:** `conversational`
**Tipo Mensagem:** `despedida`

```json
{
  "passo_id": "PASSO F",
  "passo_nome": "Finalizar",
  "variacoes": [{
    "variacao_id": "F1",
    "variacao_nome": "Despedida padrão",

    "validacao": {
      "verificar_antes_de_executar": false,
      "verificar_no_contexto": "",
      "se_ja_feito": null
    },

    "instrucoes": {
      "objetivo": "Encerrar conversa de forma educada",
      "o_que_fazer": "finalizar_conversa",

      "mensagens_da_ia": [{
        "tipo": "despedida",
        "conteudo": "Foi um prazer atender você! Até logo! 👋"
      }],

      "decisoes": [],

      "regra_critica": "Sempre despedir educadamente",
      "importante": "Deixar canal aberto para futuro contato",

      "dados_extras": {
        "modo_ia": "conversational",
        "motivo": "completed",
        "salvar_historico": true
      }
    },

    "controle": {
      "tentativas_maximas": null,
      "campo_obrigatorio": false,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 600, "y": 100 },
      "tipo_tecnico": "end_conversation"
    }
  }]
}
```

---

## 📋 BLOCO 8 - VALIDAR DOCUMENTO (validate_document)

**Identificação:** `_metadata.tipo_tecnico = "validate_document"`
**Modo IA:** `conversational`
**Tipo Mensagem:** `confirmacao`

```json
{
  "passo_id": "PASSO G",
  "passo_nome": "Validar documento",
  "variacoes": [{
    "variacao_id": "G1",
    "variacao_nome": "Validar RG enviado",

    "validacao": {
      "verificar_antes_de_executar": true,
      "verificar_no_contexto": "documento_recebido",
      "se_ja_feito": null
    },

    "instrucoes": {
      "objetivo": "Validar documento recebido do cliente",
      "o_que_fazer": "validar_documento_recebido",

      "mensagens_da_ia": [{
        "tipo": "confirmacao",
        "conteudo": "Estou validando seu documento... um momento! 🔍"
      }],

      "decisoes": [
        {
          "numero": 1,
          "se_condicao": "documento válido e legível",
          "entao_ir_para": "PASSO H",
          "prioridade": "alta",
          "tipo": "condicao",
          "observacao": "Documento aprovado"
        },
        {
          "numero": 2,
          "se_condicao": "documento ilegível ou incompleto",
          "entao_ir_para": "PASSO C",
          "prioridade": "alta",
          "tipo": "condicao",
          "observacao": "Solicitar novamente"
        }
      ],

      "regra_critica": "Verificar legibilidade, formato e dados corretos",
      "importante": "Dar feedback claro sobre validação",

      "dados_extras": {
        "modo_ia": "conversational",
        "tipo_documento_esperado": "RG",
        "criterios_validacao": [
          "imagem_legivel",
          "formato_correto",
          "contem_dados_necessarios"
        ]
      }
    },

    "controle": {
      "tentativas_maximas": 3,
      "campo_obrigatorio": true,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 600, "y": 200 },
      "tipo_tecnico": "validate_document"
    }
  }]
}
```

---

## 📋 BLOCO 9 - ENVIAR LINK (send_link)

**Identificação:** `_metadata.tipo_tecnico = "send_link"`
**Modo IA:** `conversational`
**Tipo Mensagem:** `explicacao`

```json
{
  "passo_id": "PASSO H",
  "passo_nome": "Enviar link",
  "variacoes": [{
    "variacao_id": "H1",
    "variacao_nome": "Enviar link do site",

    "validacao": {
      "verificar_antes_de_executar": false,
      "verificar_no_contexto": "",
      "se_ja_feito": null
    },

    "instrucoes": {
      "objetivo": "Enviar link do site para o cliente",
      "o_que_fazer": "enviar_link",

      "mensagens_da_ia": [{
        "tipo": "explicacao",
        "conteudo": "Acesse nosso site para mais informações:",
        "link_url": "https://www.exemplo.com.br"
      }],

      "decisoes": [{
        "numero": 1,
        "comportamento": "ENVIAR_E_PROSSEGUIR",
        "entao_ir_para": "PASSO I",
        "prioridade": "alta",
        "tipo": "automatico"
      }],

      "regra_critica": "SEMPRE incluir https:// antes do link",
      "importante": "Link deve ser clicável no WhatsApp",

      "dados_extras": {
        "modo_ia": "conversational"
      }
    },

    "controle": {
      "tentativas_maximas": null,
      "campo_obrigatorio": false,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 700, "y": 100 },
      "tipo_tecnico": "send_link"
    }
  }]
}
```

---

## 📋 BLOCO 10 - ENVIAR MÍDIA (send_media)

**Identificação:** `_metadata.tipo_tecnico = "send_media"`
**Modo IA:** `conversational`
**Tipo Mensagem:** `explicacao`

```json
{
  "passo_id": "PASSO I",
  "passo_nome": "Enviar mídia",
  "variacoes": [{
    "variacao_id": "I1",
    "variacao_nome": "Enviar catálogo de produtos",

    "validacao": {
      "verificar_antes_de_executar": false,
      "verificar_no_contexto": "",
      "se_ja_feito": null
    },

    "instrucoes": {
      "objetivo": "Enviar imagem/vídeo para o cliente",
      "o_que_fazer": "enviar_midia",

      "mensagens_da_ia": [{
        "tipo": "explicacao",
        "conteudo": "Segue nosso catálogo de produtos!",
        "media_id": "https://storage.supabase.co/bucket/catalogo.pdf"
      }],

      "decisoes": [{
        "numero": 1,
        "comportamento": "ENVIAR_E_PROSSEGUIR",
        "entao_ir_para": "PASSO J",
        "prioridade": "alta",
        "tipo": "automatico"
      }],

      "regra_critica": "Verificar se URL da mídia está acessível",
      "importante": "Mídia deve carregar corretamente no WhatsApp",

      "dados_extras": {
        "modo_ia": "conversational"
      }
    },

    "controle": {
      "tentativas_maximas": null,
      "campo_obrigatorio": false,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 700, "y": 200 },
      "tipo_tecnico": "send_media"
    }
  }]
}
```

---

## 📋 BLOCO 11 - AVISAR HUMANO (transfer_to_human)

**Identificação:** `_metadata.tipo_tecnico = "transfer_to_human"`
**Modo IA:** `tool_execution`
**Tipo Mensagem:** `confirmacao`
**Categoria:** `Controle`
**Cor:** `Roxo (bg-purple-600)`

### 🎯 **FUNCIONALIDADES:**
1. ✅ **Notificar atendente no WhatsApp** (obrigatório)
2. ⚙️ **Mover lead no funil** (opcional - configurável no modal)

---

### **EXEMPLO 1: Apenas Notificar (SEM mover lead)**

```json
{
  "passo_id": "PASSO J",
  "passo_nome": "Avisar atendente",
  "variacoes": [{
    "variacao_id": "J1",
    "variacao_nome": "Avisar time comercial",

    "validacao": {
      "verificar_antes_de_executar": false,
      "verificar_no_contexto": "",
      "se_ja_feito": null
    },

    "instrucoes": {
      "objetivo": "Avisar atendente humano no WhatsApp sobre novo lead",
      "o_que_fazer": "notificar_atendente_whatsapp",

      "mensagens_da_ia": [{
        "tipo": "confirmacao",
        "conteudo": "Vou avisar nossa equipe para entrar em contato com você! 🙋‍♂️"
      }],

      "decisoes_diretas": [{
        "numero": 1,
        "comportamento": "ENVIAR_MENSAGEM_E_EXECUTAR_TOOL",
        "entao_ir_para": "PASSO K",
        "prioridade": "alta",
        "tipo": "automatico"
      }],

      "regra_critica": "Avisar lead antes de notificar equipe",
      "importante": "Atendente deve ser notificado imediatamente no WhatsApp",

      "dados_extras": {
        "modo_ia": "tool_execution",
        "tool_name": "transfer_to_human",
        "transfer_to_human": {
          "notify_enabled": true,
          "phone": "5511999999999",
          "notification_message": "🔔 Novo lead: {{nome_do_lead}} ({{numero_do_lead}})"
        }
      }
    },

    "controle": {
      "tentativas_maximas": 1,
      "campo_obrigatorio": true,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 800, "y": 300 },
      "tipo_tecnico": "transfer_to_human"
    }
  }]
}
```

---

### **EXEMPLO 2: Notificar + Mover Lead no Funil**

```json
{
  "passo_id": "PASSO J",
  "passo_nome": "Avisar atendente e mover lead",
  "variacoes": [{
    "variacao_id": "J1",
    "variacao_nome": "Avisar time e mover para Negociação",

    "validacao": {
      "verificar_antes_de_executar": false,
      "verificar_no_contexto": "",
      "se_ja_feito": null
    },

    "instrucoes": {
      "objetivo": "Avisar atendente e mover lead para etapa de Negociação",
      "o_que_fazer": "notificar_atendente_e_mover_lead",

      "mensagens_da_ia": [{
        "tipo": "confirmacao",
        "conteudo": "Vou avisar nossa equipe e organizar seu atendimento! 🙋‍♂️"
      }],

      "decisoes_diretas": [{
        "numero": 1,
        "comportamento": "ENVIAR_MENSAGEM_E_EXECUTAR_TOOL",
        "entao_ir_para": "PASSO K",
        "prioridade": "alta",
        "tipo": "automatico"
      }],

      "regra_critica": "Avisar lead, mover no funil e notificar equipe",
      "importante": "Lead deve ser movido ANTES de notificar atendente",

      "dados_extras": {
        "modo_ia": "tool_execution",
        "tool_name": "transfer_to_human",

        "transfer_to_human": {
          "notify_enabled": true,
          "phone": "5511999999999",
          "notification_message": "🔔 Novo lead: {{nome_do_lead}} ({{numero_do_lead}}) movido para Negociação"
        },

        "field_updates": [
          {
            "fieldName": "funnel_id",
            "fieldValue": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
          },
          {
            "fieldName": "kanban_stage_id",
            "fieldValue": "f9e8d7c6-b5a4-3210-9876-543210fedcba"
          }
        ],

        "funnel_name": "Funil de Vendas Principal",
        "stage_name": "Negociação"
      }
    },

    "controle": {
      "tentativas_maximas": 1,
      "campo_obrigatorio": true,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 800, "y": 300 },
      "tipo_tecnico": "transfer_to_human"
    }
  }]
}
```

---

## ⚠️ **IMPORTANTE PARA O CODE NODE N8N:**

### **Estrutura de dados:**

```javascript
// 1. EXTRAIR VARIÁVEIS DO FLUXO
const currentStepId = $json.current_step_id;
const currentVariationId = $json.current_variation_id;
const tipoTecnico = $json.tipo_tecnico_variation;
const leadId = $json.lead_id;
const flow = JSON.parse($json.flow);

// 2. ENCONTRAR VARIATION ATUAL
const variation = flow.variacoes.find(v => v.variacao_id === currentVariationId);
const dadosExtras = variation.instrucoes.dados_extras;

// 3. NOTIFICAÇÃO (sempre obrigatório)
const transferData = dadosExtras.transfer_to_human;
const phone = transferData.phone;
const notificationMessage = transferData.notification_message;

// 4. MOVIMENTAÇÃO (opcional - verificar SE existe)
const needsMove = dadosExtras.field_updates && dadosExtras.field_updates.length > 0;
let newFunnelId = null;
let newKanbanStageId = null;

if (needsMove) {
  newFunnelId = dadosExtras.field_updates.find(f => f.fieldName === 'funnel_id')?.fieldValue;
  newKanbanStageId = dadosExtras.field_updates.find(f => f.fieldName === 'kanban_stage_id')?.fieldValue;
}

// 5. BUSCAR DADOS DO LEAD (do Supabase node anterior)
const leadName = $input.first().json.name || 'Nome não informado';
const leadPhone = $input.first().json.phone || 'Número não informado';

// 6. SUBSTITUIR VARIÁVEIS na mensagem
let finalMessage = notificationMessage;
if (finalMessage.includes('{{nome_do_lead}}') || finalMessage.includes('{{numero_do_lead}}')) {
  finalMessage = finalMessage
    .replace(/\{\{nome_do_lead\}\}/g, leadName)
    .replace(/\{\{numero_do_lead\}\}/g, leadPhone);
}

// 7. OUTPUT
return {
  lead_id: leadId,
  needs_move: needsMove,
  new_funnel_id: newFunnelId,
  new_kanban_stage_id: newKanbanStageId,
  notification_phone: phone,
  notification_message: finalMessage
};
```

---

### **⚠️ IMPORTANTE - Configuração do Fluxo N8N:**

**Pré-requisito obrigatório:**
Antes do Code Node "ORGANIZA AVISAR HUMANO", você DEVE adicionar um **Supabase node** para buscar os dados do lead (nome e telefone). Isso é necessário para substituir as variáveis {{nome_do_lead}} e {{numero_do_lead}} na mensagem de notificação.

**Configuração do Supabase node:**
- Table: `leads`
- Operation: `Get Row(s)`
- Filter: `id = {{ $json.lead_id }}`
- Output: Certifique-se que campos `name` e `phone` estão disponíveis

---

### **Lógica N8N recomendada:**

```
1. Supabase Node "GET LEAD DATA" (busca nome e telefone do lead)
   ↓
2. Code Node "ORGANIZA AVISAR HUMANO" (extrai dados do JSONB + substitui variáveis)
   ↓
3. Switch Node: needs_move?
   ├─ TRUE → Supabase UPDATE (mover lead) → WhatsApp (notificar)
   └─ FALSE → WhatsApp (notificar apenas)
```

---

### **Variáveis disponíveis:**
- `{{nome_do_lead}}` - Nome completo do lead
- `{{numero_do_lead}}` - Telefone do lead

---

### **Garantias da estrutura:**
- ✅ `transfer_to_human` sempre existe em `dados_extras` (obrigatório)
- ✅ `notify_enabled` sempre será `true`
- ✅ `phone` é obrigatório (validado no front)
- ✅ `notification_message` é obrigatório (validado no front)
- ⚙️ `field_updates` é OPCIONAL (só existe se usuário marcar no modal)
- ⚙️ `funnel_name` e `stage_name` são OPCIONAIS (apenas para referência)

---

## 📋 BLOCO 12 - ENSINAR/ORIENTAR (provide_instructions)

**Identificação:** `_metadata.tipo_tecnico = "provide_instructions"`
**Modo IA:** `knowledge_storage`
**Tipo Mensagem:** `explicacao`

```json
{
  "passo_id": "PASSO K",
  "passo_nome": "Ensinar informação",
  "variacoes": [{
    "variacao_id": "K1",
    "variacao_nome": "Ensinar sobre horário de atendimento",

    "validacao": {
      "verificar_antes_de_executar": false,
      "verificar_no_contexto": "",
      "se_ja_feito": null
    },

    "instrucoes": {
      "objetivo": "Ensinar informação específica ao agente para uso futuro nas conversas",
      "o_que_fazer": "ensinar_informacao_ao_agente",

      "mensagens_da_ia": [{
        "tipo": "explicacao",
        "conteudo": "Entendi! Vou usar essa informação nas próximas conversas com os clientes."
      }],

      "decisoes_diretas": [{
        "numero": 1,
        "comportamento": "ARMAZENAR_E_PROSSEGUIR",
        "entao_ir_para": "PASSO L",
        "prioridade": "alta",
        "tipo": "automatico"
      }],

      "regra_critica": "Garantir que informação seja compreensível e armazenável",
      "importante": "Informação deve ser armazenada para uso futuro em conversas",

      "dados_extras": {
        "modo_ia": "knowledge_storage",
        "tipo_conhecimento": "horario",
        "topico": "Horário de atendimento",
        "conteudo_para_aprender": "Nosso horário de atendimento é de segunda a sexta-feira, das 8h às 18h. Aos sábados atendemos das 9h às 13h.",
        "contexto_de_uso": "Quando cliente perguntar sobre horários de funcionamento",
        "exemplos": [
          "Vocês atendem aos sábados?",
          "Que horas vocês abrem?",
          "Posso ligar agora?"
        ]
      }
    },

    "controle": {
      "tentativas_maximas": null,
      "campo_obrigatorio": true,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 900, "y": 100 },
      "tipo_tecnico": "provide_instructions"
    }
  }]
}
```

---

## 📋 BLOCO 13 - DECISÃO (branch_decision)

**Identificação:** `_metadata.tipo_tecnico = "branch_decision"`
**Modo IA:** `decision_logic`
**Tipo Mensagem:** `nenhum` (não envia mensagem)

```json
{
  "passo_id": "PASSO L",
  "passo_nome": "Decisão condicional",
  "variacoes": [{
    "variacao_id": "L1",
    "variacao_nome": "Avaliar interesse do lead",

    "validacao": {
      "verificar_antes_de_executar": true,
      "verificar_no_contexto": "interesse_do_lead",
      "se_ja_feito": null
    },

    "instrucoes": {
      "objetivo": "Tomar decisão baseada em condições específicas e direcionar fluxo",
      "o_que_fazer": "tomar_decisao_baseada_em_condicoes",

      "mensagens_da_ia": [],

      "decisoes": [
        {
          "numero": 1,
          "se_condicao": "lead demonstrou interesse alto no produto",
          "entao_ir_para": "PASSO M",
          "prioridade": "alta",
          "tipo": "condicao",
          "observacao": "Lead qualificado para venda"
        },
        {
          "numero": 2,
          "se_condicao": "lead demonstrou interesse médio ou ainda tem dúvidas",
          "entao_ir_para": "PASSO N",
          "prioridade": "média",
          "tipo": "condicao",
          "observacao": "Nutrir com mais informações"
        },
        {
          "numero": 3,
          "se_condicao": "lead demonstrou baixo interesse ou não está pronto",
          "entao_ir_para": "PASSO O",
          "prioridade": "baixa",
          "tipo": "condicao",
          "observacao": "Follow-up futuro"
        }
      ],

      "regra_critica": "Avaliar TODAS as condições na ordem de prioridade antes de decidir",
      "importante": "Decisão deve ser tomada com base em dados do contexto da conversa",

      "dados_extras": {
        "modo_ia": "decision_logic",
        "tipo_decisao": "baseada_em_contexto",
        "campos_analisados": [
          "interesse_do_lead",
          "perguntas_feitas",
          "objecoes_levantadas"
        ],
        "logica_fallback": {
          "se_nenhuma_condicao_atendida": "PASSO O",
          "motivo": "Nenhuma condição foi satisfeita"
        }
      }
    },

    "controle": {
      "tentativas_maximas": null,
      "campo_obrigatorio": true,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 1000, "y": 200 },
      "tipo_tecnico": "branch_decision",
      "numero_saidas": 3
    }
  }]
}
```

---

## 📋 BLOCO 14 - VERIFICAR SE JÁ FEZ (check_if_done)

**Identificação:** `_metadata.tipo_tecnico = "check_if_done"`
**Modo IA:** `validation_check`
**Tipo Mensagem:** `nenhum` (não envia mensagem)

```json
{
  "passo_id": "PASSO M",
  "passo_nome": "Verificar se já executou",
  "variacoes": [{
    "variacao_id": "M1",
    "variacao_nome": "Verificar se enviou documento",

    "validacao": {
      "verificar_antes_de_executar": true,
      "verificar_no_contexto": "enviou_documento",
      "se_ja_feito": {
        "pular_para": "PASSO N",
        "motivo": "Documento já foi enviado anteriormente"
      }
    },

    "instrucoes": {
      "objetivo": "Verificar se etapa específica já foi concluída anteriormente",
      "o_que_fazer": "verificar_se_etapa_foi_concluida",

      "mensagens_da_ia": [],

      "decisoes": [
        {
          "numero": 1,
          "se_condicao": "já_fez",
          "entao_ir_para": "PASSO N",
          "prioridade": "alta",
          "tipo": "check",
          "observacao": "Etapa já concluída, pular"
        },
        {
          "numero": 2,
          "se_condicao": "ainda_não_fez",
          "entao_ir_para": "PASSO C",
          "prioridade": "alta",
          "tipo": "check",
          "observacao": "Executar ação"
        }
      ],

      "regra_critica": "SEMPRE verificar no contexto antes de solicitar novamente",
      "importante": "Evitar repetir ações que o lead já realizou",

      "dados_extras": {
        "modo_ia": "validation_check",
        "campo_para_verificar": "enviou_documento",
        "bloco_referencia_id": "node_123",
        "bloco_referencia_nome": "Solicitar Documento",
        "tipo_verificacao": "campo_contexto",
        "criterio_validacao": {
          "campo_existe": true,
          "campo_nao_vazio": true,
          "valor_especifico": null
        }
      }
    },

    "controle": {
      "tentativas_maximas": null,
      "campo_obrigatorio": true,
      "timeout_segundos": null
    },

    "_metadata": {
      "posicao_canvas": { "x": 1100, "y": 300 },
      "tipo_tecnico": "check_if_done",
      "numero_saidas": 2
    }
  }]
}
```

---

## 📋 BLOCO 15 - REPETIR COM VARIAÇÃO (retry_with_variation)

**Identificação:** `_metadata.tipo_tecnico = "retry_with_variation"`
**Modo IA:** `retry_variation`
**Tipo Mensagem:** `pergunta`

```json
{
  "passo_id": "PASSO N",
  "passo_nome": "Repetir com variação",
  "variacoes": [{
    "variacao_id": "N1",
    "variacao_nome": "Repetir pergunta de forma diferente",

    "validacao": {
      "verificar_antes_de_executar": true,
      "verificar_no_contexto": "tentativas_anteriores",
      "se_ja_feito": null
    },

    "instrucoes": {
      "objetivo": "Tentar novamente uma pergunta ou solicitação usando abordagem diferente",
      "o_que_fazer": "tentar_novamente_com_variacao",

      "mensagens_da_ia": [{
        "tipo": "pergunta",
        "conteudo": "Deixa eu reformular... você tem interesse em conhecer nossos planos?"
      }],

      "decisoes": [
        {
          "numero": 1,
          "se_cliente_falar": "responder positivamente",
          "entao_ir_para": "PASSO O",
          "prioridade": "alta",
          "tipo": "resposta_usuario"
        },
        {
          "numero": 2,
          "se_condicao": "ainda não respondeu ou ignorou",
          "entao_ir_para": "PASSO P",
          "prioridade": "média",
          "tipo": "timeout"
        }
      ],

      "regra_critica": "Variar abordagem sem repetir texto anterior exatamente",
      "importante": "Manter mesmo objetivo mas com palavras e tom diferentes",

      "dados_extras": {
        "modo_ia": "retry_variation",
        "bloco_original_id": "node_456",
        "bloco_original_nome": "Perguntar sobre interesse",
        "numero_tentativa": 2,
        "maximo_tentativas": 3,
        "variacoes_disponiveis": [
          "Deixa eu reformular...",
          "De outro jeito...",
          "Explicando melhor..."
        ],
        "estrategia_variacao": "mudar_tom"
      }
    },

    "controle": {
      "tentativas_maximas": 3,
      "campo_obrigatorio": false,
      "timeout_segundos": 300
    },

    "_metadata": {
      "posicao_canvas": { "x": 1200, "y": 400 },
      "tipo_tecnico": "retry_with_variation"
    }
  }]
}
```

---

## 🎯 TABELA RESUMO - IDENTIFICAÇÃO RÁPIDA

| # | Nome do Bloco | `tipo_tecnico` | `modo_ia` | `tipo_mensagem` |
|---|---------------|----------------|-----------|-----------------|
| 1 | INÍCIO | `start` | `conversational` | `apresentacao` |
| 2 | FAZER PERGUNTA | `ask_question` | `conversational` | `pergunta` |
| 3 | ENVIAR MENSAGEM | `send_message` | `conversational` | `explicacao` |
| 4 | SOLICITAR DOCUMENTO | `request_document` | `conversational` | `solicitacao` |
| 5 | ATUALIZAR DADOS | `update_lead_data` | `tool_execution` | `confirmacao` |
| 6 | MOVER FUNIL | `move_lead_in_funnel` | `tool_execution` | `confirmacao` |
| 7 | FINALIZAR | `end_conversation` | `conversational` | `despedida` |
| 8 | VALIDAR DOCUMENTO | `validate_document` | `conversational` | `confirmacao` |
| 9 | ENVIAR LINK | `send_link` | `conversational` | `explicacao` |
| 10 | ENVIAR MÍDIA | `send_media` | `conversational` | `explicacao` |
| 11 | TRANSFERIR HUMANO 👑 | `transfer_to_human` | `tool_execution` | `despedida` |
| 12 | ENSINAR/ORIENTAR | `provide_instructions` | `knowledge_storage` | `explicacao` |
| 13 | DECISÃO | `branch_decision` | `decision_logic` | `nenhum` |
| 14 | VERIFICAR SE JÁ FEZ | `check_if_done` | `validation_check` | `nenhum` |
| 15 | REPETIR COM VARIAÇÃO | `retry_with_variation` | `retry_variation` | `pergunta` |

---

## 📌 NOTAS IMPORTANTES PARA O AGENTE DE IA

### 1. Identificação do Bloco
O agente deve usar `_metadata.tipo_tecnico` para identificar qual tipo de bloco está processando.

### 2. Modo de Operação
O campo `dados_extras.modo_ia` define como o agente deve se comportar:
- **conversational**: Enviar mensagem e aguardar resposta
- **tool_execution**: Executar tool (atualizar dados, mover funil)
- **knowledge_storage**: Armazenar conhecimento para uso futuro
- **decision_logic**: Avaliar condições e decidir caminho
- **validation_check**: Verificar se algo já foi feito
- **retry_variation**: Tentar novamente com variação

### 3. Validação Antes de Executar
Se `validacao.verificar_antes_de_executar = true`, o agente DEVE:
1. Verificar campo `validacao.verificar_no_contexto` no `conversation_context`
2. Se `validacao.se_ja_feito` existir e condição for verdadeira, PULAR para o passo indicado

### 4. Mensagens vs Ações
- Blocos com `mensagens_da_ia[]` vazios NÃO enviam mensagens (ex: DECISÃO, VERIFICAR SE JÁ FEZ)
- Blocos `tool_execution` executam ação ANTES ou DEPOIS de enviar mensagem

### 5. Decisões e Ramificações
- `decisoes[]`: Aguarda resposta do usuário para decidir
- `decisoes_diretas[]`: Executa automaticamente sem aguardar resposta
- Prioridade: `alta` → `média` → `baixa` (primeira condição verdadeira vence)

### 6. Controle de Tentativas
- `controle.tentativas_maximas`: Limite de tentativas (null = ilimitado)
- `controle.timeout_segundos`: Tempo máximo de espera (null = sem timeout)
- `controle.campo_obrigatorio`: Se campo é obrigatório para prosseguir

---

**Documento gerado em:** 2025-10-08
**Versão:** 1.0
**Total de blocos:** 15 (14 básicos + 1 premium)
