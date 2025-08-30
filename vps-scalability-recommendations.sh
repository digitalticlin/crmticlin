#!/bin/bash

# 🎯 RECOMENDAÇÕES DE ESCALABILIDADE - IMPLEMENTAÇÃO PRÁTICA
# Baseado nos resultados da auditoria

echo "🚀 RECOMENDAÇÕES DE ESCALABILIDADE VPS"
echo "======================================================"

VPS_SERVER="root@vpswhatsapp"
VPS_PATH="~/whatsapp-server"

# ============================================================
# 1. IMPLEMENTAR SISTEMA DE FILAS (REDIS/BULL)
# ============================================================

echo ""
echo "🔄 1. IMPLEMENTAR SISTEMA DE FILAS"
echo "======================================================"

cat << 'EOF'
📋 NECESSÁRIO PARA ESCALA:

1. Redis Server para filas:
   sudo apt update
   sudo apt install redis-server
   sudo systemctl enable redis-server
   sudo systemctl start redis-server

2. Instalar dependências de fila:
   npm install bull ioredis
   npm install bull-board  # Dashboard de filas

3. Implementar filas para:
   ✅ Processamento de mensagens
   ✅ Envio de webhooks
   ✅ Profile pic downloads
   ✅ Media processing
   ✅ Cleanup tasks

CÓDIGO EXEMPLO (message-queue.js):
```javascript
const Queue = require('bull');
const Redis = require('ioredis');

const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

// Filas separadas por tipo
const messageQueue = new Queue('message processing', { redis });
const webhookQueue = new Queue('webhook delivery', { redis });
const mediaQueue = new Queue('media processing', { redis });

// Configurações de concorrência
messageQueue.process(10, require('./processors/message-processor'));
webhookQueue.process(5, require('./processors/webhook-processor'));
mediaQueue.process(3, require('./processors/media-processor'));
```
EOF

# ============================================================
# 2. CLUSTER MODE E LOAD BALANCING
# ============================================================

echo ""
echo "⚖️ 2. CLUSTER MODE E LOAD BALANCING"
echo "======================================================"

cat << 'EOF'
🏗️ IMPLEMENTAR CLUSTER:

1. PM2 Cluster Mode:
   pm2 delete server
   pm2 start ecosystem.config.js

2. Configuração ecosystem.config.js:
```javascript
module.exports = {
  apps: [{
    name: 'whatsapp-server',
    script: 'server.js',
    instances: 0,  // Usar todos os CPU cores
    exec_mode: 'cluster',
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=2048',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
}
```

3. Nginx Load Balancer (se múltiplos servidores):
```nginx
upstream whatsapp_backend {
    server 127.0.0.1:3001;
    server 127.0.0.1:3002;
    server 127.0.0.1:3003;
}

server {
    listen 80;
    location / {
        proxy_pass http://whatsapp_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_cache_bypass $http_upgrade;
    }
}
```
EOF

# ============================================================
# 3. OTIMIZAÇÕES DE BANCO DE DADOS
# ============================================================

echo ""
echo "💾 3. OTIMIZAÇÕES DE BANCO DE DADOS"
echo "======================================================"

cat << 'EOF'
🗄️ CONNECTION POOLING:

1. Implementar connection pooling:
```javascript
const { createClient } = require('@supabase/supabase-js');

// Pool de conexões
const supabasePool = {
  read: createClient(SUPABASE_URL, SUPABASE_KEY, {
    db: { 
      pool: { min: 5, max: 20 },
      statement_timeout: 30000
    }
  }),
  write: createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    db: { 
      pool: { min: 2, max: 10 },
      statement_timeout: 60000
    }
  })
};
```

2. Batch Processing:
```javascript
const batchSize = 100;
const batches = chunk(messages, batchSize);

for (const batch of batches) {
  await supabase.from('messages').upsert(batch);
  await new Promise(resolve => setTimeout(resolve, 10)); // Rate limit
}
```

3. Indexes necessários no Supabase:
```sql
-- Otimizar queries de mensagens
CREATE INDEX IF NOT EXISTS idx_messages_lead_timestamp 
ON messages(lead_id, timestamp DESC);

-- Otimizar queries de leads
CREATE INDEX IF NOT EXISTS idx_leads_phone_instance 
ON leads(phone, whatsapp_number_id);

-- Otimizar queries de instâncias
CREATE INDEX IF NOT EXISTS idx_instances_user_status 
ON whatsapp_instances(created_by_user_id, connection_status);
```
EOF

# ============================================================
# 4. MONITORAMENTO E OBSERVABILIDADE
# ============================================================

echo ""
echo "📊 4. MONITORAMENTO E OBSERVABILIDADE"
echo "======================================================"

cat << 'EOF'
🔍 SISTEMA DE MONITORAMENTO:

