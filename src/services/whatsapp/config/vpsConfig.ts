
export const VPS_CONFIG = {
  baseUrl: 'http://31.97.24.222:3001',
  
  // Timeouts DRASTICAMENTE aumentados para estabilidade
  timeouts: {
    // Ping leve - NOVO endpoint mais rápido
    ping: 10000, // 10 segundos
    
    // Health checks mais tolerantes
    health: 30000, // 30 segundos (era 8s)
    
    // Operações básicas
    basic: 25000, // 25 segundos
    
    // Operações de conexão
    connection: 60000, // 60 segundos
    
    // Operações de limpeza
    cleanup: 45000, // 45 segundos
  },
  
  // Retry com backoff exponencial OTIMIZADO
  retry: {
    maxAttempts: 5, // Aumentado para 5 tentativas
    baseDelay: 3000, // 3 segundos base
    maxDelay: 30000, // 30 segundos máximo
    backoffMultiplier: 2, // Multiplicador exponencial
  },
  
  // Monitoramento MUITO mais conservador
  monitoring: {
    healthCheckInterval: 1800000, // 30 MINUTOS (era 5 min)
    maxConsecutiveFailures: 50, // 50 falhas (era 5)
    circuitBreakerThreshold: 10, // Após 10 falhas, para por 1 hora
    circuitBreakerTimeout: 3600000, // 1 hora de pausa
  },
  
  // Cache para reduzir chamadas
  cache: {
    statusCacheDuration: 300000, // 5 minutos de cache
    pingCacheDuration: 60000, // 1 minuto de cache para ping
  },
  
  // Recovery settings melhorados
  recovery: {
    quarantineDuration: 86400000, // 24 horas de quarentena
    autoRecoveryInterval: 3600000, // 1 hora para auto-recovery
    doubleValidationDelay: 300000, // 5 minutos entre validações
  },
  
  // Rate limiting
  rateLimit: {
    maxCallsPerMinute: 10,
    burstLimit: 3, // Máximo 3 chamadas seguidas
    burstCooldown: 60000, // 1 minuto de cooldown
  }
};

// Circuit Breaker State
let circuitBreakerState = {
  isOpen: false,
  failureCount: 0,
  lastFailureTime: 0,
  nextRetryTime: 0
};

// Rate limiting state
let rateLimitState = {
  callsThisMinute: 0,
  minuteStart: Date.now(),
  burstCount: 0,
  lastBurstTime: 0
};

// Cache state
let statusCache = {
  data: null as any,
  timestamp: 0
};

let pingCache = {
  data: null as any,
  timestamp: 0
};

/**
 * Circuit Breaker - Evita spam quando VPS está offline
 */
export const checkCircuitBreaker = (): boolean => {
  const now = Date.now();
  
  if (circuitBreakerState.isOpen) {
    if (now > circuitBreakerState.nextRetryTime) {
      console.log('[VPSConfig] Circuit breaker: Tentando reconectar após timeout');
      circuitBreakerState.isOpen = false;
      circuitBreakerState.failureCount = 0;
      return true;
    }
    console.log('[VPSConfig] Circuit breaker ABERTO - VPS em quarentena');
    return false;
  }
  
  return true;
};

/**
 * Registra falha no circuit breaker
 */
export const registerFailure = (): void => {
  circuitBreakerState.failureCount++;
  circuitBreakerState.lastFailureTime = Date.now();
  
  if (circuitBreakerState.failureCount >= VPS_CONFIG.monitoring.circuitBreakerThreshold) {
    circuitBreakerState.isOpen = true;
    circuitBreakerState.nextRetryTime = Date.now() + VPS_CONFIG.monitoring.circuitBreakerTimeout;
    console.warn('[VPSConfig] Circuit breaker ATIVADO - VPS em quarentena por 1 hora');
  }
};

/**
 * Rate limiting - Evita sobrecarga do VPS
 */
