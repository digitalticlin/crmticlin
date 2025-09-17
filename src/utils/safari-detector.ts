// Detecta Safari e aplica classes específicas para fixes
export const applySafariFixesIfNeeded = () => {
  // Detecta Safari
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isWebKit = 'WebkitAppearance' in document.documentElement.style;
  const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Adiciona classes ao body para targeting CSS específico
  if (isSafari || isWebKit) {
    document.body.classList.add('webkit-browser');

    if (isSafari) {
      document.body.classList.add('safari-browser');
    }

    if (isMacOS) {
      document.body.classList.add('macos-system');
    }

    if (isIOS) {
      document.body.classList.add('ios-system');
    }

    // Log para debug
    console.log('[Safari Detector] Navegador detectado:', {
      isSafari,
      isWebKit,
      isMacOS,
      isIOS,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    });

    // Aplica fix específico para backdrop-filter se necessário
    testBackdropFilterSupport();
  }
};

// Testa suporte real ao backdrop-filter
const testBackdropFilterSupport = () => {
  // Cria elemento de teste
  const testEl = document.createElement('div');
  testEl.style.cssText = 'backdrop-filter: blur(2px); -webkit-backdrop-filter: blur(2px);';

  // Verifica se o estilo foi aplicado
  const supportsBackdrop = testEl.style.backdropFilter !== undefined ||
                          testEl.style.webkitBackdropFilter !== undefined;

  if (!supportsBackdrop) {
    document.body.classList.add('no-backdrop-support');
    console.warn('[Safari Detector] backdrop-filter não suportado - aplicando fallbacks');
  } else {
    // Testa se funciona corretamente (Safari às vezes aceita mas não renderiza)
    testBackdropRendering();
  }
};

// Testa se o backdrop-filter está renderizando corretamente
const testBackdropRendering = () => {
  const testContainer = document.createElement('div');
  testContainer.style.cssText = `
    position: fixed;
    top: -100px;
    left: -100px;
    width: 50px;
    height: 50px;
    backdrop-filter: blur(10px);
    -webkit-backdrop-filter: blur(10px);
    background: rgba(255, 255, 255, 0.1);
  `;

  document.body.appendChild(testContainer);

  // Verifica após um frame de renderização
  requestAnimationFrame(() => {
    const computed = window.getComputedStyle(testContainer);
    const hasBackdrop = computed.backdropFilter !== 'none' ||
                       computed.webkitBackdropFilter !== 'none';

    if (!hasBackdrop) {
      document.body.classList.add('backdrop-render-fail');
      console.warn('[Safari Detector] backdrop-filter aceito mas não renderiza - aplicando fallbacks pesados');
    }

    // Remove elemento de teste
    document.body.removeChild(testContainer);
  });
};

// Função para aplicar fixes específicos em elementos problemáticos
export const fixSafariElement = (element: HTMLElement) => {
  if (!element) return;

  const isSafari = document.body.classList.contains('safari-browser');
  const hasBackdropIssue = document.body.classList.contains('backdrop-render-fail');

  if (isSafari || hasBackdropIssue) {
    // Força repaint/reflow para elementos com backdrop-filter
    element.style.transform = 'translateZ(0)';
    element.style.webkitTransform = 'translateZ(0)';
    element.style.willChange = 'transform';

    // Para elementos críticos, aplica background sólido como fallback
    if (hasBackdropIssue) {
      const currentBg = window.getComputedStyle(element).backgroundColor;
      if (currentBg.includes('rgba') && currentBg.includes('0.')) {
        // Aumenta opacidade do background
        element.style.backgroundColor = currentBg.replace(/0\.\d+\)/, '0.95)');
      }
    }
  }
};

// Auto-executa ao importar
if (typeof window !== 'undefined') {
  // Executa quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySafariFixesIfNeeded);
  } else {
    applySafariFixesIfNeeded();
  }
}