// Utilitário para debug condicional - elimina console.logs em produção
const isDev = process.env.NODE_ENV !== 'production';
let isDragging = false; // Flag para desativar logs durante operações de drag

export const setDragging = (dragging: boolean) => {
  isDragging = dragging;
};

export const debugLog = {
  dragDrop: isDev ? (...args: any[]) => !isDragging && console.log('[DragDrop]', ...args) : () => {},
  clone: isDev ? (...args: any[]) => !isDragging && console.log('[Clone]', ...args) : () => {},
  kanban: isDev ? (...args: any[]) => console.log('[Kanban]', ...args) : () => {},
  sync: isDev ? (...args: any[]) => console.log('[Sync]', ...args) : () => {},
  wrapper: isDev ? (...args: any[]) => console.log('[Wrapper]', ...args) : () => {},
  operations: isDev ? (...args: any[]) => console.log('[Operations]', ...args) : () => {}
};

// Throttle helper para otimizar eventos frequentes
export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): ((...args: Parameters<T>) => void) => {
  let timeoutId: NodeJS.Timeout | null = null;
  let lastExecTime = 0;
  
  return (...args: Parameters<T>) => {
    const currentTime = Date.now();
    
    if (currentTime - lastExecTime > delay) {
      func(...args);
      lastExecTime = currentTime;
    } else {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        func(...args);
        lastExecTime = Date.now();
      }, delay - (currentTime - lastExecTime));
    }
  };
}; 