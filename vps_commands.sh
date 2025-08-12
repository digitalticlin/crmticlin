#!/bin/bash
# COMANDOS PARA CORRIGIR VPS WHATSAPP - EXECUTE PASSO A PASSO

echo "🚨 CORREÇÃO URGENTE DO LOOP WHATSAPP WEB.JS"
echo "📅 $(date)"
echo ""

echo "1️⃣ CONECTAR NA VPS:"
echo "ssh root@31.97.163.57"
echo ""

echo "2️⃣ BACKUP DE SEGURANÇA:"
echo "cd /root"
echo "cp -r supabase supabase-backup-\$(date +%Y%m%d_%H%M%S)"
echo "cp -r whatsapp-server whatsapp-server-backup-\$(date +%Y%m%d_%H%M%S)"
echo ""

echo "3️⃣ PARAR SERVIDOR ATUAL:"
echo "pkill -f \"node.*server\""
echo "pm2 stop all 2>/dev/null || true"
echo "ps aux | grep node"
echo ""

echo "4️⃣ CORRIGIR WEBHOOK (copie o conteúdo do arquivo corrected_auto_whatsapp_sync_index.ts):"
echo "cat > /root/supabase/functions/auto_whatsapp_sync/index.ts << 'EOF'"
echo "# COLE AQUI O CONTEÚDO DO ARQUIVO corrected_auto_whatsapp_sync_index.ts"
echo "EOF"
echo ""

echo "5️⃣ REINICIAR SERVIDOR:"
echo "cd /root/whatsapp-server"
echo "nohup node server.js > server.log 2>&1 &"
echo "sleep 3"
echo ""

echo "6️⃣ VERIFICAR STATUS:"
echo "curl -s http://localhost:3001/health | jq '.'"
echo "curl -s http://localhost:3001/status | jq '.instances | length'"
echo ""

echo "7️⃣ LIMPAR INSTÂNCIAS COM STATUS UNKNOWN:"
cat << 'EOF'
# Execute este comando no banco Supabase (Dashboard -> SQL Editor):
UPDATE whatsapp_instances 
SET connection_status = 'disconnected', 
    web_status = 'disconnected',
    updated_at = now()
WHERE connection_status = 'unknown' 
   OR web_status = 'unknown';
EOF
echo ""

echo "8️⃣ MONITORAR LOGS:"
echo "tail -f /root/whatsapp-server/server.log"
echo ""
echo "✅ CORREÇÕES APLICADAS - O LOOP DEVE PARAR!"