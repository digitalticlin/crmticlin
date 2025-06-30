# ✅ TESTE DE CONVERSAS BILATERAIS - WHATSAPP CRM

## 🎯 **Objetivo**
Verificar se as correções implementadas permitem conversas bilaterais (incoming + outgoing) no chat WhatsApp.

## 🔧 **Correções Aplicadas**

### 1. **Webhook Principal** (`supabase/functions/webhook_whatsapp_web/index.ts`)
- ✅ Removido filtro que ignorava mensagens `fromMe: true`
- ✅ Implementada lógica completa de criação/atualização de leads
- ✅ Salvamento correto de mensagens incoming e outgoing
- ✅ Status apropriado baseado na direção (`sent` vs `received`)

### 2. **Webhook Evolution** (`supabase/functions/webhook_evolution/services/messageService.ts`)
- ✅ Preservado campo `from_me` corretamente
- ✅ Status dinâmico baseado na direção da mensagem

### 3. **Script VPS** (`corrigir-webhooks-vps.sh`)
- ✅ Removido filtro `if (message.key.fromMe) continue;`
- ✅ Logs melhorados para mostrar direção das mensagens
- ✅ Payload completo enviado para webhook

## 🧪 **PLANO DE TESTE**

### **Fase 1: Teste Básico**
1. **Conectar instância WhatsApp na VPS**
   - Verificar se conecta sem erros
   - Confirmar que webhook está configurado

2. **Teste Incoming Message**
   - Enviar mensagem de um número externo para a instância
   - Verificar nos logs VPS se mensagem foi capturada
   - Confirmar se webhook foi chamado
   - Verificar se lead foi criado/atualizado no Supabase
   - Confirmar se mensagem aparece no chat CRM com `from_me: false`

3. **Teste Outgoing Message**
   - Enviar mensagem através do CRM para um lead
   - Verificar nos logs VPS se mensagem foi capturada
   - Confirmar se webhook foi chamado  
   - Verificar se mensagem foi salva no Supabase com `from_me: true`
   - Confirmar se mensagem aparece no chat CRM

### **Fase 2: Teste de Conversa Bilateral**
1. **Simular conversa completa:**
   ```
   Lead: "Olá, preciso de ajuda"     (incoming)
   User: "Claro! Como posso ajudar?"  (outgoing)
   Lead: "Quero saber sobre preços"   (incoming) 
   User: "Envio a tabela agora"       (outgoing)
   ```

2. **Verificações:**
   - ✅ Todas as 4 mensagens aparecem no chat CRM
   - ✅ Direção correta (incoming vs outgoing)
   - ✅ Ordem cronológica mantida
   - ✅ Lead atualizado corretamente

### **Fase 3: Verificação no Banco**
```sql
-- Verificar mensagens do lead
SELECT 
    text,
    from_me,
    status,
    timestamp,
    created_at
FROM messages 
WHERE lead_id = 'LEAD_ID_AQUI'
ORDER BY timestamp;
```

## 🐛 **POSSÍVEIS PROBLEMAS E SOLUÇÕES**

### **Problema: Mensagens outgoing não aparecem**
- **Causa:** VPS ainda filtrando `fromMe: true`
- **Solução:** Verificar logs VPS e confirmar remoção do filtro

### **Problema: Campo from_me sempre false**
- **Causa:** Webhook não preservando valor original
- **Solução:** Verificar payload enviado pela VPS

### **Problema: Mensagens duplicadas**
- **Causa:** Múltiplos webhooks sendo chamados
- **Solução:** Verificar configuração de webhook na VPS

## 📋 **CHECKLIST FINAL**

- [ ] Pull realizado com sucesso
- [ ] Correções aplicadas nos webhooks
- [ ] Script VPS corrigido
- [ ] Teste incoming message
- [ ] Teste outgoing message  
- [ ] Conversa bilateral funcionando
- [ ] Banco de dados consistente
- [ ] Interface do chat exibindo corretamente

## 🚀 **PRÓXIMOS PASSOS**
1. Executar testes em ambiente de desenvolvimento
2. Validar funcionalidade completa
3. Deploy para produção se tudo estiver funcionando
4. Monitorar logs por 24h para garantir estabilidade

---
**Data:** $(date)
**Status:** Pronto para teste
**Responsável:** AI Assistant 