
// Configuração para WhatsApp Instance Monitor
// BLINDADO - não alterar estas configurações

export const MONITOR_CONFIG = {
  // Intervalos de monitoramento
  check_interval: 120000, // 2 minutos
  retry_interval: 300000, // 5 minutos para retry
  cleanup_interval: 3600000, // 1 hora para limpeza
  
  // Timeouts
  vps_timeout: 30000, // 30 segundos
  db_timeout: 15000, // 15 segundos
  
  // Limites
  max_retries: 3,
  max_orphans_per_cycle: 10,
  
  // Status mapeamento
  active_statuses: ['open', 'ready', 'authenticated'],
  inactive_statuses: ['disconnected', 'closed', 'error', 'waiting_scan'],
  
  // Logs
  enable_detailed_logs: true,
  log_retention_hours: 24
};

export const VPS_ENDPOINTS = {
  health: '/health',
  instances: '/instances', 
  status: '/instance/status',
  delete: '/instance/delete',
  create: '/instance/create'
};
