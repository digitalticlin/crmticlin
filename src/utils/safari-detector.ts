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

    // Log detalhado para debug - SISTEMA OPERACIONAL E NAVEGADOR
    console.group('🔍 [SISTEMA OPERACIONAL DEBUG]');
    console.log('═══════════════════════════════════════════');
    console.log('📱 Sistema Operacional:', {
      platform: navigator.platform,
      userAgent: navigator.userAgent,
      vendor: navigator.vendor,
      appVersion: navigator.appVersion
    });
    console.log('═══════════════════════════════════════════');
    console.log('🌐 Detecção de Navegador:', {
      isSafari,
      isWebKit,
      isMacOS,
      isIOS,
      isChrome: /Chrome/.test(navigator.userAgent),
      isFirefox: /Firefox/.test(navigator.userAgent),
      isEdge: /Edg/.test(navigator.userAgent)
    });
    console.log('═══════════════════════════════════════════');
    console.log('🍎 macOS Version:', macOSVersion);
    console.log('🧭 Safari Version:', safariVersion);
    console.log('═══════════════════════════════════════════');
    console.log('🎨 Classes CSS aplicadas ao body:',
      Array.from(document.body.classList)
    );
    console.log('═══════════════════════════════════════════');
    console.groupEnd();

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

  console.group('🎨 [TESTE BACKDROP-FILTER]');
  console.log('═══════════════════════════════════════════');
  console.log('🔍 Suporte CSS backdrop-filter:', {
    supportsBackdrop,
    'testEl.style.backdropFilter': testEl.style.backdropFilter,
    'testEl.style.webkitBackdropFilter': testEl.style.webkitBackdropFilter
  });

  if (!supportsBackdrop) {
    document.body.classList.add('no-backdrop-support');
    console.error('❌ backdrop-filter NÃO suportado - aplicando fallbacks');
    console.log('🛠️ Classe aplicada: no-backdrop-support');
  } else {
    console.log('✅ backdrop-filter SUPORTADO pelo CSS');
    console.log('🔄 Testando renderização real...');
    // Testa se funciona corretamente (Safari às vezes aceita mas não renderiza)
    testBackdropRendering();
  }
  console.log('═══════════════════════════════════════════');
  console.groupEnd();
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

    console.group('🎭 [TESTE RENDERIZAÇÃO BACKDROP]');
    console.log('═══════════════════════════════════════════');
    console.log('🖼️ Computed Style do elemento de teste:', {
      backdropFilter: computed.backdropFilter,
      webkitBackdropFilter: computed.webkitBackdropFilter,
      backgroundColor: computed.backgroundColor,
      hasBackdrop
    });

    if (!hasBackdrop) {
      document.body.classList.add('backdrop-render-fail');
      console.error('❌ FALHA CRÍTICA: backdrop-filter aceito mas NÃO RENDERIZA!');
      console.log('🛠️ Classe aplicada: backdrop-render-fail');
      console.log('⚠️ Cards podem aparecer 100% brancos sem transparência');
      console.log('💡 Aplicando fallbacks pesados com backgrounds sólidos...');
    } else {
      console.log('✅ backdrop-filter RENDERIZA CORRETAMENTE');
    }

    console.log('═══════════════════════════════════════════');
    console.groupEnd();

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

// Função de debug para verificar elementos com backdrop na página
export const debugBackdropElements = () => {
  console.group('🔍 [DEBUG ELEMENTOS BACKDROP]');
  console.log('═══════════════════════════════════════════');

  // Busca todos os elementos com classes backdrop
  const backdropElements = document.querySelectorAll('[class*="backdrop-blur"]');

  console.log(`📊 Total de elementos com backdrop encontrados: ${backdropElements.length}`);
  console.log('═══════════════════════════════════════════');

  backdropElements.forEach((el, index) => {
    const computed = window.getComputedStyle(el as HTMLElement);
    const classList = Array.from((el as HTMLElement).classList);

    console.group(`Elemento ${index + 1}/${backdropElements.length}`);
    console.log('🏷️ Classes:', classList.filter(c => c.includes('backdrop')));
    console.log('🎨 Computed Styles:', {
      backdropFilter: computed.backdropFilter,
      webkitBackdropFilter: computed.webkitBackdropFilter,
      backgroundColor: computed.backgroundColor,
      opacity: computed.opacity,
      display: computed.display,
      visibility: computed.visibility
    });
    console.log('📐 Dimensões:', {
      width: computed.width,
      height: computed.height,
      position: computed.position
    });
    console.log('🔗 Elemento:', el);
    console.groupEnd();
  });

  console.log('═══════════════════════════════════════════');
  console.groupEnd();
};

