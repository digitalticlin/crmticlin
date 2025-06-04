
// FASE 2: Sistema de Logs Detalhados para WhatsApp Web.js
export class WhatsAppLoggingService {
  private static logBuffer: any[] = [];
  private static maxBufferSize = 100;

  // Log estruturado com contexto
  static logWithContext(level: 'info' | 'warn' | 'error' | 'debug', operation: string, data: any) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      operation,
      data,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Adicionar ao buffer
    this.logBuffer.push(logEntry);
    if (this.logBuffer.length > this.maxBufferSize) {
      this.logBuffer.shift(); // Remove o mais antigo
    }

    // Log no console com formatação melhorada
    const emoji = {
      info: '📘',
      warn: '⚠️',
      error: '❌',
      debug: '🔍'
    }[level];

    console.log(`${emoji} [WhatsApp ${operation}] ${timestamp}`);
    console.log('📊 Dados:', data);

    // Para erros, adicionar stack trace se disponível
    if (level === 'error' && data.error instanceof Error) {
      console.log('📋 Stack:', data.error.stack);
    }
  }

  // Logs específicos para operações WhatsApp
  static logInstanceOperation(operation: string, instanceId: string, result: any) {
    this.logWithContext('info', `Instance-${operation}`, {
      instanceId,
      result,
      operation
    });
  }

  static logSyncOperation(syncType: string, result: any) {
    this.logWithContext('info', `Sync-${syncType}`, {
      syncType,
      result,
      duration: result.duration,
      summary: result.summary
    });
  }

  static logVPSOperation(endpoint: string, method: string, result: any) {
    this.logWithContext('info', 'VPS-Request', {
      endpoint,
      method,
      success: result.success,
      status: result.status,
      duration: result.duration
    });
  }

  static logError(operation: string, error: any, context?: any) {
    this.logWithContext('error', operation, {
      error: error.message || error,
      context,
      stack: error.stack
    });
  }

  // Obter logs para debugging
  static getLogs(operation?: string) {
    if (operation) {
      return this.logBuffer.filter(log => log.operation.includes(operation));
    }
    return [...this.logBuffer];
  }

  // Limpar logs
  static clearLogs() {
    this.logBuffer = [];
    console.log('🧹 [WhatsApp Logging] Buffer limpo');
  }

  // Exportar logs para análise
  static exportLogs() {
    const logsJson = JSON.stringify(this.logBuffer, null, 2);
    const blob = new Blob([logsJson], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `whatsapp-logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }
}

// Hook para usar o sistema de logging
export const useWhatsAppLogging = () => {
  const logInstanceOperation = (operation: string, instanceId: string, result: any) => {
    WhatsAppLoggingService.logInstanceOperation(operation, instanceId, result);
  };

  const logSyncOperation = (syncType: string, result: any) => {
    WhatsAppLoggingService.logSyncOperation(syncType, result);
  };

  const logError = (operation: string, error: any, context?: any) => {
    WhatsAppLoggingService.logError(operation, error, context);
  };

  return {
    logInstanceOperation,
    logSyncOperation,
    logError,
    getLogs: WhatsAppLoggingService.getLogs,
    clearLogs: WhatsAppLoggingService.clearLogs,
    exportLogs: WhatsAppLoggingService.exportLogs
  };
};
