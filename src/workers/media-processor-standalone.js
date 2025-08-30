#!/usr/bin/env node
// 🎬 MEDIA PROCESSOR WORKER STANDALONE
// Worker dedicado para processamento de mídia em processo separado

require("dotenv").config();
const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(express.json({ limit: '50mb' }));
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

// Fila de processamento de mídia
const mediaQueue = new Map();
let processingMedia = false;

console.log('🎬 MEDIA PROCESSOR WORKER INICIADO');
console.log(`🔧 Porta: ${PORT}`);
console.log(`🔐 Auth: ${VPS_AUTH_TOKEN ? 'Configurado' : 'NÃO CONFIGURADO'}`);

// ================================
// PROCESSAMENTO DE MÍDIA
// ================================

// Processar fila a cada 5 segundos
setInterval(() => {
  if (!processingMedia && mediaQueue.size > 0) {
    processMediaQueue();
  }
}, 5000);

// Processar fila de mídia
async function processMediaQueue() {
  if (mediaQueue.size === 0) return;

  processingMedia = true;
  const logPrefix = '[MediaWorker]';
  
  try {
    console.log(`${logPrefix} 🎬 Processando fila de mídia - ${mediaQueue.size} itens`);

    const processedItems = [];

    for (const [queueKey, queueItem] of mediaQueue.entries()) {
      const { type, data, timestamp } = queueItem;

      // Verificar se não está muito antigo (timeout de 10 minutos)
      if (Date.now() - timestamp > 600000) {
        console.log(`${logPrefix} ⏰ Item de mídia expirado: ${queueKey}`);
        mediaQueue.delete(queueKey);
        continue;
      }

      try {
        let success = false;

        switch (type) {
          case 'profile_pic':
            success = await processProfilePic(data);
            break;
          case 'image_optimization':
            success = await processImageOptimization(data);
            break;
          case 'video_processing':
            success = await processVideoProcessing(data);
            break;
          case 'document_processing':
            success = await processDocumentProcessing(data);
            break;
          default:
            console.log(`${logPrefix} ⚠️ Tipo de mídia não suportado: ${type}`);
            success = false;
        }
        
        if (success) {
          console.log(`${logPrefix} ✅ Processado: ${queueKey} (${type})`);
          mediaQueue.delete(queueKey);
          processedItems.push(queueKey);
        } else {
          console.log(`${logPrefix} ❌ Falha ao processar: ${queueKey}`);
        }

      } catch (error) {
        console.error(`${logPrefix} ❌ Erro ao processar ${queueKey}:`, error.message);
      }

      // Processar no máximo 2 itens por vez para evitar sobrecarga
      if (processedItems.length >= 2) {
        break;
      }
    }

    if (processedItems.length > 0) {
      console.log(`${logPrefix} 📊 Lote de mídia processado: ${processedItems.length} itens`);
    }

  } catch (error) {
    console.error(`${logPrefix} ❌ Erro ao processar fila de mídia:`, error);
  } finally {
    processingMedia = false;
  }
}

// Processar foto de perfil
async function processProfilePic(data) {
  try {
    console.log('📸 Processando foto de perfil...');
    // Implementar lógica de processamento de foto de perfil
    // Por enquanto, simular processamento
    await new Promise(resolve => setTimeout(resolve, 1000));
    return true;
  } catch (error) {
    console.error('❌ Erro no processamento de foto de perfil:', error);
    return false;
  }
}

// Processar otimização de imagem
async function processImageOptimization(data) {
  try {
    console.log('🖼️ Otimizando imagem...');
    // Implementar lógica de otimização de imagem
    await new Promise(resolve => setTimeout(resolve, 2000));
    return true;
  } catch (error) {
    console.error('❌ Erro na otimização de imagem:', error);
    return false;
  }
}

