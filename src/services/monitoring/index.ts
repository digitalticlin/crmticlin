/**
 * Sistema de monitoramento e diagnóstico para ambiente de produção
 * Este módulo fornece funções para rastreamento de performance, erros e logs
 */

// Log levels
export enum LogLevel {
  DEBUG = 'debug',
  INFO = 'info',
  WARN = 'warn',
  ERROR = 'error',
  CRITICAL = 'critical'
}

// Performance metrics
interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  timestamp: number;
}

// Error record
interface ErrorRecord {
  message: string;
  stack?: string;
  context?: Record<string, any>;
  timestamp: number;
}

// Configuration
const config = {
  // Whether to send logs to backend
  sendToBackend: true,
  
  // Minimum log level to record
  minLogLevel: LogLevel.INFO,
  
  // Batch size for sending logs
  batchSize: 10,
  
  // Buffer timeout in ms
  bufferTimeout: 5000
};

// Log buffer
const logBuffer: Array<{level: LogLevel, message: string, context?: Record<string, any>}> = [];

// Performance metrics buffer
const metricsBuffer: PerformanceMetric[] = [];

// Error buffer
const errorBuffer: ErrorRecord[] = [];

// Timer for flushing buffers
let flushTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Log a message with specific level
 */
export const log = (level: LogLevel, message: string, context?: Record<string, any>) => {
  // Skip if below minimum log level
  if (!shouldLog(level)) return;
  
  // Log to console
  logToConsole(level, message, context);
  
  // Add to buffer for backend reporting
  if (config.sendToBackend) {
    logBuffer.push({
      level,
      message,
      context,
    });
    
    scheduleFlush();
  }
};

/**
 * Convenience methods for different log levels
 */
export const debug = (message: string, context?: Record<string, any>) => 
  log(LogLevel.DEBUG, message, context);

export const info = (message: string, context?: Record<string, any>) => 
  log(LogLevel.INFO, message, context);

export const warn = (message: string, context?: Record<string, any>) => 
  log(LogLevel.WARN, message, context);

export const error = (message: string, error?: Error, context?: Record<string, any>) => {
  log(LogLevel.ERROR, message, context);
  
  if (error && config.sendToBackend) {
    errorBuffer.push({
      message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });
    
    scheduleFlush();
  }
};

export const critical = (message: string, error?: Error, context?: Record<string, any>) => {
  log(LogLevel.CRITICAL, message, context);
  
  if (error && config.sendToBackend) {
    errorBuffer.push({
      message,
      stack: error.stack,
      context,
      timestamp: Date.now()
    });
    
    // Critical errors are flushed immediately
    flushBuffers();
  }
};

/**
 * Record performance metric
 */
export const recordMetric = (name: string, value: number, unit: string = 'ms') => {
  const metric: PerformanceMetric = {
    name,
    value,
    unit,
    timestamp: Date.now()
  };
  
  // Add to buffer
  if (config.sendToBackend) {
    metricsBuffer.push(metric);
    scheduleFlush();
  }
};

/**
 * Time a function execution and record as metric
 */
export const timeExecution = async <T>(
  name: string, 
  fn: () => Promise<T> | T
): Promise<T> => {
  const start = performance.now();
  
  try {
    const result = await fn();
    const duration = performance.now() - start;
    recordMetric(name, Math.round(duration * 100) / 100);
    return result;
  } catch (e) {
    const duration = performance.now() - start;
    recordMetric(`${name}_error`, Math.round(duration * 100) / 100);
    throw e;
  }
};

/**
 * Helper functions
 */
const shouldLog = (level: LogLevel): boolean => {
  const levels = Object.values(LogLevel);
  const minIndex = levels.indexOf(config.minLogLevel);
  const currentIndex = levels.indexOf(level);
  
  return currentIndex >= minIndex;
};

const logToConsole = (level: LogLevel, message: string, context?: Record<string, any>) => {
  const timestamp = new Date().toISOString();
  const contextString = context ? JSON.stringify(context) : '';
  
  switch (level) {
    case LogLevel.DEBUG:
      console.debug(`[${timestamp}] ${message}`, contextString);
      break;
    case LogLevel.INFO:
      console.info(`[${timestamp}] ${message}`, contextString);
      break;
    case LogLevel.WARN:
      console.warn(`[${timestamp}] ${message}`, contextString);
      break;
    case LogLevel.ERROR:
    case LogLevel.CRITICAL:
      console.error(`[${timestamp}] ${message}`, contextString);
      break;
  }
};

const scheduleFlush = () => {
  // Check if any buffer is over batch size
  if (
    logBuffer.length >= config.batchSize ||
    metricsBuffer.length >= config.batchSize ||
    errorBuffer.length >= config.batchSize
  ) {
    flushBuffers();
    return;
  }
  
  // Otherwise schedule a flush
  if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushBuffers();
      flushTimer = null;
    }, config.bufferTimeout);
  }
};

const flushBuffers = async () => {
  // Skip if nothing to flush
  if (
    logBuffer.length === 0 &&
    metricsBuffer.length === 0 &&
    errorBuffer.length === 0
  ) {
    return;
  }
  
  // Clear timer if exists
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  
  // Clone and clear buffers
  const logs = [...logBuffer];
  const metrics = [...metricsBuffer];
  const errors = [...errorBuffer];
  
  logBuffer.length = 0;
  metricsBuffer.length = 0;
  errorBuffer.length = 0;
  
  try {
    // In a real implementation, this would send data to a backend
    // For now we just log it
    console.debug(`Would send ${logs.length} logs, ${metrics.length} metrics, and ${errors.length} errors to backend`);
    
    // This is where you'd implement the actual API call
    // await fetch('https://api.ticlin.com.br/monitoring/logs', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ logs, metrics, errors })
    // });
  } catch (e) {
    console.error('Failed to send logs to backend:', e);
    
    // Put back in buffer for retry
    logBuffer.push(...logs);
    metricsBuffer.push(...metrics);
    errorBuffer.push(...errors);
  }
};
