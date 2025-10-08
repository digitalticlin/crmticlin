# 📚 Documentação: JSONB Markdown PT - 13 Blocos do Flow Builder

> **Versão**: 1.0
> **Data**: 2025-10-08
> **Formato**: 100% Português Markdown

---

## 🎯 Estrutura Geral do JSONB

```json
{
  "passos": [
    {
      "passo_id": "INÍCIO | PASSO A | PASSO B...",
      "passo_nome": "Nome descritivo do passo",
      "condicao": "Quando este passo deve ser executado",
      "variacoes": [...]
    }
  ],
  "conexoes": [
    {
      "id": "c1",
      "origem": "node_id_origem",
      "destino": "node_id_destino",
      "condicao": "Condição para seguir esta conexão",
      "tipo": "fluxo_principal | decisao | fallback"
    }
  ],
  "informacoes_fluxo": {
    "versao": "1.0",
    "criado_em": "2025-10-08T15:00:00.000Z",
    "atualizado_em": "2025-10-08T15:30:00.000Z"
  }
}
```

---

## 📦 Estrutura de Uma Variação (Comum a Todos os Blocos)

```json
{
  "variacao_id": "INÍCIO | A1 | B2...",
  "variacao_nome": "Nome descritivo da variação",

  "validacao": {
    "verificar_antes_de_executar": true,
    "verificar_no_contexto": "se já executou ação X",
    "se_ja_feito": {
      "pular_para": "PASSO C",
      "motivo": "já executado anteriormente"
    }
  },

  "instrucoes": {
    "objetivo": "O que este bloco faz",
    "o_que_fazer": "acao_em_portugues",
    // Campos específicos de cada bloco...
  },

  "controle": {
    "tentativas_maximas": 3,
    "campo_obrigatorio": true,
    "timeout_segundos": 60,
    "observacao": "Observações adicionais"
  },

  "_metadata": {
    "posicao_canvas": { "x": 100, "y": 200 },
    "id_original_node": "1",
    "tipo_tecnico": "start"
  }
}
```

---

## 🔵 1. BLOCO INÍCIO (start)

**Tipo Técnico**: `start`
**O que faz**: `enviar_mensagem_e_aguardar_resposta`

### JSONB:
```json
{
  "variacao_id": "INÍCIO",
  "variacao_nome": "Início",

  "instrucoes": {
    "objetivo": "Se apresentar e entender a mensagem do cliente",
    "o_que_fazer": "enviar_mensagem_e_aguardar_resposta",

    "mensagens_da_ia": [
      {
        "tipo": "texto",
        "conteudo": "Olá! Sou a Amanda, da SolucionaCon. Como posso ajudar?",
        "aguardar_segundos": 0
      },
      {
        "tipo": "texto",
        "conteudo": "Você tem alguma dúvida sobre consórcio?",
        "aguardar_segundos": 2
      }
    ],

    "decisoes": [
      {
        "numero": 1,
        "se_cliente_falar": "suporte, ajuda, consórcio",
        "entao_ir_para": "PASSO A",
        "prioridade": "alta",
        "tipo": "resposta_usuario"
      }
    ]
  },

  "controle": {
    "tentativas_maximas": 1,
    "campo_obrigatorio": false
  }
}
```

### Campos Específicos:
- `mensagens_da_ia[]` - Lista de mensagens sequenciais

---

## 🔵 2. PERGUNTAR (ask_question)

**Tipo Técnico**: `ask_question`
**O que faz**: `fazer_pergunta_e_aguardar_resposta`

