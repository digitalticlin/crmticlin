
// Re-export all database functions from the index file
export * from './database';
export * from './useWhatsAppDatabase';

// Adiciona função para salvar status de tentativa de conexão
export const updateConnectionAttempt = async (instanceId: string, success: boolean, errorMessage?: string) => {
  try {
    console.log(`Registrando tentativa de conexão para ${instanceId}: ${success ? 'Sucesso' : 'Falha'}`);
    // Aqui você pode implementar lógica para registrar tentativas no banco
    // Isso seria útil para monitoramento e depuração
    return true;
  } catch (error) {
    console.error(`Erro ao registrar tentativa de conexão: ${error}`);
    return false;
  }
};
