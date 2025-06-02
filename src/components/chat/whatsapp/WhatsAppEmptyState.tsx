
export const WhatsAppEmptyState = () => {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#0b141a] relative">
      {/* Background pattern similar to WhatsApp Web */}
      <div className="absolute inset-0 opacity-5">
        <div className="h-full w-full bg-whatsapp-chat-bg bg-cover bg-center"></div>
      </div>
      
      <div className="text-center z-10">
        <div className="mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-[#202c33] flex items-center justify-center">
            <svg className="w-10 h-10 text-[#8696a0]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
          </div>
        </div>
        
        <h2 className="text-3xl font-light text-[#e9edef] mb-4">WhatsApp Web</h2>
        <p className="text-[#8696a0] text-sm max-w-md">
          Envie e receba mensagens sem precisar manter o telefone conectado.
        </p>
        <p className="text-[#8696a0] text-sm mt-2">
          Use o WhatsApp em até 4 dispositivos vinculados e 1 telefone ao mesmo tempo.
        </p>
        
        <div className="mt-8 p-4 bg-[#202c33] rounded-lg max-w-md">
          <p className="text-[#8696a0] text-xs">
            💡 Selecione uma conversa à esquerda para começar a conversar
          </p>
        </div>
      </div>
    </div>
  );
};