### JSONB:
```json
{
  "variacao_id": "A1",
  "variacao_nome": "Confirmar Situação Consórcio",

  "validacao": {
    "verificar_antes_de_executar": true,
    "verificar_no_contexto": "se já perguntou situação do consórcio",
    "se_ja_feito": {
      "pular_para": "PASSO B",
      "motivo": "já confirmou situação"
    }
  },

  "instrucoes": {
    "objetivo": "Confirmar se cliente cancelou, parou ou está pagando consórcio",
    "o_que_fazer": "fazer_pergunta_e_aguardar_resposta",

    "pergunta": "Você cancelou, parou de pagar ou ainda está pagando o consórcio?",

    "regra_critica": "NUNCA REPETIR PERGUNTA SE JÁ RESPONDEU",
    "importante": "Não fazer confirmações robóticas como 'Entendi que...'",

    "decisoes_diretas": [
      {
        "numero": 1,
        "se_cliente_falar": "cancelei",
        "comportamento": "RESPOSTA COMPLETA - IR DIRETO",
        "entao_ir_para": "PASSO B",
        "sem_confirmacao": true
      },
      {
        "numero": 2,
        "se_cliente_falar": "parei de pagar",
        "comportamento": "RESPOSTA COMPLETA - IR DIRETO",
        "entao_ir_para": "PASSO B",
        "sem_confirmacao": true
      }
    ]
  },

  "controle": {
    "tentativas_maximas": 1,
    "campo_obrigatorio": true
  }
}
```

### Campos Específicos:
- `pergunta` - Pergunta única
- `decisoes_diretas[]` - Decisões sem sub-perguntas
- `regra_critica` - Regra que não pode ser quebrada
- `importante` - Aviso importante
- `sem_confirmacao` - Não fazer confirmações robóticas

---

## 🔵 3. ENVIAR MENSAGEM (send_message)

**Tipo Técnico**: `send_message`
**O que faz**: `apenas_enviar_mensagem`

### JSONB:
```json
{
  "variacao_id": "B1",
  "variacao_nome": "Explicar Processo",

  "instrucoes": {
    "objetivo": "Explicar como funciona o processo de análise",
    "o_que_fazer": "apenas_enviar_mensagem",

    "mensagem_principal": {
      "com_nome": "Perfeito [NOME]! Vou te explicar como funciona...",
      "sem_nome": "Vou te explicar como funciona..."
    }
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false
  }
}
```

### Campos Específicos:
- `mensagem_principal` - String simples ou objeto com variações condicionais

---

## 🔵 4. SOLICITAR DOCUMENTO (request_document)

**Tipo Técnico**: `request_document`
**O que faz**: `solicitar_documento_e_aguardar`

### JSONB:
```json
{
  "variacao_id": "C1",
  "variacao_nome": "Solicitar Extrato PDF",

  "instrucoes": {
    "objetivo": "Solicitar extrato do consórcio em formato PDF",
    "o_que_fazer": "solicitar_documento_e_aguardar",

    "mensagem_principal": "Preciso do extrato do consórcio em PDF para análise.",

    "dados_extras": {
      "document_type": "extrato_consorcio",
      "formatos_aceitos": ["pdf"],
      "tamanho_maximo_mb": 10
    },

    "decisoes": [
      {
        "numero": 1,
        "se_cliente_falar": "enviei, mandei, está aí",
        "entao_ir_para": "PASSO D",
        "prioridade": "alta"
      },
      {
        "numero": 2,
        "tipo": "timeout",
        "entao_ir_para": "PASSO C2",
        "prioridade": "baixa"
      }
    ]
  },

  "controle": {
    "tentativas_maximas": 3,
    "campo_obrigatorio": true,
    "timeout_segundos": 300
  }
}
```

### Campos Específicos:
- `dados_extras.document_type` - Tipo do documento solicitado
- `dados_extras.formatos_aceitos` - Formatos permitidos
- `dados_extras.tamanho_maximo_mb` - Tamanho máximo

---

## 🔵 5. VALIDAR DOCUMENTO (validate_document)

**Tipo Técnico**: `validate_document`
**O que faz**: `validar_documento_recebido`

