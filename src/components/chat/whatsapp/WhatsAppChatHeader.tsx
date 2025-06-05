
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Phone, Edit } from "lucide-react";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";

interface WhatsAppChatHeaderProps {
  selectedContact: Contact;
  onBack: () => void;
  onEditLead: () => void;
}

export const WhatsAppChatHeader = ({
  selectedContact,
  onBack,
  onEditLead,
}: WhatsAppChatHeaderProps) => {
  // ATUALIZADO: Usar formatPhoneDisplay quando nome não disponível
  const displayName = selectedContact.name || formatPhoneDisplay(selectedContact.phone);

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
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              {displayName.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </AvatarFallback>
            <AvatarImage src={selectedContact.avatar} alt={displayName} />
          </Avatar>
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