1. Implementar métricas:
```javascript
const prometheus = require('prom-client');

// Métricas customizadas
const messagesProcessed = new prometheus.Counter({
  name: 'whatsapp_messages_processed_total',
  help: 'Total number of messages processed',
  labelNames: ['instance_id', 'type']
});

const processingDuration = new prometheus.Histogram({
  name: 'whatsapp_processing_duration_seconds',
  help: 'Duration of message processing',
  buckets: [0.1, 0.5, 1, 2, 5]
});
```

2. Health Checks avançados:
```javascript
app.get('/health/detailed', async (req, res) => {
  const health = {
    timestamp: new Date().toISOString(),
    status: 'ok',
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      instances: await checkInstances(),
      memory: process.memoryUsage(),
      uptime: process.uptime()
    }
  };
  
  const isHealthy = Object.values(health.checks).every(check => 
    typeof check === 'object' ? check.status === 'ok' : true
  );
  
  res.status(isHealthy ? 200 : 503).json(health);
});
```

3. Alertas automáticos:
   - CPU > 80% por 5 minutos
   - Memory > 90% por 2 minutos
   - Queue size > 10000 mensagens
   - Error rate > 5%
   - Response time > 30 segundos
EOF

# ============================================================
# 5. OTIMIZAÇÕES DE PERFORMANCE
# ============================================================

echo ""
echo "⚡ 5. OTIMIZAÇÕES DE PERFORMANCE"
echo "======================================================"

cat << 'EOF'
🚀 OTIMIZAÇÕES CRÍTICAS:

1. Memory Management:
```javascript
// Garbage Collection otimizada
if (global.gc && process.memoryUsage().heapUsed > 500 * 1024 * 1024) {
  global.gc();
}

// Cleanup periódico
setInterval(() => {
  // Limpar caches antigos
  clearOldProfilePics();
  clearExpiredSessions();
  
  // Forçar GC se necessário
  const usage = process.memoryUsage();
  if (usage.heapUsed / usage.heapTotal > 0.8) {
    global.gc && global.gc();
  }
}, 30000);
```

2. Rate Limiting:
```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 60 * 1000, // 1 minuto
  max: 1000, // 1000 requests por minuto por IP
  message: 'Too many requests',
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/send', limiter);
```

3. Caching Strategy:
```javascript
const NodeCache = require('node-cache');
const cache = new NodeCache({ stdTTL: 300 }); // 5 minutos

// Cache de instâncias
const getInstance = async (instanceId) => {
  const cacheKey = `instance:${instanceId}`;
  let instance = cache.get(cacheKey);
  
  if (!instance) {
    instance = await fetchInstanceFromDB(instanceId);
    cache.set(cacheKey, instance);
  }
  
  return instance;
};
```
EOF

# ============================================================
# 6. CONFIGURAÇÕES DO SISTEMA OPERACIONAL
# ============================================================

echo ""
echo "🖥️ 6. CONFIGURAÇÕES DO SISTEMA OPERACIONAL"
echo "======================================================"

cat << 'EOF'
⚙️ OTIMIZAÇÕES DO SO:

1. Aumentar limites de file descriptors:
```bash
# /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536

# /etc/systemd/system.conf
DefaultLimitNOFILE=65536
```

2. Otimizações de rede:
```bash
# /etc/sysctl.conf
net.core.somaxconn = 65535
net.core.netdev_max_backlog = 5000
net.core.rmem_max = 134217728
net.core.wmem_max = 134217728
net.ipv4.tcp_rmem = 4096 87380 134217728
net.ipv4.tcp_wmem = 4096 65536 134217728
net.ipv4.tcp_congestion_control = bbr
```

3. Memory management:
```bash
# /etc/sysctl.conf
vm.swappiness = 10
vm.dirty_ratio = 15
vm.dirty_background_ratio = 5
```

Aplicar: sudo sysctl -p
EOF

# ============================================================
# 7. IMPLEMENTAÇÃO STEP-BY-STEP
# ============================================================

echo ""
echo "📋 7. PLANO DE IMPLEMENTAÇÃO STEP-BY-STEP"
echo "======================================================"

cat << 'EOF'
🎯 ROADMAP DE IMPLEMENTAÇÃO:

FASE 1 - FUNDAÇÃO (Semana 1):
✅ Instalar Redis
✅ Implementar filas básicas
✅ Configurar PM2 cluster mode
✅ Adicionar monitoramento básico

FASE 2 - OTIMIZAÇÃO (Semana 2):
✅ Connection pooling
✅ Batch processing
✅ Rate limiting
✅ Caching layer

FASE 3 - OBSERVABILIDADE (Semana 3):
✅ Métricas detalhadas
✅ Dashboards
✅ Alertas automáticos
✅ Log aggregation

FASE 4 - ESCALA (Semana 4):
✅ Load balancing
✅ Horizontal scaling
✅ Auto-scaling
✅ Performance tuning

ESTIMATIVA DE CAPACIDADE PÓS-IMPLEMENTAÇÃO:
- 10,000+ usuários simultâneos
- 1M+ mensagens por dia
- 100+ instâncias WhatsApp
- 99.9% uptime
EOF

echo ""
echo "🚀 Execute vps-implementation-phase1.sh para começar!"
echo "======================================================"