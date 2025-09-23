/**
 * 🎯 CONFIGURAÇÃO CENTRALIZADA DO DRAG AND DROP
 *
 * Configurações unificadas para todo o sistema DnD do funil de vendas
 * Otimizado para máxima responsividade e UX
 */

import { PointerSensor } from '@dnd-kit/core';

// 🚀 CONFIGURAÇÃO DE SENSORES ULTRA-RESPONSIVOS
export const DND_SENSOR_CONFIG = {
  activationConstraint: {
    distance: 3,    // Distância mínima reduzida para ativação mais rápida
    delay: 0,       // SEM DELAY - drag imediato!
    tolerance: 2    // Tolerância mínima para máxima responsividade
  }
};

// 🎨 CONFIGURAÇÃO DE ANIMAÇÕES
export const DND_ANIMATION_CONFIG = {
  dragOverlay: {
    duration: 50,      // Animação mais rápida para feedback imediato
    easing: 'ease-out'
  },
  transition: {
    duration: 100,     // Transição mais rápida
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  }
};

// 📏 CONFIGURAÇÃO DE AUTO-SCROLL
export const DND_SCROLL_CONFIG = {
  triggerZone: 100,        // px da borda para ativar scroll
  scrollSpeed: 15,         // px por frame
  smoothness: 0.8,         // suavidade da animação
  maxScrollSpeed: 25,      // velocidade máxima
};

// 🎯 CONFIGURAÇÃO DE ÁREAS BLOQUEADAS PARA DRAG
export const DND_BLOCKED_SELECTORS = [
  '.chat-icon-area',       // Área do ícone de chat
  '.lead-actions',         // Área de ações do lead
  'button',                // Todos os botões
  '.selection-checkbox',   // Checkbox de seleção
  '[data-no-drag]'        // Elementos marcados explicitamente
];

// 🎯 CONFIGURAÇÃO DE Z-INDEX PARA CAMADAS
export const DND_Z_INDEX = {
  dropZone: 0,             // Área de drop da coluna (não deve sobrepor conteúdo)
  dragHandle: 1,           // Handle de drag do card (baixa prioridade)
  cardNormal: 2,           // Card em estado normal
  cardDragging: 1000,      // Card sendo arrastado
  overlay: 2000            // Overlay de feedback visual
} as const;

// 🔧 FUNÇÃO UTILITÁRIA PARA VERIFICAR SE ELEMENTO PODE SER ARRASTADO
export const canStartDrag = (target: HTMLElement): boolean => {
  // Verificar se clicou em área bloqueada
  const isBlocked = DND_BLOCKED_SELECTORS.some(selector =>
    target.closest(selector) !== null
  );

  console.log('[DnD Config] 🎯 Verificando drag:', {
    target: target.className,
    isBlocked,
    canDrag: !isBlocked
  });

  return !isBlocked;
};

// 🎮 CONFIGURAÇÃO COMPLETA PARA SENSORES
export const createOptimizedSensors = () => {
  return [
    {
      sensor: PointerSensor,
      options: DND_SENSOR_CONFIG
    }
  ];
};

// 📊 CONFIGURAÇÃO DE DEBUG (ativar em desenvolvimento)
export const DND_DEBUG_CONFIG = {
  enabled: process.env.NODE_ENV === 'development',
  logLevel: 'info' as 'debug' | 'info' | 'warn' | 'error',

  log: (level: string, message: string, data?: any) => {
    if (!DND_DEBUG_CONFIG.enabled) return;

    const prefix = '[DnD Debug]';
    switch (level) {
      case 'debug':
        console.debug(prefix, message, data);
        break;
      case 'info':
        console.log(prefix, message, data);
        break;
      case 'warn':
        console.warn(prefix, message, data);
        break;
      case 'error':
        console.error(prefix, message, data);
        break;
    }
  }
};

// 🎯 EXPORT PRINCIPAL
export const DND_CONFIG = {
  sensors: DND_SENSOR_CONFIG,
  animations: DND_ANIMATION_CONFIG,
  scroll: DND_SCROLL_CONFIG,
  blockedSelectors: DND_BLOCKED_SELECTORS,
  zIndex: DND_Z_INDEX,
  debug: DND_DEBUG_CONFIG,

  // Funções utilitárias
  canStartDrag,
  createOptimizedSensors
} as const;

export default DND_CONFIG;