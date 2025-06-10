
// CORRETOR AUTOMÁTICO PUPPETEER - Atualiza configuração baseada no diagnóstico
const fs = require('fs');
const path = require('path');

// Função para detectar o melhor executável Chrome/Chromium
function detectBestExecutable() {
  const executables = [
    '/usr/bin/google-chrome-stable',
    '/usr/bin/google-chrome', 
    '/usr/bin/chromium-browser',
    '/usr/bin/chromium'
  ];
  
  const { execSync } = require('child_process');
  
  for (const exe of executables) {
    try {
      if (fs.existsSync(exe)) {
        // Testar se o executável funciona
        execSync(`${exe} --version`, { timeout: 5000, stdio: 'ignore' });
        console.log(`✅ Executável funcional encontrado: ${exe}`);
        return exe;
      }
    } catch (error) {
      console.log(`❌ Executável não funciona: ${exe}`);
    }
  }
  
  console.log('⚠️ Nenhum executável Chrome/Chromium funcional encontrado');
  return null;
}

// Função para gerar configuração Puppeteer otimizada
function generateOptimizedConfig(executablePath) {
  return {
    headless: true,
    executablePath: executablePath || undefined,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-features=TranslateUI,VizDisplayCompositor',
      '--disable-ipc-flooding-protection',
      '--disable-extensions',
      '--disable-default-apps',
      '--disable-sync',
      '--disable-translate',
      '--disable-plugins',
      '--disable-web-security',
      '--memory-pressure-off',
      '--max_old_space_size=512',
      '--disable-web-gl',
      '--disable-webgl',
      '--disable-threaded-animation',
      '--disable-threaded-scrolling',
      '--hide-scrollbars',
      '--mute-audio',
      '--disable-logging'
    ],
    ignoreHTTPSErrors: true,
    timeout: 30000, // Reduzido de 60s para 30s
    dumpio: false   // Desabilitar em produção para performance
  };
}

// Aplicar correção
async function applyPuppeteerFix() {
  console.log('🔧 APLICANDO CORREÇÃO PUPPETEER');
  console.log('==============================');
  
  // 1. Detectar melhor executável
  const bestExecutable = detectBestExecutable();
  
  // 2. Gerar configuração otimizada
  const optimizedConfig = generateOptimizedConfig(bestExecutable);
  
  console.log('📋 Configuração otimizada gerada:');
  console.log('   Executável:', bestExecutable || 'Puppeteer padrão');
  console.log('   Args:', optimizedConfig.args.length, 'argumentos');
  console.log('   Timeout:', optimizedConfig.timeout, 'ms');
  
  // 3. Retornar configuração para aplicar no servidor
  return {
    executablePath: bestExecutable,
    config: optimizedConfig,
    recommendations: [
      bestExecutable ? `Use executablePath: '${bestExecutable}'` : 'Use Puppeteer padrão',
      'Timeout reduzido para 30s para evitar "Session closed"',
      'Args otimizados para VPS com recursos limitados',
      'dumpio: false para melhor performance em produção'
    ]
  };
}

// Executar se chamado diretamente
if (require.main === module) {
  applyPuppeteerFix().then(result => {
    console.log('\n✅ CORREÇÃO CONCLUÍDA!');
    console.log('======================');
    console.log('Recomendações:');
    result.recommendations.forEach((rec, i) => {
      console.log(`   ${i + 1}. ${rec}`);
    });
  }).catch(error => {
    console.error('❌ Erro na correção:', error);
  });
}

module.exports = { applyPuppeteerFix, detectBestExecutable, generateOptimizedConfig };
