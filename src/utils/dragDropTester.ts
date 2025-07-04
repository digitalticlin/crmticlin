/**
 * Utilitário para testar a performance do drag and drop
 * 
 * Este arquivo contém funções para monitorar e diagnosticar problemas de performance
 * no sistema de drag and drop do Kanban.
 */

// Configuração
const ENABLE_PERFORMANCE_MONITORING = true;
const ENABLE_FRAME_RATE_MONITORING = true;
const ENABLE_MEMORY_MONITORING = false; // Desativado por padrão - pode causar sobrecarga

// Variáveis para monitoramento
let dragStartTime = 0;
let dragEndTime = 0;
let frameRates: number[] = [];
let lastFrameTime = 0;
let frameCounterInterval: number | null = null;
let isDragging = false;

/**
 * Inicia o monitoramento de performance do drag
 */
export const startDragMonitoring = () => {
  if (!ENABLE_PERFORMANCE_MONITORING) return;

  console.log('[Performance] 🔍 Iniciando monitoramento de drag and drop');
  dragStartTime = performance.now();
  isDragging = true;

  // Monitorar taxa de quadros
  if (ENABLE_FRAME_RATE_MONITORING) {
    frameRates = [];
    lastFrameTime = performance.now();
    
    // Função para calcular FPS
    const calculateFrameRate = () => {
      const now = performance.now();
      const delta = now - lastFrameTime;
      lastFrameTime = now;
      
      const fps = 1000 / delta;
      frameRates.push(fps);
      
      // Limitar array para evitar consumo excessivo de memória
      if (frameRates.length > 100) {
        frameRates.shift();
      }
      
      if (isDragging) {
        requestAnimationFrame(calculateFrameRate);
      }
    };
    
    requestAnimationFrame(calculateFrameRate);
  }

  // Monitorar uso de memória
  if (ENABLE_MEMORY_MONITORING && window.performance && (performance as any).memory) {
    frameCounterInterval = window.setInterval(() => {
      const memory = (performance as any).memory;
      console.log('[Performance] 🧠 Uso de memória:', {
        totalJSHeapSize: Math.round(memory.totalJSHeapSize / (1024 * 1024)) + ' MB',
        usedJSHeapSize: Math.round(memory.usedJSHeapSize / (1024 * 1024)) + ' MB',
        jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / (1024 * 1024)) + ' MB',
      });
    }, 1000);
  }
};

/**
 * Finaliza o monitoramento de performance do drag
 */
export const endDragMonitoring = () => {
  if (!ENABLE_PERFORMANCE_MONITORING || !isDragging) return;

  dragEndTime = performance.now();
  isDragging = false;
  
  // Calcular estatísticas
  const dragDuration = dragEndTime - dragStartTime;
  
  console.log('[Performance] ✅ Monitoramento finalizado');
  console.log('[Performance] ⏱️ Duração do drag:', dragDuration.toFixed(2) + 'ms');
  
  // Estatísticas de frame rate
  if (ENABLE_FRAME_RATE_MONITORING && frameRates.length > 0) {
    const avgFrameRate = frameRates.reduce((sum, fps) => sum + fps, 0) / frameRates.length;
    const minFrameRate = Math.min(...frameRates);
    
    console.log('[Performance] 🖥️ Frame rate médio:', avgFrameRate.toFixed(2) + ' FPS');
    console.log('[Performance] 🖥️ Frame rate mínimo:', minFrameRate.toFixed(2) + ' FPS');
    
    // Diagnóstico
    if (minFrameRate < 30) {
      console.warn('[Performance] ⚠️ Frame rate baixo detectado durante o drag');
    }
    
    if (avgFrameRate < 45) {
      console.warn('[Performance] ⚠️ Performance média abaixo do ideal');
    }
  }
  
  // Limpar intervalos
  if (frameCounterInterval !== null) {
    clearInterval(frameCounterInterval);
    frameCounterInterval = null;
  }
};

/**
 * Registra um evento de performance durante o drag
 */
export const logDragPerformanceEvent = (eventName: string) => {
  if (!ENABLE_PERFORMANCE_MONITORING || !isDragging) return;
  
  const timestamp = performance.now() - dragStartTime;
  console.log(`[Performance] 📊 ${eventName} - ${timestamp.toFixed(2)}ms`);
};

// Exportar utilitários
export const dragPerformance = {
  startMonitoring: startDragMonitoring,
  endMonitoring: endDragMonitoring,
  logEvent: logDragPerformanceEvent
};

