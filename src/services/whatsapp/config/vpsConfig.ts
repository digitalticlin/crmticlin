
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  
  // Timeouts otimizados para produção
  timeouts: {
    // Operações básicas (status, qr)
    basic: 20000, // 20 segundos
    
    // Operações de conexão (create, reconnect)
    connection: 45000, // 45 segundos
    
    // Operações de limpeza (delete)
    cleanup: 30000, // 30 segundos
    
    // Health checks (mais rápido)
    health: 15000, // 15 segundos
  },
  
  // Configurações de retry
  retry: {
    maxAttempts: 3,
    baseDelay: 1000, // 1 segundo
    maxDelay: 10000, // 10 segundos
  },
  
  // Configurações de heartbeat
  heartbeat: {
    interval: 30000, // 30 segundos
    timeout: 10000, // 10 segundos
    maxFailures: 3,
  },
  
  // Configurações de persistência
  persistence: {
    enableSessionPersistence: true,
    sessionTimeout: 7200000, // 2 horas em ms
    autoReconnect: true,
    reconnectDelay: 60000, // 1 minuto
  }
};

// Helper para retry com backoff exponencial
export const withRetry = async <T>(
  operation: () => Promise<T>,
  maxAttempts: number = VPS_CONFIG.retry.maxAttempts
): Promise<T> => {
  let lastError: Error;
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === maxAttempts) {
        throw lastError;
      }
      
      // Backoff exponencial
      const delay = Math.min(
        VPS_CONFIG.retry.baseDelay * Math.pow(2, attempt - 1),
        VPS_CONFIG.retry.maxDelay
      );
      
      console.warn(`[VPSConfig] Attempt ${attempt} failed, retrying in ${delay}ms:`, lastError.message);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};
