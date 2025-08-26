root@vpswhatsapp:~# #!/bin/bash

# 📱 SCRIPT ADICIONAL: Monitoramento Específico de Instâncias WhatsApp
# Execute na VPS: bash monitor_instances_vps.sh

echo "📱 MONITORAMENTO INSTÂNCIAS WHATSAPP - VPS"
echo "=========================================="

# 1. Verificar API do servidor
echo "🌐 Testando API principal..."
curl -s http://localhost:3001/health | jq . 2>/dev/null || echo "⚠️ API não está respondendo ou jq não instalado"

# 2. Listar todas as instâncias via API
echo ""
echo "📋 INSTÂNCIAS REGISTRADAS VIA API:"
curl -s http://localhost:3001/instances | jq . 2>/dev/null || curl -s http://localhost:3001/instances

# 3. Verificar pastas de autenticação física
echo ""
echo "📁 PASTAS DE AUTENTICAÇÃO (AUTH_INFO):"
echo "====================================="
ls -la /root/whatsapp-server/auth_info/ | grep ^d | while read -r line; do
    folder=$(echo $line | awk '{print $9}')
    if [[ "$folder" != "." && "$folder" != ".." ]]; then
        size=$(du -sh "/root/whatsapp-server/auth_info/$folder" 2>/dev/null | cut -f1)
        files=$(ls -1 "/root/whatsapp-server/auth_info/$folder" 2>/dev/null | wc -l)
        echo "📂 $folder - Tamanho: $size - Arquivos: $files"
    fi
done

echo "🧹 Limpar auth pasta:   rm -rf /root/whatsapp-server/auth_info/INSTANCE_ID"E_ID/qr"|timeout" | tail -10 || echo "
📱 MONITORAMENTO INSTÂNCIAS WHATSAPP - VPS
==========================================
🌐 Testando API principal...
{
  "status": "ok",
  "timestamp": "2025-08-26T00:04:03.897Z",
  "port": "3001",
  "server": "WhatsApp Server Robust Implementation",
  "version": "7.0.0-ROBUST-COMPLETE",
  "instances": {
    "total": 15,
    "active": 8,
    "connecting": 0,
    "error": 0
  },
  "system": {
    "uptime": 252,
    "memory": {
      "used": "33MB",
      "total": "43MB"
    },
    "crypto": "available"
  },
  "webhooks": {
    "configured": 4,
    "authenticated": true,
    "endpoints": {
      "QR_RECEIVER": "https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_qr_receiver",
      "BACKEND_MESSAGES": "https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_whatsapp_web",
      "N8N_MESSAGES": "https://novo-ticlin-n8n.eirfpl.easypanel.host/webhook/ticlingeral",
      "PROFILE_PIC": "https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/profile_pic_receiver"
    }
  },
  "directories": {
    "auth": "/root/whatsapp-server/auth_info",
    "exists": true
  }
}

📋 INSTÂNCIAS REGISTRADAS VIA API:
{
  "success": false,
  "error": "Token de autenticação inválido ou ausente",
  "timestamp": "2025-08-26T00:04:03.919Z"
}

📁 PASTAS DE AUTENTICAÇÃO (AUTH_INFO):
=====================================
📂 admcasaoficial - Tamanho: 8.4M - Arquivos: 1059
📂 admgeuniformes - Tamanho: 1.8M - Arquivos: 172
📂 admgeuniformes1 - Tamanho: 4.0K - Arquivos: 0
📂 admgeuniformes2 - Tamanho: 4.0K - Arquivos: 0
📂 alinyvalerias - Tamanho: 5.5M - Arquivos: 693
📂 contatoluizantoniooliveira - Tamanho: 16M - Arquivos: 1807
📂 digitalticlin - Tamanho: 14M - Arquivos: 1712
📂 digitalticlin1 - Tamanho: 4.0K - Arquivos: 0
📂 eneas - Tamanho: 6.5M - Arquivos: 805
📂 imperioesportegyn - Tamanho: 33M - Arquivos: 3579
📂 marketing - Tamanho: 3.3M - Arquivos: 370
📂 marketing1 - Tamanho: 4.0K - Arquivos: 0
📂 marketing1755188478427l9qlcv - Tamanho: 4.0K - Arquivos: 0
📂 mauroticlin - Tamanho: 14M - Arquivos: 1619
📂 paulamarisaames - Tamanho: 7.4M - Arquivos: 919

🔍 STATUS INDIVIDUAL DAS INSTÂNCIAS:
====================================
📱 Testando instância: admcasaoficial
   ✅ Resposta: {"success":true,"instanceId":"admcasaoficial","instanceName":"admcasaoficial","status":"connected","phone":"556296930849","profileName":"Igreja CASA","connected":true,"lastUpdate":"2025-08-25T23:59:53.537Z","connectionAttempts":0,"createdByUserId":null,"hasQrCode":false,"error":null,"timestamp":"2025-08-26T00:04:04.418Z","auth_persisted":true}
