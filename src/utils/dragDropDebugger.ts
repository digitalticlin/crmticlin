// React Beautiful DND Debugger
console.log('🔧 Drag Drop Debugger carregado');

// Função para verificar se há elementos interferindo
export const debugDragDropElements = () => {
  console.group('🔍 [DragDropDebugger] Análise de elementos');
  
  // Verificar se há elementos com transform
  const elementsWithTransform = document.querySelectorAll('[style*="transform"]');
  console.log('📐 Elementos com transform:', elementsWithTransform.length);
  
  // Verificar elementos react-beautiful-dnd
  const rbdElements = document.querySelectorAll('[data-rbd-draggable-context-id]');
  console.log('🎯 Elementos RBD:', rbdElements.length);
  
  // Verificar se há overflow: hidden interferindo
  const hiddenElements = document.querySelectorAll('[style*="overflow: hidden"]');
  console.log('🚫 Elementos com overflow hidden:', hiddenElements.length);
  
  // Verificar pointer-events
  const pointerEventsNone = document.querySelectorAll('[style*="pointer-events: none"]');
  console.log('👆 Elementos com pointer-events none:', pointerEventsNone.length);
  
  console.groupEnd();
};

// Monitorar eventos de drag
export const setupDragMonitoring = () => {
  console.log('🎬 [DragDropDebugger] Configurando monitoramento');
  
  // Monitorar mouse move durante drag
  let isDragging = false;
  let dragElement: Element | null = null;
  
  document.addEventListener('mousedown', (e) => {
    const target = e.target as Element;
    if (target.closest('[data-rbd-drag-handle-context-id]')) {
      console.log('🟢 Mouse down em drag handle');
      isDragging = true;
      dragElement = target.closest('[data-rbd-draggable-context-id]');
    }
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging && dragElement) {
      const rect = dragElement.getBoundingClientRect();
      console.log('📍 Mouse:', e.clientX, e.clientY, 'Element:', rect.left, rect.top);
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      console.log('🔴 Drag finalizado');
      isDragging = false;
      dragElement = null;
    }
  });
};

// Verificar se react-beautiful-dnd está funcionando
export const checkReactBeautifulDnd = () => {
  console.group('🧪 [DragDropDebugger] Verificação React Beautiful DND');
  
  // Verificar se a biblioteca foi importada
  const rbdScript = document.querySelector('script[src*="react-beautiful-dnd"]');
  console.log('📦 Script RBD encontrado:', !!rbdScript);
  
  // Verificar se há DragDropContext
  const dragContext = document.querySelector('[data-rbd-drag-handle-context-id]');
  console.log('🎯 DragDropContext ativo:', !!dragContext);
  
  // Verificar se há elementos draggable
  const draggables = document.querySelectorAll('[data-rbd-draggable-context-id]');
  console.log('🎪 Elementos draggable:', draggables.length);
  
  // Verificar se há droppables
  const droppables = document.querySelectorAll('[data-rbd-droppable-context-id]');
  console.log('🎯 Elementos droppable:', droppables.length);
  
  console.groupEnd();
};

// Função principal de debug
export const runDragDropDiagnostic = () => {
  console.log('🚀 [DragDropDebugger] Iniciando diagnóstico completo');
  
  debugDragDropElements();
  checkReactBeautifulDnd();
  setupDragMonitoring();
  
  console.log('✅ [DragDropDebugger] Diagnóstico concluído - verifique os logs acima');
};

// Auto-executar em desenvolvimento
if (process.env.NODE_ENV === 'development') {
  // Aguardar o DOM carregar
  setTimeout(runDragDropDiagnostic, 2000);
} 