
import { useState, useCallback } from 'react';
import { toast } from 'sonner';

interface RetryConfig {
  maxRetries?: number;
  delayMs?: number;
  backoffMultiplier?: number;
}

interface RetryState {
  isLoading: boolean;
  error: string | null;
  retryCount: number;
  canRetry: boolean;
}

export function useRetryableOperation<T>(
  operation: () => Promise<T>,
  config: RetryConfig = {}
) {
  const {
    maxRetries = 3,
    delayMs = 1000,
    backoffMultiplier = 2
  } = config;

  const [state, setState] = useState<RetryState>({
    isLoading: false,
    error: null,
    retryCount: 0,
    canRetry: true
  });

  const executeWithRetry = useCallback(async (): Promise<T | null> => {
    setState(prev => ({
      ...prev,
      isLoading: true,
      error: null
    }));

    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Retry] Tentativa ${attempt + 1}/${maxRetries + 1}`);
        
        const result = await operation();
        
        // Sucesso
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: null,
          retryCount: attempt,
          canRetry: true
        }));
        
        if (attempt > 0) {
          toast.success(`✅ Operação bem-sucedida após ${attempt + 1} tentativas!`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        console.error(`[Retry] Tentativa ${attempt + 1} falhou:`, lastError.message);
        
        // Se não é a última tentativa, aguardar antes de tentar novamente
        if (attempt < maxRetries) {
          const delay = delayMs * Math.pow(backoffMultiplier, attempt);
          console.log(`[Retry] Aguardando ${delay}ms antes da próxima tentativa...`);
          
          toast.info(`⏳ Tentativa ${attempt + 1} falhou. Tentando novamente em ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    // Todas as tentativas falharam
    setState(prev => ({
      ...prev,
      isLoading: false,
      error: lastError?.message || 'Operação falhou',
      retryCount: maxRetries + 1,
      canRetry: false
    }));

    toast.error(`❌ Operação falhou após ${maxRetries + 1} tentativas: ${lastError?.message}`);
    return null;
    
  }, [operation, maxRetries, delayMs, backoffMultiplier]);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      retryCount: 0,
      canRetry: true
    });
  }, []);

  return {
    ...state,
    execute: executeWithRetry,
    reset
  };
}
