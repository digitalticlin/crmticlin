# 🔍 ANÁLISE DA CORRUPÇÃO NUMÉRICA

## 📊 **DADOS DO PROBLEMA**
- **Número correto:** `556281364997` (Brasil - Goiás)
- **Número salvo:** `92045460951243` (aparenta ser Paquistão +92)
- **Nome no card:** `92045460951243@lid`
- **Display no chat:** `+92 (04) 54609-51243`

## 🧮 **ANÁLISE MATEMÁTICA DA TRANSFORMAÇÃO**

### Número Original: `556281364997`
- **Código país:** 55 (Brasil)
- **DDD:** 62 (Goiás)
- **Número:** 81364997
- **Formato correto:** +55 (62) 8136-4997

### Número Corrompido: `92045460951243`
- **Aparente código:** 92 (Paquistão)
- **Resto:** 045460951243
- **Length:** 14 dígitos (muito longo)

## 🔍 **HIPÓTESES DE CORRUPÇÃO**

### Hipótese 1: Problema na função `format_brazilian_phone()`
```sql
-- Input: "556281364997"
-- Se a função falhou na validação e tentou reformatar
-- Pode ter acontecido uma corrupção durante o processamento
```

### Hipótese 2: Corrupção no payload do webhook
```javascript
// Se o payload chegou já corrompido do WhatsApp
// Talvez problema na API da VPS ou no formato da mensagem
```

### Hipótese 3: Problema de encoding/caracteres
```
// Possível problema de encoding UTF-8 ou conversão de string
// Que pode ter alterado os bytes dos números
```

## 🎯 **PADRÕES A INVESTIGAR**

1. **Timestamp:** Quando esse lead foi criado?
2. **Instância:** Qual instância WhatsApp recebeu a mensagem?
3. **Payload original:** Como chegou no webhook?
4. **Outros casos:** Existem mais leads com padrão similar?

## 🧪 **TESTES NECESSÁRIOS**

1. **Teste da função SQL:**
   ```sql
   SELECT format_brazilian_phone('556281364997');
   ```

2. **Busca por padrão:**
   ```sql
   SELECT * FROM leads WHERE name LIKE '%@lid%';
   ```

3. **Logs do webhook:**
   ```sql
   SELECT * FROM sync_logs WHERE function_name = 'webhook_whatsapp_web'
   ORDER BY created_at DESC LIMIT 10;
   ```

## 🚨 **POSSÍVEL CAUSA**

Baseado no padrão `@lid`, suspeito que:
1. O número chegou já corrompido no webhook
2. A função `format_brazilian_phone()` não conseguiu processar
3. O sistema salvou um valor "default" ou corrompido
4. O sufixo `@lid` pode ser um artefato de algum processamento

**PRÓXIMO PASSO:** Executar as consultas SQL para confirmar a hipótese.