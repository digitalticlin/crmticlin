
export const WhatsAppEmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0b141a] relative">
      {/* Background pattern similar to WhatsApp Web */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full bg-whatsapp-chat-bg bg-cover bg-center"></div>
      </div>
      
      <div className="text-center z-10 max-w-md p-8">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[#2a3942] flex items-center justify-center border border-[#313d45]">
            <svg className="w-8 h-8 text-[#8696a0]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
        
        <h3 className="text-xl font-light text-[#e9edef] mb-3">Selecione uma conversa</h3>
        <p className="text-[#8696a0] text-sm">
          Escolha uma conversa da lista à esquerda para começar a trocar mensagens.
        </p>
      </div>
    </div>
  );
};
