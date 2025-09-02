/**
 * Feature Flags para controle de funcionalidades
 * Permite ativar/desativar features de forma granular
 */

// Verificar localStorage para override local
const isLocalStorageForced = () => {
  try {
    return localStorage.getItem('force_dnd_enabled') === 'true';
  } catch {
    return false;
  }
};

// Verificar variáveis de ambiente de forma segura
const getEnvVar = (key: string, defaultValue: string = ''): string => {
  try {
    return import.meta.env[key] || defaultValue;
  } catch {
    return defaultValue;
  }
};

const isDevMode = (): boolean => {
  try {
    return import.meta.env.DEV || import.meta.env.MODE === 'development';
  } catch {
    return false;
  }
};

export const FEATURE_FLAGS = {
  // Controles granulares do DnD (sempre ativo)
  DND_AUTO_SCROLL: getEnvVar('VITE_DND_AUTO_SCROLL') === 'true' || true,
  DND_VISUAL_FEEDBACK: getEnvVar('VITE_DND_VISUAL_FEEDBACK') === 'true' || true,
  
  // Debug
  DND_DEBUG_MODE: isDevMode(),
} as const;

/**
 * Hook para verificar se uma feature está habilitada
 */
export const useFeatureFlag = (flag: keyof typeof FEATURE_FLAGS) => {
  return FEATURE_FLAGS[flag];
};

/**
 * DnD sempre ativo em produção
 */
export const isDndEnabledForUser = (userId?: string): boolean => {
  return true;
};

/**
 * Log de debug das feature flags (só em desenvolvimento)
 */
if (FEATURE_FLAGS.DND_DEBUG_MODE) {
  console.log('🚩 Feature Flags ativas:', FEATURE_FLAGS);
}