/**
 * ✅ SISTEMA DE LOGGER OTIMIZADO
 * Remove logs desnecessários em produção para melhorar performance
 */

type LogLevel = 'log' | 'info' | 'warn' | 'error' | 'debug';

interface Logger {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  debug: (...args: any[]) => void;
  group: (label: string) => void;
  groupEnd: () => void;
  time: (label: string) => void;
  timeEnd: (label: string) => void;
}

// ✅ LOGGER PARA DESENVOLVIMENTO: Todas as funcionalidades
const developmentLogger: Logger = {
  log: console.log.bind(console),
  info: console.info.bind(console),
  warn: console.warn.bind(console),
  error: console.error.bind(console),
  debug: console.debug.bind(console),
  group: console.group.bind(console),
  groupEnd: console.groupEnd.bind(console),
  time: console.time.bind(console),
  timeEnd: console.timeEnd.bind(console),
};

// ✅ LOGGER PARA PRODUÇÃO: Apenas erros críticos
const productionLogger: Logger = {
  log: () => {},
  info: () => {},
  warn: () => {},
  error: console.error.bind(console), // Manter erros em produção
  debug: () => {},
  group: () => {},
  groupEnd: () => {},
  time: () => {},
  timeEnd: () => {},
};

// ✅ LOGGER PRINCIPAL: Decide qual usar baseado no ambiente
export const logger: Logger = process.env.NODE_ENV === 'development' 
  ? developmentLogger 
  : productionLogger;

// ✅ LOGGER ESPECIALIZADO PARA COMPONENTES ESPECÍFICOS
export const createComponentLogger = (componentName: string) => ({
  log: (...args: any[]) => logger.log(`[${componentName}]`, ...args),
  info: (...args: any[]) => logger.info(`[${componentName}]`, ...args),
  warn: (...args: any[]) => logger.warn(`[${componentName}]`, ...args),
  error: (...args: any[]) => logger.error(`[${componentName}]`, ...args),
  debug: (...args: any[]) => logger.debug(`[${componentName}]`, ...args),
});

// ✅ LOGGER PARA PERFORMANCE MONITORING
export const performanceLogger = {
  startTimer: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.time(`[Performance] ${label}`);
    }
  },
  
  endTimer: (label: string) => {
    if (process.env.NODE_ENV === 'development') {
      console.timeEnd(`[Performance] ${label}`);
    }
  },
  
  logRender: (componentName: string, props?: any) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Render] ${componentName}`, props ? { props } : '');
    }
  }
};

// ✅ LOGGER PARA REALTIME EVENTS
export const realtimeLogger = createComponentLogger('Realtime');

// ✅ LOGGER PARA CHAT OPERATIONS
export const chatLogger = createComponentLogger('Chat');

// ✅ LOGGER PARA WHATSAPP OPERATIONS
export const whatsappLogger = createComponentLogger('WhatsApp');

export default logger; 