// Processar vídeo
async function processVideoProcessing(data) {
  try {
    console.log('🎥 Processando vídeo...');
    // Implementar lógica de processamento de vídeo
    await new Promise(resolve => setTimeout(resolve, 5000));
    return true;
  } catch (error) {
    console.error('❌ Erro no processamento de vídeo:', error);
    return false;
  }
}

// Processar documento
async function processDocumentProcessing(data) {
  try {
    console.log('📄 Processando documento...');
    // Implementar lógica de processamento de documento
    await new Promise(resolve => setTimeout(resolve, 1500));
    return true;
  } catch (error) {
    console.error('❌ Erro no processamento de documento:', error);
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
    worker: 'media-processor-worker',
    port: PORT,
    queueSize: mediaQueue.size,
    processing: processingMedia,
    uptime: Math.floor(process.uptime()),
    memory: process.memoryUsage(),
    timestamp: new Date().toISOString()
  });
});

// Status detalhado
app.get('/status', (req, res) => {
  const queueItems = [];
  for (const [key, item] of mediaQueue.entries()) {
    queueItems.push({
      key,
      type: item.type,
      timestamp: item.timestamp,
      age: Date.now() - item.timestamp
    });
  }

  res.json({
    success: true,
    worker: 'media-processor-worker',
    port: PORT,
    queue: {
      size: mediaQueue.size,
      processing: processingMedia,
      items: queueItems
    },
    stats: {
      uptime: Math.floor(process.uptime()),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString()
    }
  });
});

// Adicionar à fila de processamento de mídia
app.post('/queue/add-media', authenticateToken, (req, res) => {
  const { type, data } = req.body;

  if (!type || !data) {
    return res.status(400).json({
      success: false,
      error: 'type e data são obrigatórios'
    });
  }

  try {
    const queueKey = `${type}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    mediaQueue.set(queueKey, {
      type,
      data,
      timestamp: Date.now()
    });

    console.log(`🎬 [MediaWorker] Adicionado à fila: ${queueKey} (${type})`);

    res.json({
      success: true,
      message: 'Adicionado à fila de processamento de mídia',
      queueKey,
      type,
      queueSize: mediaQueue.size,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ [MediaWorker] Erro ao adicionar à fila:', error);
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
    queueSize: mediaQueue.size,
    processing: processingMedia,
    typeBreakdown: {}
  };

  for (const [key, item] of mediaQueue.entries()) {
    if (!stats.typeBreakdown[item.type]) {
      stats.typeBreakdown[item.type] = 0;
    }
    stats.typeBreakdown[item.type]++;
  }

  res.json({
    success: true,
    stats,
    timestamp: new Date().toISOString()
  });
});

// Limpar fila
app.delete('/queue/clear', authenticateToken, (req, res) => {
  const clearedItems = mediaQueue.size;
  mediaQueue.clear();
  processingMedia = false;

  console.log(`🧹 [MediaWorker] Fila de mídia limpa: ${clearedItems} itens`);

  res.json({
    success: true,
    message: 'Fila de mídia limpa',
    itemsCleared: clearedItems,
    timestamp: new Date().toISOString()
  });
});

// ================================
// INICIALIZAÇÃO
// ================================

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('🛑 [MediaWorker] Encerrando worker de mídia...');
  processingMedia = false;
  mediaQueue.clear();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('❌ [MediaWorker] Exceção não capturada:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ [MediaWorker] Promise rejeitada:', reason);
});

// Iniciar servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('✅ MEDIA PROCESSOR WORKER ONLINE!');
  console.log(`🚀 Worker rodando na porta ${PORT}`);
  console.log(`📋 Endpoints:`);
  console.log(`   GET  /health - Health check`);
  console.log(`   GET  /status - Status detalhado`);
  console.log(`   POST /queue/add-media - Adicionar à fila`);
  console.log(`   GET  /queue/stats - Estatísticas da fila`);
  console.log(`   DELETE /queue/clear - Limpar fila`);
  console.log('🔄 Processamento automático a cada 5 segundos');
});

module.exports = { app, mediaQueue };