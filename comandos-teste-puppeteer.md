# 🚀 COMANDOS PARA TESTAR IMPLEMENTAÇÃO PUPPETEER

## 1️⃣ **LIMPAR SESSÕES DA VPS:**

```powershell
# Listar sessões existentes
powershell -Command "Invoke-RestMethod -Uri 'http://31.97.163.57:3001/sessions' -Method GET"

# Deletar cada sessão (substitua pelos IDs reais)
powershell -Command "Invoke-RestMethod -Uri 'http://31.97.163.57:3001/session/SESSION_ID_AQUI' -Method DELETE"
```

## 2️⃣ **LIMPAR BANCO DE DADOS:**

```powershell
# Limpar tabela instances_puppeteer
powershell -Command "Invoke-RestMethod -Uri 'https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_delete_puppeteer' -Method POST -ContentType 'application/json' -Body '{\"action\": \"cleanup_database\"}'"
```

## 3️⃣ **TESTAR HEALTH DA VPS:**

```powershell
# Verificar se VPS está funcionando
powershell -Command "Invoke-RestMethod -Uri 'http://31.97.163.57:3001/health' -Method GET"
```

## 4️⃣ **FLUXO DE TESTE:**

1. ✅ Execute os comandos de limpeza acima
2. ✅ Acesse a página de configurações do WhatsApp
3. ✅ Clique em "Importar Histórico Completo (Puppeteer)"
4. ✅ Observe as mensagens dinâmicas:
   - "Preparando importação..."
   - "Criando sessão na VPS..."
   - "Gerando QR Code..."
   - QR Code deve aparecer em até 50 segundos
5. ✅ Escaneie o QR Code com seu celular
6. ✅ Sistema deve detectar conexão e iniciar importação automaticamente
7. ✅ Barra de progresso deve aparecer
8. ✅ Pode fechar modal durante importação

## 5️⃣ **ENDPOINTS UTILIZADOS:**

- `POST /create-instance` - Criar instância na VPS
- `GET /session-status/:sessionId` - Verificar status
- `POST /start-import` - Iniciar importação
- Edge Function `whatsapp_chat_import` com action `poll_qr_status`

## 6️⃣ **MONITORAR LOGS:**

```powershell
# Monitorar logs da Edge Function
# (Supabase Dashboard > Edge Functions > Logs)

# Verificar status da sessão diretamente na VPS
powershell -Command "Invoke-RestMethod -Uri 'http://31.97.163.57:3001/session-status/SESSION_ID_AQUI' -Method GET"
``` 