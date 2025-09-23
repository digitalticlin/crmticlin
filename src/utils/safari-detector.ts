// Detecta Safari e aplica classes específicas para fixes
export const applySafariFixesIfNeeded = () => {
  // Detecta Safari com melhor precisão
  const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
  const isWebKit = 'WebkitAppearance' in document.documentElement.style;
  const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

  // Detecção abrangente de versões macOS (do mais antigo ao mais novo)
  const macOSVersion = detectMacOSVersion();
  const safariVersion = detectSafariVersion();

  // Adiciona classes ao body para targeting CSS específico
  if (isSafari || isWebKit) {
    document.body.classList.add('webkit-browser');

    if (isSafari) {
      document.body.classList.add('safari-browser');
    }

    if (isMacOS) {
      document.body.classList.add('macos-system');

      // Adiciona classes específicas por versão do macOS
      if (macOSVersion) {
        document.body.classList.add(`macos-${macOSVersion.name}`);
        document.body.classList.add(`macos-version-${macOSVersion.major}`);

        // Casos específicos problemáticos
        if (macOSVersion.hasKnownBackdropIssues) {
          document.body.classList.add('macos-backdrop-issues');
        }
      }

      // Adiciona classes específicas por versão do Safari
      if (safariVersion) {
        document.body.classList.add(`safari-version-${safariVersion.major}`);
        if (safariVersion.hasKnownModalIssues) {
          document.body.classList.add('safari-modal-issues');
        }
      }
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
      macOSVersion,
      safariVersion,
      userAgent: navigator.userAgent,
      platform: navigator.platform
    });

    // Aplica fix específico para backdrop-filter se necessário
    testBackdropFilterSupport();
  }
};

// Detecta versão específica do macOS
const detectMacOSVersion = () => {
  const userAgent = navigator.userAgent;

  // Mapeamento de versões do macOS (do mais antigo ao mais novo)
  const macOSVersions = [
    { regex: /Mac OS X 10_9/, name: 'mavericks', major: 9, hasKnownBackdropIssues: true },
    { regex: /Mac OS X 10_10/, name: 'yosemite', major: 10, hasKnownBackdropIssues: true },
    { regex: /Mac OS X 10_11/, name: 'el-capitan', major: 11, hasKnownBackdropIssues: true },
    { regex: /Mac OS X 10_12/, name: 'sierra', major: 12, hasKnownBackdropIssues: true },
    { regex: /Mac OS X 10_13/, name: 'high-sierra', major: 13, hasKnownBackdropIssues: true },
    { regex: /Mac OS X 10_14/, name: 'mojave', major: 14, hasKnownBackdropIssues: true },
    { regex: /Mac OS X 10_15/, name: 'catalina', major: 15, hasKnownBackdropIssues: true },
    { regex: /Mac OS X 10_16|macOS 11/, name: 'big-sur', major: 16, hasKnownBackdropIssues: true },
    { regex: /macOS 12/, name: 'monterey', major: 17, hasKnownBackdropIssues: true },
    { regex: /macOS 13/, name: 'ventura', major: 18, hasKnownBackdropIssues: true },
    { regex: /macOS 14/, name: 'sonoma', major: 19, hasKnownBackdropIssues: true },
    { regex: /macOS 15/, name: 'sequoia', major: 20, hasKnownBackdropIssues: true },
  ];

  for (const version of macOSVersions) {
    if (version.regex.test(userAgent)) {
      return version;
    }
  }

  // Fallback para versões não identificadas (assumir problemas)
  if (navigator.platform.toUpperCase().indexOf('MAC') >= 0) {
    return { name: 'unknown', major: 0, hasKnownBackdropIssues: true };
  }

  return null;
};

// Detecta versão específica do Safari
const detectSafariVersion = () => {
  const userAgent = navigator.userAgent;
  const versionMatch = userAgent.match(/Version\/(\d+)\.(\d+)/);

  if (versionMatch) {
    const major = parseInt(versionMatch[1]);
    const minor = parseInt(versionMatch[2]);

    // Versões do Safari com problemas conhecidos de modal
    const hasKnownModalIssues = major >= 14; // Safari 14+ tem problemas com transform + backdrop-filter

    return {
      major,
      minor,
      hasKnownModalIssues
    };
  }

  return null;
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