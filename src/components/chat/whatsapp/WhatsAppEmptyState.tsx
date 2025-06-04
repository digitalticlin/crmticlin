
export const WhatsAppEmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 relative">
      {/* Background pattern similar to WhatsApp Web */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full bg-whatsapp-chat-bg bg-cover bg-center"></div>
      </div>
      
      <div className="text-center z-10 max-w-md p-8">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl flex items-center justify-center border border-white/30">
            <svg className="w-10 h-10 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-light text-gray-800 dark:text-gray-200 mb-4">WhatsApp Web</h2>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-2">
          Envie e receba mensagens sem precisar manter o telefone conectado.
        </p>
        <p className="text-gray-600 dark:text-gray-400 text-sm mb-8">
          Use o WhatsApp em até 4 dispositivos vinculados e 1 telefone ao mesmo tempo.
        </p>
        
        <div className="p-4 bg-white/20 dark:bg-gray-800/20 backdrop-blur-xl rounded-lg border border-white/30">
          <p className="text-gray-600 dark:text-gray-400 text-xs">
            💡 Selecione uma conversa à esquerda para começar a conversar
          </p>
        </div>
      </div>
    </div>
  );
};
