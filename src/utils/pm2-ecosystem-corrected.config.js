
// PM2 Ecosystem Config - CORREÇÃO COMPLETA
module.exports = {
  apps: [{
    name: 'whatsapp-server',
    script: './whatsapp-server-corrected.js',
    instances: 1, // CORREÇÃO: Apenas 1 instância para evitar conflitos
    exec_mode: 'cluster',
    
    // CONFIGURAÇÕES DE RESTART OTIMIZADAS
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    restart_delay: 5000,
    max_restarts: 10,
    min_uptime: '10s',
    
    // LOGS CORRIGIDOS
    log_file: './logs/combined.log',
    out_file: './logs/output.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // VARIÁVEIS DE AMBIENTE
    env: {
      NODE_ENV: 'production',
      PORT: 3002,
      API_TOKEN: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3'
    },
    
    // CONFIGURAÇÕES DE PERFORMANCE
    node_args: [
      '--max-old-space-size=1024',
      '--optimize-for-size'
    ],
    
    // CONFIGURAÇÕES AVANÇADAS
    listen_timeout: 10000,
    kill_timeout: 5000,
    wait_ready: true,
    
    // CONFIGURAÇÕES DE MONITORAMENTO
    monitoring: false,
    
    // CONFIGURAÇÕES DE SHUTDOWN
    shutdown_with_message: true,
    
    // CONFIGURAÇÕES ESPECÍFICAS PARA VPS
    cwd: '/root/whatsapp-server',
    user: 'root',
    
    // CONFIGURAÇÕES DE SAÚDE
    health_check_url: 'http://localhost:3002/health',
    health_check_grace_period: 30000
  }]
};