// Função para verificar quais regras CSS estão sendo aplicadas
export const debugCSSRules = () => {
  console.group('📜 [DEBUG REGRAS CSS SAFARI]');
  console.log('═══════════════════════════════════════════');

  const testElement = document.createElement('div');
  testElement.className = 'backdrop-blur-md';
  testElement.style.cssText = 'position: fixed; top: -100px; left: -100px; width: 50px; height: 50px;';
  document.body.appendChild(testElement);

  const computed = window.getComputedStyle(testElement);

  console.log('🧪 Teste elemento .backdrop-blur-md:', {
    backdropFilter: computed.backdropFilter,
    webkitBackdropFilter: computed.webkitBackdropFilter,
    backgroundColor: computed.backgroundColor,
    border: computed.border
  });

  // Testa com classes do body
  const bodyClasses = Array.from(document.body.classList);
  console.log('🏷️ Classes no body:', bodyClasses);

  console.log('✅ Regras que DEVEM estar ativas:');
  if (bodyClasses.includes('macos-system')) {
    console.log('  - body.macos-system .backdrop-blur-md { background-color: rgba(255,255,255,0.95) }');
  }
  if (bodyClasses.includes('safari-browser')) {
    console.log('  - body.safari-browser .backdrop-blur-md { background-color: rgba(255,255,255,0.95) }');
  }
  if (bodyClasses.includes('backdrop-render-fail')) {
    console.log('  - body.backdrop-render-fail [class*="backdrop-blur"] { background-color: rgba(255,255,255,0.98) }');
    console.warn('  ⚠️ ATENÇÃO: backdrop-filter desabilitado devido a falha na renderização!');
  }
  if (bodyClasses.includes('no-backdrop-support')) {
    console.log('  - body.no-backdrop-support [class*="backdrop-blur"] { background-color: rgba(255,255,255,0.98) }');
    console.warn('  ⚠️ ATENÇÃO: backdrop-filter não suportado!');
  }

  document.body.removeChild(testElement);

  console.log('═══════════════════════════════════════════');
  console.groupEnd();
};

// Expõe funções de debug globalmente
if (typeof window !== 'undefined') {
  (window as any).debugBackdropElements = debugBackdropElements;
  (window as any).debugCSSRules = debugCSSRules;
  console.log('✅ Funções de debug disponíveis:');
  console.log('  - window.debugBackdropElements()');
  console.log('  - window.debugCSSRules()');
}

// Auto-executa ao importar
if (typeof window !== 'undefined') {
  // Executa quando DOM estiver pronto
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applySafariFixesIfNeeded);
  } else {
    applySafariFixesIfNeeded();
  }

  // Adiciona listener para executar debug após carregamento completo
  window.addEventListener('load', () => {
    console.log('═══════════════════════════════════════════');
    console.log('🎬 Página completamente carregada - executando debug final...');
    console.log('═══════════════════════════════════════════');

    // Aguarda mais um frame para garantir que tudo foi renderizado
    setTimeout(() => {
      debugBackdropElements();
      debugCSSRules();

      // Resume das classes aplicadas
      console.group('📋 [RESUMO FINAL]');
      console.log('═══════════════════════════════════════════');
      console.log('🎨 Classes CSS finais no body:', Array.from(document.body.classList));
      console.log('🌍 User Agent:', navigator.userAgent);
      console.log('💻 Platform:', navigator.platform);
      console.log('═══════════════════════════════════════════');
      console.log('💡 Para re-executar debug:');
      console.log('  - window.debugBackdropElements()');
      console.log('  - window.debugCSSRules()');
      console.log('═══════════════════════════════════════════');
      console.groupEnd();
    }, 500);
  });
}