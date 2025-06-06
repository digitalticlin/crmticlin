
// ARQUIVO REMOVIDO - Polling não é mais usado no novo fluxo isolado
// As funções agora são chamadas sob demanda pelo usuário

export const useAutomaticQRPolling = () => {
  return {
    isPolling: false,
    currentAttempt: 0,
    maxAttempts: 0,
    startPolling: () => {},
    stopPolling: () => {}
  };
};
