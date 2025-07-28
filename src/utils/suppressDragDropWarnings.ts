/**
 * Supressor de warnings conhecidos do react-beautiful-dnd
 * 
 * NOTA: react-beautiful-dnd está deprecated desde 2022.
 * Considerar migração para @dnd-kit/core em futuras versões.
 * 
 * Warnings suprimidos:
 * - Support for defaultProps will be removed from memo components
 * - Nested scroll container detected (já corrigido na estrutura)
 */

let isWarningSuppressionActive = false;
const originalWarn = console.warn;

export const suppressDragDropWarnings = () => {
  if (isWarningSuppressionActive) return;
  
  console.warn = (...args) => {
    const message = args[0];
    
    // Lista de warnings a serem suprimidos
    const suppressedWarnings = [
      'Support for defaultProps will be removed from memo components',
      'Connect(Droppable): Support for defaultProps',
      'react-beautiful-dnd',
    ];
    
    // Verificar se é um warning que deve ser suprimido
    const shouldSuppress = suppressedWarnings.some(warning => 
      typeof message === 'string' && message.includes(warning)
    );
    
    if (!shouldSuppress) {
      originalWarn(...args);
    }
  };
  
  isWarningSuppressionActive = true;
};

export const restoreOriginalWarnings = () => {
  console.warn = originalWarn;
  isWarningSuppressionActive = false;
};

// Auto-ativar na importação
suppressDragDropWarnings(); 