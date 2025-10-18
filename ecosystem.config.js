module.exports = {
  apps: [
    {
      name: 'whatsapp-server',
      script: 'server.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '4G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
        NODE_OPTIONS: '--max-old-space-size=4096',
        WHATSAPP_PROXY_URL: 'http://smart-bmfoc0zw64s7_area-BR:clyJsvok3BF0iIBG@proxy.smartproxy.net:3120'
      }
    },
    {
      name: 'message-worker', 
      script: 'src/workers/message-worker.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3002,
        NODE_OPTIONS: '--max-old-space-size=2048'
      }
    },
    {
      name: 'webhook-worker',
      script: 'src/workers/webhook-worker.js', 
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3003,
        NODE_OPTIONS: '--max-old-space-size=2048'
      }
    },
    {
      name: 'broadcast-worker',
      script: 'src/workers/broadcast-worker.js',
      instances: 1,
      exec_mode: 'fork', 
      max_memory_restart: '2G',
      env: {
        NODE_ENV: 'production',
        PORT: 3004,
        NODE_OPTIONS: '--max-old-space-size=2048'
      }
    },
    {
      name: 'readmessages-worker',
      script: 'src/workers/readmessages-worker.js',
      instances: 1,
      exec_mode: 'fork',
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3005,
        NODE_OPTIONS: '--max-old-space-size=1024'
      }
    }
  ]
};
