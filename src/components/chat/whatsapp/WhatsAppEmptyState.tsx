
export const WhatsAppEmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center relative">
      <div className="text-center z-10 max-w-md p-8">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <svg className="w-8 h-8 text-gray-600" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
        
        <h3 className="text-xl font-light text-gray-900 mb-3">Selecione uma conversa</h3>
        <p className="text-gray-700 text-sm">
          Escolha uma conversa da lista à esquerda para começar a trocar mensagens.
        </p>
      </div>
    </div>
  );
};
