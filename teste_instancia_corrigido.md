# COMANDOS PARA TESTAR CRIAÇÃO DE INSTÂNCIA NA VPS

## 📊 **ANÁLISE DO COMPORTAMENTO IDENTIFICADO:**

### ✅ **Instâncias existem fisicamente:**
- **16 sessões** em `/root/whatsapp-server/sessions/`
- **3 auth** em `/root/whatsapp-server/auth/`
- Mas **0 instâncias ativas** na API

### 🔍 **COMPORTAMENTO DO BAILEYS:**
1. **Cria sessão** → Diretório em `/sessions/instanceId/`
2. **Mantém instância ativa** → Somente enquanto conectada ou tentando conectar
3. **Remove da lista** → Após falha de conexão ou logout
4. **Preserva sessão** → Diretório permanece para reconexão futura

## 🧪 **TESTE CORRETO:**

```bash
# 1. Criar instância com JSON válido
ssh root@31.97.24.222 'curl -X POST http://localhost:3002/instance/create -H "Content-Type: application/json" -d "{\"instanceId\": \"teste_final_correto\"}"'

# 2. Verificar se apareceu na lista (imediatamente)
ssh root@31.97.24.222 'curl -s http://localhost:3002/instances'

# 3. Aguardar QR ser gerado (3-5 segundos)
ssh root@31.97.24.222 'sleep 5 && curl -s http://localhost:3002/instance/teste_final_correto/qr | head -c 50'

# 4. Verificar status após QR
ssh root@31.97.24.222 'curl -s http://localhost:3002/instances'

# 5. Verificar logs em tempo real
ssh root@31.97.24.222 'pm2 logs whatsapp-server --lines 10'
```

## 📋 **RESULTADO ESPERADO:**

1. **Criação:** Status 200 + "Instância criada com sucesso"
2. **Lista inicial:** 1 instância com status "connecting"
3. **QR gerado:** Base64 do QR code
4. **Lista final:** 1 instância com status "qr_generated"
5. **Webhook:** Deve enviar para Supabase (verificar logs)

## ❌ **SE INSTÂNCIA SUMIR DA LISTA:**

Significa que o Baileys está **removendo automaticamente** instâncias que:
- Falham ao conectar
- Não conseguem gerar QR
- Excedem tentativas de reconexão (3 máximo)

## 🔧 **SOLUÇÃO PARA PERSISTÊNCIA:**

Se instâncias somem, precisamos:
1. **Aumentar timeout** de reconexão
2. **Manter instâncias** mesmo desconectadas
3. **Verificar logs** para erro específico 