// 🧪 SCRIPT DE TESTE DRAG AND DROP - VERIFICAÇÃO FINAL
export const testDragDropHealth = () => {
  console.log('🧪 [DragDropTester] Iniciando teste de saúde do drag and drop...');
  
  const results = {
    cssConflicts: false,
    domCleanup: true,
    contextConflicts: false,
    memoryLeaks: false,
    score: 0
  };

  // ✅ Teste 1: CSS Conflicts
  const draggingElements = document.querySelectorAll('[data-react-beautiful-dnd-dragging]');
  draggingElements.forEach((el: Element) => {
    const computedStyle = window.getComputedStyle(el as HTMLElement);
    if (computedStyle.transform && computedStyle.transform.includes('scale') && 
        computedStyle.transform.includes('rotate')) {
      console.log('❌ Conflito CSS detectado:', el);
      results.cssConflicts = true;
    }
  });

  // ✅ Teste 2: DOM Cleanup
  const orphanElements = document.querySelectorAll('[style*="position: fixed"][data-rbd-draggable-context-id]');
  if (orphanElements.length > 0) {
    console.log('⚠️ Elementos órfãos detectados:', orphanElements.length);
    results.domCleanup = false;
  }

  // ✅ Teste 3: Context Conflicts  
  const contexts = document.querySelectorAll('[data-rbd-drag-drop-context-id]');
  if (contexts.length > 1) {
    console.log('⚠️ Múltiplos DragDropContext detectados:', contexts.length);
    results.contextConflicts = true;
  }

  // ✅ Teste 4: Memory Leaks
  const draggables = document.querySelectorAll('[data-rbd-draggable-context-id]');
  const handles = document.querySelectorAll('[data-rbd-drag-handle-context-id]');
  if (draggables.length !== handles.length) {
    console.log('⚠️ Possível vazamento de memória - mismatch:', {
      draggables: draggables.length,
      handles: handles.length
    });
    results.memoryLeaks = true;
  }

  // 📊 Score Final
  results.score = (!results.cssConflicts ? 25 : 0) +
                  (results.domCleanup ? 25 : 0) +
                  (!results.contextConflicts ? 25 : 0) +
                  (!results.memoryLeaks ? 25 : 0);

  console.log('📊 [DragDropTester] Resultado Final:', {
    ...results,
    health: results.score >= 75 ? '🟢 EXCELENTE' : 
            results.score >= 50 ? '🟡 BOM' : '🔴 RUIM'
  });

  return results;
};

// 🔍 Monitor em tempo real
export const startDragDropMonitor = () => {
  console.log('🔍 [DragDropMonitor] Iniciando monitoramento em tempo real...');
  
  let dragStartTime = 0;
  let dragElement: Element | null = null;

  // Monitor início do drag
  document.addEventListener('mousedown', (e) => {
    const target = e.target as Element;
    const handle = target.closest('[data-rbd-drag-handle-context-id]');
    if (handle) {
      dragStartTime = performance.now();
      dragElement = target.closest('[data-rbd-draggable-context-id]');
      console.log('🟢 [Monitor] Drag iniciado');
    }
  });

  // Monitor durante o drag
  document.addEventListener('mousemove', (e) => {
    if (dragStartTime > 0 && dragElement) {
      const elapsed = performance.now() - dragStartTime;
      if (elapsed > 100) { // Log apenas após 100ms
        const rect = dragElement.getBoundingClientRect();
        console.log('📍 [Monitor] Drag ativo:', {
          tempo: `${elapsed.toFixed(0)}ms`,
          mouse: `${e.clientX}, ${e.clientY}`,
          elemento: `${rect.left.toFixed(0)}, ${rect.top.toFixed(0)}`
        });
      }
    }
  });

  // Monitor fim do drag
  document.addEventListener('mouseup', () => {
    if (dragStartTime > 0) {
      const totalTime = performance.now() - dragStartTime;
      console.log('🔴 [Monitor] Drag finalizado:', {
        tempoTotal: `${totalTime.toFixed(0)}ms`,
        performance: totalTime < 100 ? '🟢 EXCELENTE' : 
                    totalTime < 300 ? '🟡 BOM' : '🔴 LENTO'
      });
      
      dragStartTime = 0;
      dragElement = null;
      
      // Teste de saúde pós-drag
      setTimeout(() => testDragDropHealth(), 100);
    }
  });
};

// 🚀 Auto-inicialização em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    testDragDropHealth();
    startDragDropMonitor();
  }, 2000);
} 