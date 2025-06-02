
export const HOSTINGER_CONFIG = {
  API_BASE_URL: 'https://api.hostinger.com/vps/v1',
  API_TOKEN: '3oOb0an43kLEO6cy3bP8LteKCTxshH8eytEV9QR314dcf0b3',
  
  // Configurações de timeout
  REQUEST_TIMEOUT: 30000, // 30 segundos
  LONG_OPERATION_TIMEOUT: 300000, // 5 minutos para operações longas
  
  // Configurações de retry
  MAX_RETRIES: 3,
  RETRY_DELAY: 2000, // 2 segundos
  
  // Portas padrão dos serviços
  WHATSAPP_PORT: 3001,
  API_SERVER_PORT: 3002,
  
  // Scripts de instalação
  WHATSAPP_INSTALL_SCRIPT: {
    name: 'WhatsApp Web.js Installation',
    description: 'Instalação completa do servidor WhatsApp Web.js com correções SSL',
    timeout: 300000 // 5 minutos
  },
  
  SSL_FIX_SCRIPT: {
    name: 'SSL and Timeout Fixes',
    description: 'Aplicação de correções SSL e timeout para WhatsApp Web.js',
    timeout: 120000 // 2 minutos
  }
};

export const HOSTINGER_ENDPOINTS = {
  LIST_VPS: '/virtual-machines',
  VPS_DETAILS: (id: string) => `/virtual-machines/${id}`,
  VPS_EXECUTE: (id: string) => `/virtual-machines/${id}/execute`,
  VPS_RESTART: (id: string) => `/virtual-machines/${id}/restart`,
  VPS_START: (id: string) => `/virtual-machines/${id}/start`,
  VPS_STOP: (id: string) => `/virtual-machines/${id}/stop`,
  VPS_LOGS: (id: string) => `/virtual-machines/${id}/logs`
};

// Comandos pré-definidos para facilitar o uso
export const PRESET_COMMANDS = {
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
    command: 'netstat -tlnp | grep -E "(3001|3002)"',
    description: 'Verificar portas WhatsApp em uso'
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