### JSONB:
```json
{
  "variacao_id": "D1",
  "variacao_nome": "Validar Extrato Recebido",

  "instrucoes": {
    "objetivo": "Verificar se o documento enviado é válido e legível",
    "o_que_fazer": "validar_documento_recebido",

    "mensagem_principal": "Estou verificando o documento...",

    "dados_extras": {
      "validacoes": [
        "verificar_se_e_pdf",
        "verificar_legibilidade",
        "verificar_se_contem_dados_consorcio"
      ]
    },

    "decisoes": [
      {
        "numero": 1,
        "se_lead": "documento válido",
        "entao_ir_para": "PASSO E",
        "prioridade": "alta"
      },
      {
        "numero": 2,
        "se_lead": "documento inválido",
        "acao": "solicitar novo documento",
        "entao_ir_para": "PASSO C",
        "prioridade": "alta"
      }
    ]
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": true
  }
}
```

### Campos Específicos:
- `dados_extras.validacoes[]` - Lista de validações a executar

---

## 🔵 6. ENVIAR LINK (send_link)

**Tipo Técnico**: `send_link`
**O que faz**: `enviar_link`

### JSONB:
```json
{
  "variacao_id": "E1",
  "variacao_nome": "Enviar Link Formulário",

  "instrucoes": {
    "objetivo": "Enviar link para formulário de cadastro",
    "o_que_fazer": "enviar_link",

    "mensagem_principal": "Preencha o formulário neste link:",

    "dados_extras": {
      "link_url": "https://solucionacon.com/formulario",
      "link_title": "Formulário de Análise"
    }
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false
  }
}
```

### Campos Específicos:
- `dados_extras.link_url` - URL do link
- `dados_extras.link_title` - Título do link

---

## 🔵 7. ENVIAR MÍDIA (send_media)

**Tipo Técnico**: `send_media`
**O que faz**: `enviar_midia`

### JSONB:
```json
{
  "variacao_id": "F1",
  "variacao_nome": "Enviar Vídeo Explicativo",

  "instrucoes": {
    "objetivo": "Enviar vídeo explicando o processo",
    "o_que_fazer": "enviar_midia",

    "mensagem_principal": "Aqui está um vídeo explicativo:",

    "dados_extras": {
      "media_id": "video_123",
      "media_caption": "Vídeo: Como funciona a análise"
    }
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false
  }
}
```

### Campos Específicos:
- `dados_extras.media_id` - ID da mídia no sistema
- `dados_extras.media_caption` - Legenda da mídia

---

## 🔵 8. ATUALIZAR DADOS DO LEAD (update_lead_data)

**Tipo Técnico**: `update_lead_data`
**O que faz**: `atualizar_dados_do_lead`

**⚠️ USA TOOL - Não apenas conversa**

### JSONB:
```json
{
  "variacao_id": "G1",
  "variacao_nome": "Salvar Nome do Lead",

  "instrucoes": {
    "objetivo": "Extrair e salvar o nome fornecido pelo lead",
    "o_que_fazer": "atualizar_dados_do_lead",

    "mensagem_principal": "Vou atualizar seu cadastro...",

    "dados_extras": {
      "field_updates": [
        {
          "field": "nome",
          "value": "[EXTRAIR_DA_CONVERSA]"
        },
        {
          "field": "situacao_consorcio",
          "value": "[EXTRAIR_DA_CONVERSA]"
        }
      ],
      "modo_ia": "tool_execution",
      "instrucao_ia": "Extrair nome e situação do consórcio das mensagens anteriores e salvar nos campos correspondentes"
    }
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": true
  }
}
```

### Campos Específicos:
- `dados_extras.field_updates[]` - Campos a atualizar
- `dados_extras.modo_ia` - `tool_execution` (executa ferramenta)
- `dados_extras.instrucao_ia` - Instrução para a IA sobre como extrair dados

---

## 🔵 9. MOVER LEAD NO FUNIL (move_lead_in_funnel)

**Tipo Técnico**: `move_lead_in_funnel`
**O que faz**: `mover_lead_no_funil`

**⚠️ USA TOOL - Não apenas conversa**

