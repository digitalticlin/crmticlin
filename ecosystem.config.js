// PM2 ECOSYSTEM CONFIGURATION - MÚLTIPLOS WORKERS
module.exports = {
  apps: [
    {
      // SERVIDOR PRINCIPAL WHATSAPP
      name: 'whatsapp-server',
      script: 'src/utils/server.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001
      },
      error_file: './logs/whatsapp-server-error.log',
      out_file: './logs/whatsapp-server-out.log',
      log_file: './logs/whatsapp-server.log',
      time: true
    },
    {
      // WORKER EXCLUSIVO PARA READ MESSAGES
      name: 'read-messages-worker', 
      script: 'src/workers/read-messages-standalone.js',
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'read-messages',
        PORT: 3002
      },
      error_file: './logs/read-messages-error.log',
      out_file: './logs/read-messages-out.log',
      log_file: './logs/read-messages.log',
      time: true
    },
    {
      // WORKER PARA PROCESSAMENTO DE MEDIA/FILES
      name: 'media-processor-worker',
      script: 'src/workers/media-processor-standalone.js', 
      exec_mode: 'fork',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        WORKER_TYPE: 'media-processor',
        PORT: 3003
      },
      error_file: './logs/media-processor-error.log',
      out_file: './logs/media-processor-out.log', 
      log_file: './logs/media-processor.log',
      time: true
    }
  ]
};