📱 Testando instância: admgeuniformes
   ✅ Resposta: {"success":true,"instanceId":"admgeuniformes","instanceName":"admgeuniformes","status":"connected","phone":"556299245728","profileName":"Comercial Grupo GE Ana Vitória","connected":true,"lastUpdate":"2025-08-25T23:59:52.944Z","connectionAttempts":0,"createdByUserId":null,"hasQrCode":false,"error":null,"timestamp":"2025-08-26T00:04:04.434Z","auth_persisted":true}
📱 Testando instância: admgeuniformes1
   ✅ Resposta: {"success":true,"instanceId":"admgeuniformes1","instanceName":"admgeuniformes1","status":"waiting_qr","phone":null,"profileName":null,"connected":false,"lastUpdate":"2025-08-26T00:03:48.327Z","connectionAttempts":1,"createdByUserId":null,"hasQrCode":true,"error":null,"timestamp":"2025-08-26T00:04:04.450Z","auth_persisted":true}
📱 Testando instância: admgeuniformes2
   ✅ Resposta: {"success":true,"instanceId":"admgeuniformes2","instanceName":"admgeuniformes2","status":"waiting_qr","phone":null,"profileName":null,"connected":false,"lastUpdate":"2025-08-26T00:03:48.467Z","connectionAttempts":1,"createdByUserId":null,"hasQrCode":true,"error":null,"timestamp":"2025-08-26T00:04:04.464Z","auth_persisted":true}
📱 Testando instância: alinyvalerias
   ✅ Resposta: {"success":true,"instanceId":"alinyvalerias","instanceName":"alinyvalerias","status":"connected","phone":"556296751559","profileName":"LePink Lingerie - Loja de Fábrica","connected":true,"lastUpdate":"2025-08-25T23:59:53.048Z","connectionAttempts":0,"createdByUserId":null,"hasQrCode":false,"error":null,"timestamp":"2025-08-26T00:04:04.480Z","auth_persisted":true}
📱 Testando instância: contatoluizantoniooliveira
   ✅ Resposta: {"success":true,"instanceId":"contatoluizantoniooliveira","instanceName":"contatoluizantoniooliveira","status":"logged_out","phone":null,"profileName":null,"connected":false,"lastUpdate":"2025-08-25T23:59:56.835Z","connectionAttempts":0,"createdByUserId":null,"hasQrCode":false,"error":null,"timestamp":"2025-08-26T00:04:04.494Z","auth_persisted":true}
📱 Testando instância: digitalticlin
   ✅ Resposta: {"success":true,"instanceId":"digitalticlin","instanceName":"digitalticlin","status":"connected","phone":"556286032824","profileName":"Inácio Jr Rua","connected":true,"lastUpdate":"2025-08-25T23:59:53.274Z","connectionAttempts":0,"createdByUserId":null,"hasQrCode":false,"error":null,"timestamp":"2025-08-26T00:04:04.507Z","auth_persisted":true}
📱 Testando instância: digitalticlin1
   ✅ Resposta: {"success":true,"instanceId":"digitalticlin1","instanceName":"digitalticlin1","status":"waiting_qr","phone":null,"profileName":null,"connected":false,"lastUpdate":"2025-08-26T00:03:48.604Z","connectionAttempts":1,"createdByUserId":null,"hasQrCode":true,"error":null,"timestamp":"2025-08-26T00:04:04.527Z","auth_persisted":true}
📱 Testando instância: eneas
   ✅ Resposta: {"success":true,"instanceId":"eneas","instanceName":"eneas","status":"connected","phone":"556282307903","profileName":"Marinho Associados","connected":true,"lastUpdate":"2025-08-25T23:59:53.039Z","connectionAttempts":0,"createdByUserId":null,"hasQrCode":false,"error":null,"timestamp":"2025-08-26T00:04:04.541Z","auth_persisted":true}
📱 Testando instância: imperioesportegyn
   ✅ Resposta: {"success":true,"instanceId":"imperioesportegyn","instanceName":"imperioesportegyn","status":"connected","phone":"556283448182","profileName":"Vinnicyus. Império FC","connected":true,"lastUpdate":"2025-08-25T23:59:53.456Z","connectionAttempts":0,"createdByUserId":null,"hasQrCode":false,"error":null,"timestamp":"2025-08-26T00:04:04.555Z","auth_persisted":true}
📱 Testando instância: marketing
   ✅ Resposta: {"success":true,"instanceId":"marketing","instanceName":"marketing","status":"connected","phone":"556232730114","profileName":"Marketing Cinoplan Cinotec","connected":true,"lastUpdate":"2025-08-25T23:59:53.045Z","connectionAttempts":0,"createdByUserId":null,"hasQrCode":false,"error":null,"timestamp":"2025-08-26T00:04:04.570Z","auth_persisted":true}
