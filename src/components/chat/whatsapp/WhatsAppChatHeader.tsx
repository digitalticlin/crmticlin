import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Edit, RefreshCw } from "lucide-react";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { TiclinAvatar } from "@/components/ui/ticlin-avatar";

interface WhatsAppChatHeaderProps {
  selectedContact: Contact;
  onBack: () => void;
  onEditLead: () => void;
  onRefreshMessages?: () => void;
  isRefreshing?: boolean;
}

// Função para determinar se deve mostrar nome ou telefone (estilo WhatsApp)
const getDisplayName = (contact: Contact): string => {
  // Se o nome é diferente do telefone, significa que foi editado pelo usuário
  if (contact.name && contact.name !== contact.phone && contact.name.trim() !== '') {
    return contact.name;
  }
  // Caso contrário, mostra o telefone formatado
  return formatPhoneDisplay(contact.phone);
};

export const WhatsAppChatHeader = ({
  selectedContact,
  onBack,
  onEditLead,
  onRefreshMessages,
  isRefreshing = false,
}: WhatsAppChatHeaderProps) => {
  const displayName = getDisplayName(selectedContact);

  return (
    <div className="p-4 bg-white/10 backdrop-blur-md border-b border-white/20 flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-gray-700 hover:text-gray-900 hover:bg-white/20"
        onClick={onBack}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      
      <div className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-white/20 rounded-lg p-2 -m-2 transition-colors">
        <div className="relative">
          <TiclinAvatar 
            profilePicUrl={selectedContact.profilePicUrl}
            customAvatar={selectedContact.avatar}
            name={displayName}
            size="md"
          />
          {selectedContact.isOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">{displayName}</h3>
          <p className="text-xs text-gray-600">
            {selectedContact.isOnline ? "online" : "visto por último hoje às " + selectedContact.lastMessageTime}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {onRefreshMessages && (
          <Button 
            variant="ghost" 
            size="icon" 
            className="text-gray-700 hover:text-gray-900 hover:bg-white/20" 
            onClick={onRefreshMessages}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
        <Button variant="ghost" size="icon" className="text-gray-700 hover:text-gray-900 hover:bg-white/20" onClick={onEditLead}>
          <Edit className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-gray-700 hover:text-gray-900 hover:bg-white/20">
          <Phone className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