export const checkRateLimit = (): boolean => {
  const now = Date.now();
  
  // Reset contador a cada minuto
  if (now - rateLimitState.minuteStart > 60000) {
    rateLimitState.callsThisMinute = 0;
    rateLimitState.minuteStart = now;
  }
  
  // Check burst limit
  if (now - rateLimitState.lastBurstTime < VPS_CONFIG.rateLimit.burstCooldown) {
    if (rateLimitState.burstCount >= VPS_CONFIG.rateLimit.burstLimit) {
      console.warn('[VPSConfig] Rate limit: Burst limit atingido');
      return false;
    }
  } else {
    rateLimitState.burstCount = 0;
  }
  
  // Check rate limit
  if (rateLimitState.callsThisMinute >= VPS_CONFIG.rateLimit.maxCallsPerMinute) {
    console.warn('[VPSConfig] Rate limit: Limite por minuto atingido');
    return false;
  }
  
  return true;
};

/**
 * Registra chamada para rate limiting
 */
export const registerCall = (): void => {
  const now = Date.now();
  rateLimitState.callsThisMinute++;
  
  if (now - rateLimitState.lastBurstTime < VPS_CONFIG.rateLimit.burstCooldown) {
    rateLimitState.burstCount++;
  } else {
    rateLimitState.burstCount = 1;
  }
  rateLimitState.lastBurstTime = now;
};

/**
 * Cache para status do VPS
 */
export const getCachedStatus = (): any => {
  const now = Date.now();
  if (statusCache.data && (now - statusCache.timestamp) < VPS_CONFIG.cache.statusCacheDuration) {
    console.log('[VPSConfig] Usando status em cache');
    return statusCache.data;
  }
  return null;
};

export const setCachedStatus = (data: any): void => {
  statusCache.data = data;
  statusCache.timestamp = Date.now();
};

/**
 * Cache para ping do VPS
 */
export const getCachedPing = (): any => {
  const now = Date.now();
  if (pingCache.data && (now - pingCache.timestamp) < VPS_CONFIG.cache.pingCacheDuration) {
    console.log('[VPSConfig] Usando ping em cache');
    return pingCache.data;
  }
  return null;
};

export const setCachedPing = (data: any): void => {
  pingCache.data = data;
  pingCache.timestamp = Date.now();
};

/**
 * Retry com backoff exponencial MELHORADO
 */
export const withRetry = async <T>(
  operation: () => Promise<T>,
  context: string = 'unknown',
  maxAttempts: number = VPS_CONFIG.retry.maxAttempts
): Promise<T> => {
  let lastError: Error;
  
  // Verificar circuit breaker
  if (!checkCircuitBreaker()) {
    throw new Error('Circuit breaker ativo - VPS em quarentena');
  }
  
  // Verificar rate limit
  if (!checkRateLimit()) {
    throw new Error('Rate limit atingido - aguarde antes de tentar novamente');
  }
  
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      registerCall();
      const result = await operation();
      
      // Reset circuit breaker em caso de sucesso
      if (circuitBreakerState.failureCount > 0) {
        console.log('[VPSConfig] Operação bem-sucedida - resetando circuit breaker');
        circuitBreakerState.failureCount = 0;
      }
      
      return result;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      console.warn(`[VPSConfig] ${context} - Tentativa ${attempt}/${maxAttempts} falhou:`, lastError.message);
      
      if (attempt === maxAttempts) {
        registerFailure();
        throw lastError;
      }
      
      // Backoff exponencial
      const delay = Math.min(
        VPS_CONFIG.retry.baseDelay * Math.pow(VPS_CONFIG.retry.backoffMultiplier, attempt - 1),
        VPS_CONFIG.retry.maxDelay
      );
      
      console.log(`[VPSConfig] Aguardando ${delay}ms antes da próxima tentativa...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError!;
};

/**
 * Status do sistema para monitoramento
 */
export const getSystemStatus = () => {
  return {
    circuitBreaker: {
      isOpen: circuitBreakerState.isOpen,
      failureCount: circuitBreakerState.failureCount,
      nextRetryTime: circuitBreakerState.nextRetryTime
    },
    rateLimit: {
      callsThisMinute: rateLimitState.callsThisMinute,
      burstCount: rateLimitState.burstCount
    },
    cache: {
      statusCached: statusCache.data !== null,
      pingCached: pingCache.data !== null,
      statusAge: statusCache.timestamp > 0 ? Date.now() - statusCache.timestamp : 0,
      pingAge: pingCache.timestamp > 0 ? Date.now() - pingCache.timestamp : 0
    }
  };
};
