#!/bin/bash
echo "🔧 ATUALIZANDO SERVIDOR PUPPETEER NA VPS"
echo "========================================"
echo ""
echo "📋 COMANDOS PARA EXECUTAR:"
echo ""
echo "1️⃣ Conectar na VPS:"
echo "   ssh root@31.97.163.57"
echo ""
echo "2️⃣ Navegar para o diretório:"
echo "   cd /opt/whatsapp-puppeteer"
echo ""
echo "3️⃣ Fazer backup do arquivo atual:"
echo "   cp server.js server.js.backup-$(date +%Y%m%d-%H%M%S)"
echo ""
echo "4️⃣ Parar servidor atual:"
echo "   pkill -f 'node server.js'"
echo ""
echo "5️⃣ Criar arquivo otimizado (cole o conteúdo do server-puppeteer-optimized.js):"
echo "   nano server-optimized.js"
echo ""
echo "6️⃣ Testar o novo servidor:"
echo "   node server-optimized.js"
echo ""
echo "7️⃣ Se funcionar, substituir o original:"
echo "   mv server.js server.js.old"
echo "   mv server-optimized.js server.js"
echo ""
echo "8️⃣ Iniciar servidor em background:"
echo "   nohup node server.js > server.log 2>&1 &"
echo ""
echo "9️⃣ Verificar se está rodando:"
echo "   curl http://localhost:3001/health"
echo ""
echo "🔟 Testar health check externo:"
echo "   curl http://31.97.163.57:3001/health"
echo ""
echo "📊 TESTES DE VALIDAÇÃO:"
echo ""
echo "A) Testar criação de instância:"
echo "   curl -X POST http://31.97.163.57:3001/create-instance \\"
echo "        -H 'Authorization: Bearer 8bb0c4f8a89d254783d693050ecd7ff4878534f46a87ece12b24f506548ce430' \\"
echo "        -H 'Content-Type: application/json' \\"
echo "        -d '{\"instanceId\": \"test_$(date +%s)\", \"webhookUrl\": \"https://rhjgagzstjzynvrakdyj.supabase.co/functions/v1/whatsapp_chat_import\"}'"
echo ""
echo "B) Verificar logs em tempo real:"
echo "   tail -f server.log"
echo ""
echo "C) Verificar sessões ativas:"
echo "   curl -H 'Authorization: Bearer 8bb0c4f8a89d254783d693050ecd7ff4878534f46a87ece12b24f506548ce430' \\"
echo "        http://31.97.163.57:3001/sessions"
echo ""
echo "✅ INDICADORES DE SUCESSO:"
echo "   - Health check retorna 'webhook_timing_fix: true'"
echo "   - Health check retorna 'qr_validation_enabled: true'"
echo "   - Health check retorna 'version: 2.0-OPTIMIZED'"
echo "   - Logs mostram 'QR Code VÁLIDO confirmado para webhook'"
echo "   - Webhook só é enviado quando status = 'qr_ready'" 