### JSONB:
```json
{
  "variacao_id": "H1",
  "variacao_nome": "Mover para Etapa Análise",

  "instrucoes": {
    "objetivo": "Mover lead para etapa de análise de documentos",
    "o_que_fazer": "mover_lead_no_funil",

    "mensagem_principal": "Perfeito! Vou encaminhar para análise.",

    "dados_extras": {
      "funnel_id": "funil_consorcio",
      "stage_id": "em_analise",
      "send_message": false,
      "modo_ia": "tool_execution_then_send",
      "instrucao_ia": "Mover o lead para a etapa 'Em Análise' e depois enviar a mensagem"
    }
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": true
  }
}
```

### Campos Específicos:
- `dados_extras.funnel_id` - ID do funil
- `dados_extras.stage_id` - ID da etapa de destino
- `dados_extras.send_message` - Se deve enviar mensagem após mover
- `dados_extras.modo_ia` - `tool_execution_then_send` (executa e depois envia msg)

---

## 🔵 10. DECISÃO (branch_decision)

**Tipo Técnico**: `branch_decision`
**O que faz**: `tomar_decisao_baseada_em_condicoes`

### JSONB:
```json
{
  "variacao_id": "I1",
  "variacao_nome": "Decidir Próximo Passo",

  "instrucoes": {
    "objetivo": "Decidir qual caminho seguir baseado no contexto",
    "o_que_fazer": "tomar_decisao_baseada_em_condicoes",

    "dados_extras": {
      "decision_context": "situacao_consorcio, tem_extrato"
    },

    "decisoes": [
      {
        "numero": 1,
        "se_lead": "cancelou E tem extrato",
        "entao_ir_para": "PASSO J",
        "prioridade": "alta"
      },
      {
        "numero": 2,
        "se_lead": "cancelou E NÃO tem extrato",
        "entao_ir_para": "PASSO C",
        "prioridade": "alta"
      },
      {
        "numero": 3,
        "se_lead": "pagando",
        "entao_ir_para": "PASSO K",
        "prioridade": "média"
      }
    ]
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": true
  }
}
```

### Campos Específicos:
- `dados_extras.decision_context` - Variáveis do contexto para avaliar

---

## 🔵 11. VERIFICAR SE CONCLUÍDO (check_if_done)

**Tipo Técnico**: `check_if_done`
**O que faz**: `verificar_se_etapa_foi_concluida`

### JSONB:
```json
{
  "variacao_id": "J1",
  "variacao_nome": "Verificar se Já Enviou Extrato",

  "instrucoes": {
    "objetivo": "Verificar se o lead já enviou o extrato anteriormente",
    "o_que_fazer": "verificar_se_etapa_foi_concluida",

    "dados_extras": {
      "reference_step": "PASSO C"
    },

    "decisoes": [
      {
        "numero": 1,
        "se_lead": "já enviou extrato",
        "entao_ir_para": "PASSO E",
        "prioridade": "alta"
      },
      {
        "numero": 2,
        "se_lead": "não enviou extrato",
        "entao_ir_para": "PASSO C",
        "prioridade": "alta"
      }
    ]
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": true
  }
}
```

### Campos Específicos:
- `dados_extras.reference_step` - Passo que deve verificar se foi concluído

---

## 🔵 12. TENTAR COM VARIAÇÃO (retry_with_variation)

**Tipo Técnico**: `retry_with_variation`
**O que faz**: `tentar_novamente_com_variacao`

### JSONB:
```json
{
  "variacao_id": "K1",
  "variacao_nome": "Tentar Pergunta Reformulada",

  "instrucoes": {
    "objetivo": "Tentar novamente com pergunta reformulada se não entendeu",
    "o_que_fazer": "tentar_novamente_com_variacao",

    "mensagem_principal": "Deixa eu reformular: você tem ou teve um consórcio?",

    "dados_extras": {
      "reference_step": "PASSO A",
      "variation_number": 2
    }
  },

  "controle": {
    "tentativas_maximas": 2,
    "campo_obrigatorio": true
  }
}
```

### Campos Específicos:
- `dados_extras.reference_step` - Passo original que está sendo retentado
- `dados_extras.variation_number` - Número da variação

