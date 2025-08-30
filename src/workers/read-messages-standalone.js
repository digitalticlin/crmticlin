#!/usr/bin/env node
// 📱 READ MESSAGES WORKER STANDALONE
// Worker dedicado para processamento de read messages em processo separado

require("dotenv").config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(express.json({ limit: '10mb' }));
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
});

// Autenticação
const VPS_AUTH_TOKEN = process.env.VPS_API_TOKEN;
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const apiTokenHeader = req.headers['x-api-token'];
  const token = authHeader?.split(' ')[1] || apiTokenHeader;

  if (req.path === '/health' || req.path === '/status') {
    return next();
  }

  if (!token || token !== VPS_AUTH_TOKEN) {
    return res.status(401).json({
      success: false,
      error: 'Token de autenticação inválido ou ausente'
    });
  }

  next();
}

// Simulação de instâncias conectadas (conecta com servidor principal)
const connectedInstances = new Map();

// Fila de processamento
const readMessagesQueue = new Map();
let processing = false;

console.log('📱 READ MESSAGES WORKER INICIADO');
console.log(`🔧 Porta: ${PORT}`);
console.log(`🔐 Auth: ${VPS_AUTH_TOKEN ? 'Configurado' : 'NÃO CONFIGURADO'}`);

// ================================
// FUNCIONALIDADES PRINCIPAIS
// ================================

// Processar fila a cada 3 segundos
setInterval(() => {
  if (!processing && readMessagesQueue.size > 0) {
    processReadQueue();
  }
}, 3000);

// Processar fila de read messages
async function processReadQueue() {
  if (readMessagesQueue.size === 0) return;

  processing = true;
  const logPrefix = '[ReadWorker]';
  
  try {
    console.log(`${logPrefix} 🔄 Processando fila - ${readMessagesQueue.size} itens`);

    const processedItems = [];

    for (const [queueKey, queueItem] of readMessagesQueue.entries()) {
      const { instanceId, chatJid, messageIds, userId, timestamp } = queueItem;

      // Verificar se não está muito antigo (timeout de 5 minutos)
      if (Date.now() - timestamp > 300000) {
        console.log(`${logPrefix} ⏰ Item expirado: ${queueKey}`);
        readMessagesQueue.delete(queueKey);
        continue;
      }

      try {
        // Comunicar com servidor principal para executar readMessages
        const success = await executeReadMessagesOnMainServer(instanceId, chatJid, Array.from(messageIds));
        
        if (success) {
          console.log(`${logPrefix} ✅ Processado: ${queueKey} (${messageIds.size} mensagens)`);
          readMessagesQueue.delete(queueKey);
          processedItems.push(queueKey);
        } else {
          console.log(`${logPrefix} ❌ Falha ao processar: ${queueKey}`);
        }

      } catch (error) {
        console.error(`${logPrefix} ❌ Erro ao processar ${queueKey}:`, error.message);
      }

      // Processar no máximo 3 itens por vez
      if (processedItems.length >= 3) {
        break;
      }
    }

    if (processedItems.length > 0) {
      console.log(`${logPrefix} 📊 Lote processado: ${processedItems.length} itens`);
    }

  } catch (error) {
    console.error(`${logPrefix} ❌ Erro ao processar fila:`, error);
  } finally {
    processing = false;
  }
}

