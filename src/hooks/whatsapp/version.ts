/**
 * 🔥 WHATSAPP HOOKS VERSION CONTROL - CACHE BUSTER
 * 
 * Este arquivo força invalidação de cache do navegador
 * quando os hooks são modificados.
 */

export const WHATSAPP_HOOKS_VERSION = '2.0.0-cache-buster';
export const WHATSAPP_HOOKS_BUILD_TIME = '2025-09-09T14:30:00Z';

// Log de verificação de versão
console.warn(`🚀 WHATSAPP HOOKS VERSION: ${WHATSAPP_HOOKS_VERSION} - BUILD: ${WHATSAPP_HOOKS_BUILD_TIME}`);

export const isNewVersion = () => {
  const stored = localStorage.getItem('whatsapp_hooks_version');
  if (stored !== WHATSAPP_HOOKS_VERSION) {
    localStorage.setItem('whatsapp_hooks_version', WHATSAPP_HOOKS_VERSION);
    console.warn('🔥 NOVA VERSÃO DOS HOOKS DETECTADA - CACHE INVALIDADO!');
    return true;
  }
  return false;
};