---

## 🔵 13. FINALIZAR CONVERSA (end_conversation)

**Tipo Técnico**: `end_conversation`
**O que faz**: `finalizar_conversa`

### JSONB:
```json
{
  "variacao_id": "L1",
  "variacao_nome": "Despedida",

  "instrucoes": {
    "objetivo": "Finalizar atendimento e despedir-se do lead",
    "o_que_fazer": "finalizar_conversa",

    "mensagem_principal": "Foi um prazer te atender! Qualquer dúvida, é só chamar. 😊"
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false
  }
}
```

---

## 🔵 14. TRANSFERIR PARA HUMANO (transfer_human)

**Tipo Técnico**: `transfer_human`
**O que faz**: `transferir_para_atendente_humano`

**⚠️ USA TOOL - Transfere atendimento**

### JSONB:
```json
{
  "variacao_id": "M1",
  "variacao_nome": "Transferir para Atendente",

  "instrucoes": {
    "objetivo": "Transferir conversa para atendente humano",
    "o_que_fazer": "transferir_para_atendente_humano",

    "mensagem_principal": "Vou te conectar com um atendente humano. Aguarde um momento...",

    "dados_extras": {
      "departamento": "suporte",
      "prioridade": "alta",
      "modo_ia": "tool_execution"
    }
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": true
  }
}
```

### Campos Específicos:
- `dados_extras.departamento` - Departamento de destino
- `dados_extras.prioridade` - Prioridade da transferência

---

## 🔵 15. ENSINAR (teach)

**Tipo Técnico**: `teach`
**O que faz**: `ensinar_informacao_ao_agente`

### JSONB:
```json
{
  "variacao_id": "N1",
  "variacao_nome": "Aprender Informação Nova",

  "instrucoes": {
    "objetivo": "Armazenar informação nova no conhecimento do agente",
    "o_que_fazer": "ensinar_informacao_ao_agente",

    "mensagem_principal": "Entendi! Vou guardar essa informação.",

    "dados_extras": {
      "categoria": "processos",
      "informacao": "[EXTRAIR_DA_CONVERSA]",
      "modo_ia": "tool_execution"
    }
  },

  "controle": {
    "tentativas_maximas": null,
    "campo_obrigatorio": false
  }
}
```

### Campos Específicos:
- `dados_extras.categoria` - Categoria do conhecimento
- `dados_extras.informacao` - Informação a ser armazenada

---

## 📊 Resumo: Blocos que Usam TOOLS

| **Bloco** | **Tool** | **Modo IA** |
|-----------|----------|-------------|
| update_lead_data | ✅ Sim | `tool_execution` |
| move_lead_in_funnel | ✅ Sim | `tool_execution_then_send` |
| transfer_human | ✅ Sim | `tool_execution` |
| teach | ✅ Sim | `tool_execution` |

**Blocos restantes**: Apenas conversação (sem tool calls)

---

## 🔑 Campos Comuns a Todos os Blocos

### `instrucoes`:
- `objetivo` ✅ - Sempre presente
- `o_que_fazer` ✅ - Sempre presente (mapeado automaticamente)

### `controle`:
- `tentativas_maximas` ✅
- `campo_obrigatorio` ✅
- `timeout_segundos` (opcional)
- `observacao` (opcional)

### `_metadata`:
- `posicao_canvas` ✅
- `id_original_node` ✅
- `tipo_tecnico` ✅

---

## 🎨 Exemplo Completo: Fluxo SolucionaCon

