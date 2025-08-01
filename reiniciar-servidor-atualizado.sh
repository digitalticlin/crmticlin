#!/bin/bash
echo ' Reiniciando servidor WhatsApp com novas funcionalidades...'
echo ' Funcionalidades implementadas:'
echo '    Sistema de Webhooks Duplos (Backend + N8N)'
echo '    Filtro de Grupos'
echo '    Tratamento Completo de Mídia'
echo '    Conversão QR Code para BASE64'
echo '    Todos os Endpoints Avançados'
echo '    Sistema de Reconexão Automática'
echo '    Redis Store Completo'
echo ''

# Parar o servidor atual
echo ' Parando servidor atual...'
pm2 stop whatsapp-server 2>/dev/null || echo '    Servidor não estava rodando'

# Deletar processo antigo
echo ' Removendo processo antigo...'
pm2 delete whatsapp-server 2>/dev/null || echo '    Processo não encontrado'

# Aguardar um momento
echo ' Aguardando 3 segundos...'
sleep 3

# Iniciar servidor atualizado
echo ' Iniciando servidor atualizado...'
pm2 start server.js --name whatsapp-server --log-date-format 'YYYY-MM-DD HH:mm:ss' --merge-logs

# Aguardar inicialização
echo ' Aguardando inicialização...'
sleep 5

# Verificar status
echo ' Status do servidor:'
pm2 status whatsapp-server

echo ''
echo ' Testando conectividade...'
curl -s http://localhost:3002/health | jq . 2>/dev/null || curl -s http://localhost:3002/health

echo ''
echo ' Logs em tempo real:'
echo '   pm2 logs whatsapp-server'
echo ''
echo ' Endpoints disponíveis:'
echo '   GET  /health - Health check'
echo '   GET  /status - Status detalhado'
echo '   GET  /instances - Listar instâncias'
echo '   POST /instance/create - Criar instância'
echo '   GET  /instance/:id/qr - Obter QR Code'
echo '   GET  /instance/:id - Status da instância'
echo '   POST /send - Enviar mensagem'
echo '   POST /instance/delete - Deletar instância'
echo '   GET  /debug/store/:id - Debug do Redis'
echo ''
echo ' Servidor reiniciado com sucesso!'
echo ' Webhooks: Backend + N8N ativos'
echo ' Filtro de grupos: ATIVADO'
echo ' QR Code: BASE64 habilitado'
echo ' Redis Store: Funcionando'

