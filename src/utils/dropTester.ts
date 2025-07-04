/**
 * Utilitário para testar se o sistema de drop está funcionando corretamente
 * 
 * Execute estas funções no console do navegador para diagnosticar problemas de drop
 */

// Verificar se os elementos de drop estão recebendo eventos
export const testDropZones = () => {
  console.log('🔍 Testando drop zones...');
  
  const droppables = document.querySelectorAll('[data-rbd-droppable-id]');
  console.log(`📊 Encontradas ${droppables.length} drop zones`);
  
  droppables.forEach((zone, index) => {
    const id = zone.getAttribute('data-rbd-droppable-id');
    const style = window.getComputedStyle(zone);
    
    console.log(`Drop Zone ${index + 1}:`, {
      id,
      pointerEvents: style.pointerEvents,
      zIndex: style.zIndex,
      position: style.position,
      display: style.display,
      visibility: style.visibility,
      opacity: style.opacity
    });
    
    // Verificar se a zona está bloqueada
    if (style.pointerEvents === 'none') {
      console.warn(`⚠️  Drop zone ${id} tem pointer-events: none!`);
    }
  });
};

// Verificar estado do body durante drag
export const checkBodyState = () => {
  console.log('🔍 Verificando estado do body...');
  
  const body = document.body;
  const bodyStyle = window.getComputedStyle(body);
  
  console.log('Body state:', {
    classes: Array.from(body.classList),
    overflow: bodyStyle.overflow,
    pointerEvents: bodyStyle.pointerEvents,
    userSelect: bodyStyle.userSelect,
    cursor: bodyStyle.cursor
  });
};

// Verificar se há elementos interferindo
export const checkInterferingElements = () => {
  console.log('🔍 Verificando elementos que podem interferir...');
  
  // Verificar elementos com z-index muito alto
  const allElements = document.querySelectorAll('*');
  const highZIndex = [];
  
  allElements.forEach(el => {
    const style = window.getComputedStyle(el);
    const zIndex = parseInt(style.zIndex);
    
    if (zIndex > 9000) {
      highZIndex.push({
        element: el,
        zIndex,
        pointerEvents: style.pointerEvents
      });
    }
  });
  
  console.log(`📊 Elementos com z-index alto (>9000):`, highZIndex);
  
  // Verificar elementos com pointer-events: none
  const blockedElements = document.querySelectorAll('[style*="pointer-events"]');
  console.log(`📊 Elementos com pointer-events customizado:`, blockedElements);
};

// Função principal de diagnóstico
export const diagnoseDrop = () => {
  console.log('🚀 Iniciando diagnóstico completo do sistema de drop...');
  
  testDropZones();
  checkBodyState();
  checkInterferingElements();
  
  console.log('✅ Diagnóstico concluído! Verifique os logs acima para identificar problemas.');
};

// Exportar utilitários
export const dropDiagnostic = {
  testDropZones,
  checkBodyState,
  checkInterferingElements,
  diagnoseDrop
};

// Tornar disponível no window para uso no console
if (typeof window !== 'undefined') {
  (window as any).dropDiagnostic = dropDiagnostic;
}

// 🧪 TESTE ESPECÍFICO DA LÓGICA DE DROP
export const testDropLogic = () => {
  console.log('🧪 [DropTester] Iniciando teste específico de DROP...');
  
  const results = {
    dropProcessing: true,
    visualCleanup: true,
    timingCorrect: true,
    noStuckCards: true,
    score: 0
  };

  // 🔍 Teste 1: Verificar se DROP está processando antes da limpeza
  let dropProcessed = false;
  let cleanupStarted = false;
  
  // Monitor de eventos de drop
  const originalConsoleLog = console.log;
  console.log = (...args) => {
    const message = args.join(' ');
    if (message.includes('Aplicando mudanças')) {
      dropProcessed = true;
    }
    if (message.includes('Limpeza suave')) {
      cleanupStarted = true;
      if (!dropProcessed) {
        console.error('❌ Limpeza iniciada antes do processamento!');
        results.dropProcessing = false;
      }
    }
    originalConsoleLog.apply(console, args);
  };

  // 🔍 Teste 2: Verificar elementos não órfãos
  const checkStuckCards = () => {
    const stuckElements = document.querySelectorAll('[style*="position: fixed"][data-rbd-draggable-context-id]');
    const draggingClass = document.body.classList.contains('rbd-dragging');
    
    if (stuckElements.length > 0 && !draggingClass) {
      console.log('⚠️ Possíveis cards presos detectados:', stuckElements.length);
      results.noStuckCards = false;
    }
    
    return stuckElements.length;
  };

  // 🔍 Teste 3: Monitorar timing de limpeza
  let dragStartTime = 0;
  let dropEndTime = 0;
  let cleanupTime = 0;

  const originalAddEventListener = document.addEventListener;
  document.addEventListener = function(type, listener, options) {
    if (type === 'mousedown') {
      const wrappedListener = function(e: Event) {
        const target = e.target as Element;
        if (target.closest('[data-rbd-drag-handle-context-id]')) {
          dragStartTime = performance.now();
          console.log('🟢 [DropTester] Drag detectado:', dragStartTime);
        }
        return listener.call(this, e);
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    
    if (type === 'mouseup') {
      const wrappedListener = function(e: Event) {
        if (dragStartTime > 0) {
          dropEndTime = performance.now();
          console.log('🔴 [DropTester] Drop detectado:', dropEndTime);
          
          // Verificar limpeza após 300ms
          setTimeout(() => {
            cleanupTime = performance.now();
            const timingOk = cleanupTime - dropEndTime >= 200;
            if (!timingOk) {
              console.log('⚠️ Limpeza muito rápida - possível interferência');
              results.timingCorrect = false;
            }
            
            const stuckCount = checkStuckCards();
            if (stuckCount === 0) {
              console.log('✅ [DropTester] Nenhum card preso detectado');
            }
            
            // Reset
            dragStartTime = 0;
            dropEndTime = 0;
          }, 300);
        }
        return listener.call(this, e);
      };
      return originalAddEventListener.call(this, type, wrappedListener, options);
    }
    
    return originalAddEventListener.call(this, type, listener, options);
  };

  // 🔍 Teste 4: Verificar limpeza visual
  const checkVisualCleanup = () => {
    const bodyUserSelect = document.body.style.userSelect;
    const hasRbdClass = document.body.classList.contains('rbd-dragging');
    
    if (bodyUserSelect || hasRbdClass) {
      console.log('⚠️ Limpeza visual incompleta');
      results.visualCleanup = false;
    }
  };

  // Monitor contínuo
  const monitorInterval = setInterval(() => {
    checkStuckCards();
    checkVisualCleanup();
  }, 1000);

  // Cleanup do teste após 30 segundos
  setTimeout(() => {
    clearInterval(monitorInterval);
    console.log = originalConsoleLog;
    
    // Score final
    results.score = (results.dropProcessing ? 25 : 0) +
                    (results.visualCleanup ? 25 : 0) +
                    (results.timingCorrect ? 25 : 0) +
                    (results.noStuckCards ? 25 : 0);

    console.log('📊 [DropTester] Resultado Final:', {
      ...results,
      health: results.score >= 75 ? '🟢 DROP OK' : 
              results.score >= 50 ? '🟡 DROP COM PROBLEMAS' : '🔴 DROP QUEBRADO'
    });
  }, 30000);

  console.log('🔍 [DropTester] Teste ativo por 30 segundos...');
  return results;
};

// 🚀 Auto-inicialização para teste do drop
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    testDropLogic();
  }, 5000); // Aguardar sistema carregar
} 