// Executar readMessages no servidor principal via comunicação interna
async function executeReadMessagesOnMainServer(instanceId, chatJid, messageIds) {
  try {
    const axios = require('axios');
    
    // Fazer requisição para o servidor principal
    const response = await axios.post(`http://localhost:3001/instance/${instanceId}/mark-read-messages`, {
      phone: chatJid,
      message_ids: messageIds,
      user_id: null,
      source: 'read-messages-worker'
    }, {
      headers: {
        'Authorization': `Bearer ${VPS_AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      },
      timeout: 10000
    });

    return response.data.success;

  } catch (error) {
    console.error('❌ Erro na comunicação com servidor principal:', error.message);
    return false;
  }
}

// ================================
// ENDPOINTS DO WORKER
// ================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    worker: 'read-messages-worker',
    port: PORT,
    queueSize: readMessagesQueue.size,
    processing,
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Status detalhado
app.get('/status', (req, res) => {
  const queueItems = [];
  for (const [key, item] of readMessagesQueue.entries()) {
    queueItems.push({
      key,
      instanceId: item.instanceId,
      chatJid: item.chatJid,
      messageCount: item.messageIds.size,
      userId: item.userId,
      timestamp: item.timestamp,
      age: Date.now() - item.timestamp
    });
  }

  res.json({
    success: true,
    worker: 'read-messages-worker',
    port: PORT,
    queue: {
      size: readMessagesQueue.size,
      processing,
      items: queueItems
    },
    stats: {
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  });
});

// Adicionar à fila de read messages
app.post('/queue/add-read-messages', authenticateToken, (req, res) => {
  const { instanceId, chatJid, messageIds, userId } = req.body;

  if (!instanceId || !chatJid || !messageIds || !Array.isArray(messageIds)) {
    return res.status(400).json({
      success: false,
      error: 'instanceId, chatJid e messageIds (array) são obrigatórios'
    });
  }

  try {
    const queueKey = `${instanceId}:${chatJid}`;
    
    // Inicializar ou atualizar item na fila
    if (!readMessagesQueue.has(queueKey)) {
      readMessagesQueue.set(queueKey, {
        instanceId,
        chatJid,
        messageIds: new Set(),
        userId,
        timestamp: Date.now()
      });
    }

    // Adicionar message IDs
    const queueItem = readMessagesQueue.get(queueKey);
    messageIds.forEach(id => queueItem.messageIds.add(id));
    queueItem.timestamp = Date.now();

    console.log(`📥 [ReadWorker] Adicionado à fila: ${queueKey} (${messageIds.length} mensagens)`);

    res.json({
      success: true,
      message: 'Adicionado à fila de read messages',
      queueKey,
      messagesAdded: messageIds.length,
      totalInQueue: queueItem.messageIds.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [ReadWorker] Erro ao adicionar à fila:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao adicionar à fila',
      message: error.message
    });
  }
});

// Obter estatísticas da fila
app.get('/queue/stats', authenticateToken, (req, res) => {
  const stats = {
    queueSize: readMessagesQueue.size,
    processing,
    totalMessages: 0,
    oldestItem: null,
    newestItem: null
  };

  let oldestTimestamp = Date.now();
  let newestTimestamp = 0;

  for (const [key, item] of readMessagesQueue.entries()) {
    stats.totalMessages += item.messageIds.size;
    
    if (item.timestamp < oldestTimestamp) {
      oldestTimestamp = item.timestamp;
      stats.oldestItem = { key, timestamp: item.timestamp, age: Date.now() - item.timestamp };
    }
    
    if (item.timestamp > newestTimestamp) {
      newestTimestamp = item.timestamp;
      stats.newestItem = { key, timestamp: item.timestamp, age: Date.now() - item.timestamp };
    }
  }

  res.json({
    success: true,
    stats,
    timestamp: new Date().toISOString()
  });
});

// Limpar fila
app.delete('/queue/clear', authenticateToken, (req, res) => {
  const clearedItems = readMessagesQueue.size;
  readMessagesQueue.clear();
  processing = false;

  console.log(`🧹 [ReadWorker] Fila limpa: ${clearedItems} itens`);

  res.json({
    success: true,
    message: 'Fila limpa',
    itemsCleared: clearedItems,
    timestamp: new Date().toISOString()
  });
});

// ================================
// INICIALIZAÇÃO
// ================================

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 [ReadWorker] Encerrando worker...');
  processing = false;
  readMessagesQueue.clear();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ [ReadWorker] Exceção não capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [ReadWorker] Promise rejeitada:', reason);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ READ MESSAGES WORKER ONLINE!');
  console.log(`🚀 Worker rodando na porta ${PORT}`);
  console.log(`📡 Comunicação com servidor principal: localhost:3001`);
  console.log(`📋 Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /status - Status detalhado`);
  console.log(`   POST /queue/add-read-messages - Adicionar à fila`);
  console.log(`   GET  /queue/stats - Estatísticas da fila`);
  console.log(`   DELETE /queue/clear - Limpar fila`);
  console.log('🔄 Processamento automático a cada 3 segundos');
});

module.exports = { app, readMessagesQueue };