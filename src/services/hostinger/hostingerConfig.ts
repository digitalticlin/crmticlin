
export const HOSTINGER_CONFIG = {
  // URLs primária e fallback para VPS correta
  PRIMARY_VPS_URL: 'http://31.97.163.57',  // CORREÇÃO: VPS correta
  FALLBACK_VPS_URL: 'http://31.97.163.57', // CORREÇÃO: VPS correta
  VPS_HOST: '31.97.163.57', // CORREÇÃO: IP correto
  VPS_PORT: 3001, // CORREÇÃO: Porta correta
  
  // Configurações de timeout otimizadas
  REQUEST_TIMEOUT: 8000, // 8 segundos para testes rápidos
  LONG_OPERATION_TIMEOUT: 120000, // 2 minutos para operações longas
  
  // Configurações de retry
  MAX_RETRIES: 2, // Reduzido para ser mais rápido
  RETRY_DELAY: 1000, // 1 segundo
  
  // Portas padrão dos serviços
  WHATSAPP_PORT: 3001,
  API_SERVER_PORT: 80, // Usando porta 80 para API
  
  // Scripts de instalação
  WHATSAPP_INSTALL_SCRIPT: {
    name: 'WhatsApp Web.js Installation',
    description: 'Instalação completa do servidor WhatsApp Web.js com correções SSL',
    timeout: 180000 // 3 minutos
  },
  
  SSL_FIX_SCRIPT: {
    name: 'SSL and Timeout Fixes',
    description: 'Aplicação de correções SSL e timeout para WhatsApp Web.js',
    timeout: 60000 // 1 minuto
  }
};

export const HOSTINGER_ENDPOINTS = {
  HEALTH_CHECK: '/health',
  STATUS: '/status',
  LIST_VPS: '/virtual-machines',
  VPS_DETAILS: (id: string) => `/virtual-machines/${id}`,
  VPS_EXECUTE: '/execute',
  VPS_RESTART: (id: string) => `/virtual-machines/${id}/restart`,
  VPS_START: (id: string) => `/virtual-machines/${id}/start`,
  VPS_STOP: (id: string) => `/virtual-machines/${id}/stop`,
  VPS_LOGS: (id: string) => `/virtual-machines/${id}/logs`
};

// Comandos pré-definidos para facilitar o uso
export const PRESET_COMMANDS = {
  SETUP_FIREWALL: {
    command: 'sudo ufw allow 80/tcp && sudo ufw reload',
    description: 'Configurar firewall para permitir porta 80'
  },
  
  CHECK_SYSTEM_STATUS: {
    command: 'systemctl status',
    description: 'Verificar status dos serviços do sistema'
  },
  
  CHECK_PM2_STATUS: {
    command: 'pm2 status --no-color',
    description: 'Verificar status dos processos PM2'
  },
  
  CHECK_DISK_SPACE: {
    command: 'df -h',
    description: 'Verificar espaço em disco'
  },
  
  CHECK_MEMORY_USAGE: {
    command: 'free -h',
    description: 'Verificar uso de memória'
  },
  
  CHECK_NETWORK: {
    command: 'netstat -tlnp | grep -E "(80|3001|3002)"',
    description: 'Verificar portas em uso'
  },
  
  RESTART_WHATSAPP: {
    command: 'pm2 restart whatsapp-server',
    description: 'Reiniciar servidor WhatsApp'
  },
  
  VIEW_WHATSAPP_LOGS: {
    command: 'pm2 logs whatsapp-server --lines 50 --nostream',
    description: 'Ver logs do WhatsApp (últimas 50 linhas)'
  },
  
  BACKUP_PROJECTS: {
    command: 'mkdir -p /root/backups && tar -czf /root/backups/whatsapp-backup-$(date +%Y%m%d_%H%M%S).tar.gz /root/whatsapp-web-server',
    description: 'Criar backup dos projetos WhatsApp'
  },
  
  CLEANUP_LOGS: {
    command: 'pm2 flush && journalctl --vacuum-time=7d',
    description: 'Limpar logs antigos (manter 7 dias)'
  }
};