```json
{
  "passos": [
    {
      "passo_id": "INÍCIO",
      "passo_nome": "PRIMEIRO CONTATO",
      "condicao": "Primeira interação da conversa",
      "variacoes": [
        {
          "variacao_id": "INÍCIO",
          "variacao_nome": "CUMPRIMENTO + CAPTURA NOME",
          "validacao": {
            "verificar_antes_de_executar": true,
            "verificar_no_contexto": "se já se apresentou em mensagens ENVIADA anteriores",
            "se_ja_feito": {
              "pular_para": "PASSO A",
              "motivo": "já se apresentou"
            }
          },
          "instrucoes": {
            "objetivo": "Se apresentar e capturar nome do lead",
            "o_que_fazer": "enviar_mensagem_e_aguardar_resposta",
            "mensagens_da_ia": [
              {
                "tipo": "texto",
                "conteudo": "Oi! Sou a Amanda, da SolucionaCon. Qual o seu nome?",
                "aguardar_segundos": 0
              }
            ],
            "decisoes": [
              {
                "numero": 1,
                "se_lead": "fornece nome",
                "entao_ir_para": "PASSO A",
                "prioridade": "alta"
              }
            ]
          },
          "controle": {
            "tentativas_maximas": 1,
            "campo_obrigatorio": false,
            "observacao": "nome é bonus, não obrigatório"
          },
          "_metadata": {
            "posicao_canvas": { "x": 100, "y": 200 },
            "id_original_node": "1",
            "tipo_tecnico": "start"
          }
        }
      ]
    },
    {
      "passo_id": "PASSO A",
      "passo_nome": "APRESENTAÇÃO DO SERVIÇO",
      "condicao": "Após primeiro contato",
      "variacoes": [
        {
          "variacao_id": "A1",
          "variacao_nome": "EXPLICAÇÃO DA SOLUCIONACON",
          "validacao": {
            "verificar_antes_de_executar": true,
            "verificar_no_contexto": "se já explicou o serviço em mensagens ENVIADA",
            "se_ja_feito": {
              "pular_para": "PASSO B",
              "motivo": "já explicou o serviço"
            }
          },
          "instrucoes": {
            "objetivo": "Explicar serviço e identificar situação do consórcio",
            "o_que_fazer": "fazer_pergunta_e_aguardar_resposta",
            "mensagem_principal": {
              "com_nome": "Prazer [NOME]! A gente ajuda pessoas com questões de consórcio.",
              "sem_nome": "A SolucionaCon ajuda pessoas com questões de consórcio."
            },
            "pergunta": "Você cancelou, parou de pagar ou ainda está pagando algum consórcio?",
            "regra_critica": "NUNCA REPETIR PERGUNTA SOBRE SITUAÇÃO DO CONSÓRCIO SE JÁ RESPONDEU",
            "importante": "NUNCA fazer confirmações robóticas. Ir DIRETO ao próximo passo.",
            "decisoes_diretas": [
              {
                "numero": 1,
                "se_cliente_falar": "cancelei",
                "comportamento": "RESPOSTA COMPLETA - IR DIRETO",
                "entao_ir_para": "PASSO B",
                "sem_confirmacao": true
              }
            ]
          },
          "controle": {
            "tentativas_maximas": 1,
            "campo_obrigatorio": true
          },
          "_metadata": {
            "posicao_canvas": { "x": 400, "y": 200 },
            "id_original_node": "2",
            "tipo_tecnico": "ask_question"
          }
        }
      ]
    }
  ],
  "conexoes": [
    {
      "id": "c1",
      "origem": "1",
      "destino": "2",
      "tipo": "fluxo_principal"
    }
  ],
  "informacoes_fluxo": {
    "versao": "1.0",
    "criado_em": "2025-10-08T15:00:00.000Z",
    "atualizado_em": "2025-10-08T15:30:00.000Z"
  }
}
```

---

## ✅ Checklist de Implementação

- [x] Estrutura 100% em português
- [x] Interface TypeScript completa
- [x] Conversão ReactFlow → JSONB PT
- [x] Conversão JSONB PT → ReactFlow
- [x] Retrocompatibilidade com formato antigo
- [x] Documentação de todos os 15 blocos
- [x] Suporte a validação com `se_ja_feito`
- [x] Suporte a decisões diretas sem confirmação
- [x] Suporte a mensagens condicionais (com_nome/sem_nome)
- [x] Mapeamento automático de `o_que_fazer`

---

**FIM DA DOCUMENTAÇÃO**
