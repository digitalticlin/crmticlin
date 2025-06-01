
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  
  // Timeouts otimizados e REDUZIDOS para evitar operações desnecessárias
  timeouts: {
    // Operações básicas (status, qr) - REDUZIDO
    basic: 15000, // 15 segundos (era 20s)
    
    // Operações de conexão (create, reconnect)
    connection: 45000, // 45 segundos
    
    // Operações de limpeza (delete)
    cleanup: 30000, // 30 segundos
    
    // Health checks - MUITO REDUZIDO
    health: 8000, // 8 segundos (era 15s)
  },
  
  // Configurações de retry REDUZIDAS
  retry: {
    maxAttempts: 2, // REDUZIDO de 3 para 2
    baseDelay: 2000, // AUMENTADO de 1s para 2s
    maxDelay: 8000, // REDUZIDO de 10s para 8s
  },
  
  // Configurações de heartbeat DRASTICAMENTE REDUZIDAS
  heartbeat: {
    interval: 300000, // 5 MINUTOS (era 30 segundos) 
    timeout: 8000, // REDUZIDO de 10s para 8s
    maxFailures: 5, // AUMENTADO de 3 para 5
  },
  
  // Configurações de persistência
  persistence: {
    enableSessionPersistence: true,
    sessionTimeout: 7200000, // 2 horas em ms
    autoReconnect: true,
    reconnectDelay: 120000, // AUMENTADO para 2 minutos (era 1 minuto)
  },

  // NOVA: Configurações para evitar polling excessivo
  polling: {
    // Intervalo para instâncias pendentes (aguardando QR scan)
    pendingInterval: 60000, // 1 minuto
    
    // Intervalo para instâncias conectadas
    connectedInterval: 300000, // 5 minutos
    
    // Máximo de tentativas antes de parar o polling
    maxPollingAttempts: 10,
    
    // Timeout para chamadas de polling
    pollingTimeout: 10000, // 10 segundos
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

// NOVA: Helper para verificar se deve fazer polling
export const shouldPoll = (status: string, attemptCount: number): boolean => {
  // Só faz polling para estados específicos e dentro do limite de tentativas
  const pollableStates = ['waiting_scan', 'creating', 'connecting'];
  return pollableStates.includes(status) && attemptCount < VPS_CONFIG.polling.maxPollingAttempts;
};

// NOVA: Helper para determinar intervalo de polling baseado no status
export const getPollingInterval = (status: string): number => {
  if (['ready', 'open'].includes(status)) {
    return VPS_CONFIG.polling.connectedInterval; // 5 minutos para conectadas
  }
  return VPS_CONFIG.polling.pendingInterval; // 1 minuto para pendentes
};
