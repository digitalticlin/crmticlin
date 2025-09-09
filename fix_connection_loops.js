// 🔧 CORREÇÃO PARA LOOPS DE RECONEXÃO
// Substituir a lógica shouldReconnect no connection-manager.js

// CÓDIGO ORIGINAL PROBLEMÁTICO:
/*
const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
*/

// 🛠️ CÓDIGO CORRIGIDO:
function getSafeReconnectLogic() {
  return `
        // 🔧 LÓGICA DE RECONEXÃO CORRIGIDA - APENAS EM CASOS LEGÍTIMOS
        const disconnectCode = lastDisconnect?.error?.output?.statusCode;
        const errorMessage = lastDisconnect?.error?.message || '';
        
        // ❌ NUNCA RECONECTAR EM:
        const isLoggedOut = disconnectCode === DisconnectReason.loggedOut;
        const isConflict = errorMessage.includes('conflict') || errorMessage.includes('replaced');
        const isRateLimited = disconnectCode === DisconnectReason.restartRequired;
        const isIntentionalDisconnect = instance.intentionalDisconnect === true;
        
        // ✅ APENAS RECONECTAR EM CASOS LEGÍTIMOS:
        const isNetworkError = disconnectCode === DisconnectReason.connectionLost;
        const isServerRestart = disconnectCode === DisconnectReason.connectionClosed;
        const isUnknownError = !disconnectCode && !errorMessage.includes('conflict');
        
        const shouldReconnect = !isLoggedOut && !isConflict && !isRateLimited && !isIntentionalDisconnect && 
                               (isNetworkError || isServerRestart || isUnknownError);
        
        console.log(\`\${logPrefix} 🔍 Análise de reconexão:\`, {
          disconnectCode,
          errorMessage: errorMessage.substring(0, 50),
          isLoggedOut,
          isConflict,
          isRateLimited,
          isIntentionalDisconnect,
          shouldReconnect
        });
  `;
}

// 🛠️ CÓDIGO ADICIONAL: MÉTODO PARA MARCAR DESCONEXÃO INTENCIONAL
function getIntentionalDisconnectMethod() {
  return `
  // 🚫 MARCAR INSTÂNCIA PARA NÃO RECONECTAR (chamado antes de exclusão)
  markForIntentionalDisconnect(instanceId) {
    const logPrefix = \`[ConnectionManager \${instanceId}]\`;
    console.log(\`\${logPrefix} 🚫 Marcando para desconexão intencional\`);
    
    if (this.instances[instanceId]) {
      this.instances[instanceId].intentionalDisconnect = true;
    }
    
    // Cancelar qualquer timeout de reconexão pendente
    if (this.reconnectionTimeouts && this.reconnectionTimeouts.has(instanceId)) {
      const timeoutId = this.reconnectionTimeouts.get(instanceId);
      clearTimeout(timeoutId);
      this.reconnectionTimeouts.delete(instanceId);
      console.log(\`\${logPrefix} ⏰ Timeout de reconexão cancelado\`);
    }
  }
  `;
}

// 🛠️ CÓDIGO ADICIONAL: DELAY EXPONENCIAL
function getExponentialDelayLogic() {
  return `
          // 🔄 DELAY EXPONENCIAL: 15s, 30s, 60s ao invés de sempre 15s
          const baseDelay = 15000; // 15 segundos
          const exponentialDelay = baseDelay * Math.pow(2, currentAttempts); // 15s, 30s, 60s
          const maxDelay = 60000; // Máximo 1 minuto
          const finalDelay = Math.min(exponentialDelay, maxDelay);
          
          console.log(\`\${logPrefix} 🔄 Reagendando reconexão em \${finalDelay/1000}s... (\${currentAttempts + 1}/3)\`);

          const timeoutId = setTimeout(async () => {
            try {
              // Verificar se ainda deve reconectar (pode ter sido marcada para exclusão)
              if (this.instances[instanceId]?.intentionalDisconnect) {
                console.log(\`\${logPrefix} 🚫 Reconexão cancelada - desconexão intencional\`);
                return;
              }
              
              await this.createInstance(instanceId, instance.createdByUserId, true);
            } catch (error) {
              console.error(\`\${logPrefix} ❌ Erro na reconexão:\`, error);
              instance.status = 'error';
              instance.error = error.message;
            } finally {
              // Limpar timeout do mapa
              if (this.reconnectionTimeouts) {
                this.reconnectionTimeouts.delete(instanceId);
              }
            }
          }, finalDelay);
          
          // Salvar timeout para poder cancelar depois
          if (!this.reconnectionTimeouts) {
            this.reconnectionTimeouts = new Map();
          }
          this.reconnectionTimeouts.set(instanceId, timeoutId);
  `;
}

console.log("🔧 Códigos de correção gerados!");
console.log("📁 Arquivo: fix_connection_loops.js");
console.log("📋 Próximo passo: aplicar as correções no connection-manager.js");