📱 Testando instância: marketing1
   ✅ Resposta: {"success":true,"instanceId":"marketing1","instanceName":"marketing1","status":"waiting_qr","phone":null,"profileName":null,"connected":false,"lastUpdate":"2025-08-26T00:03:48.883Z","connectionAttempts":1,"createdByUserId":null,"hasQrCode":true,"error":null,"timestamp":"2025-08-26T00:04:04.585Z","auth_persisted":true}
📱 Testando instância: marketing1755188478427l9qlcv
   ✅ Resposta: {"success":true,"instanceId":"marketing1755188478427l9qlcv","instanceName":"marketing1755188478427l9qlcv","status":"waiting_qr","phone":null,"profileName":null,"connected":false,"lastUpdate":"2025-08-26T00:03:48.667Z","connectionAttempts":1,"createdByUserId":null,"hasQrCode":true,"error":null,"timestamp":"2025-08-26T00:04:04.599Z","auth_persisted":true}
📱 Testando instância: mauroticlin
   ✅ Resposta: {"success":true,"instanceId":"mauroticlin","instanceName":"mauroticlin","status":"logged_out","phone":null,"profileName":null,"connected":false,"lastUpdate":"2025-08-25T23:59:55.156Z","connectionAttempts":0,"createdByUserId":null,"hasQrCode":false,"error":null,"timestamp":"2025-08-26T00:04:04.614Z","auth_persisted":true}
📱 Testando instância: paulamarisaames
   ✅ Resposta: {"success":true,"instanceId":"paulamarisaames","instanceName":"paulamarisaames","status":"connected","phone":"554991218300","profileName":"Paula Ames","connected":true,"lastUpdate":"2025-08-25T23:59:54.031Z","connectionAttempts":0,"createdByUserId":null,"hasQrCode":false,"error":null,"timestamp":"2025-08-26T00:04:04.628Z","auth_persisted":true}

📋 LOGS DE CONEXÃO WHATSAPP (últimas 15 linhas):
================================================
0|whatsapp | [Webhook QR] HTTP 404: {
0|whatsapp | [Webhook QR] HTTP 404: {
0|whatsapp | [ConnectionManager imperioesportegyn] ⚠️ Falha ao extrair mídia: Cannot derive from empty media key
0|whatsapp | [ConnectionManager digitalticlin1] 📱 QR Code gerado
0|whatsapp | [Webhook QR] Enviando para: https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_qr_receiver
0|whatsapp | [ConnectionManager marketing1755188478427l9qlcv] 🔄 Connection update: undefined
0|whatsapp | [ConnectionManager marketing1755188478427l9qlcv] 📱 QR Code gerado
0|whatsapp | [Webhook QR] Enviando para: https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_qr_receiver
0|whatsapp | [ConnectionManager marketing1] 🔄 Connection update: undefined
0|whatsapp | [ConnectionManager marketing1] 📱 QR Code gerado
0|whatsapp | [Webhook QR] Enviando para: https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/webhook_qr_receiver
0|whatsapp | [ConnectionManager imperioesportegyn] 🚫 Mensagem de grupo/broadcast ignorada: status@broadcast
0|whatsapp | [ConnectionManager imperioesportegyn] 📨 Nova mensagem de: 120363154081218773@newsletter (fromMe: false)

🚨 ERROS CRÍTICOS (últimas 10 ocorrências):
===========================================
/root/.pm2/logs/whatsapp-server-error.log last 50 lines:
0|whatsapp |   error: 'Instância não encontrada',
0|whatsapp |   error: 'Instância não encontrada',
0|whatsapp |   error: 'Instância não encontrada',
0|whatsapp |   error: 'Instância não encontrada',
0|whatsapp |   error: 'Instância não encontrada',
0|whatsapp |   error: 'Instância não encontrada',
0|whatsapp |   error: 'Instância não encontrada',
0|whatsapp |   error: 'Instância não encontrada',

💾 USO DE MEMÓRIA:
==================
root      217654  0.0  0.0   2804  1792 ?        S    Aug25   0:00 sh -c node server.js
root      217655  2.0  3.1 11762736 125696 ?     Sl   Aug25   0:05 node server.js

📊 RESUMO FINAL:
===============
🔢 Total de instâncias: 15
📊 Status PM2: fork
💾 Uso de memória: 60.0%
🌐 Servidor: http://31.97.163.57:3001

🛠️ COMANDOS DE DEBUG:
====================
🔍 Logs live:           pm2 logs whatsapp-server --lines 100
📱 Testar instância:    curl http://localhost:3001/instance/INSTANCE_ID/status
🔄 Gerar QR:            curl -X POST http://localhost:3001/instance/INSTANCE_ID/qr
📋 Listar instâncias:   curl http://localhost:3001/instances
🧹 Limpar auth pasta:   rm -rf /root/whatsapp-server/auth_info/INSTANCE_ID
root@vpswhatsapp:~#