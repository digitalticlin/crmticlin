
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Phone, Info } from "lucide-react";
import { Contact } from "@/types/chat";

interface WhatsAppChatHeaderProps {
  selectedContact: Contact;
  onBack: () => void;
  onOpenDetails: () => void;
}

export const WhatsAppChatHeader = ({
  selectedContact,
  onBack,
  onOpenDetails,
}: WhatsAppChatHeaderProps) => {
  return (
    <div className="p-4 bg-[#202c33] border-b border-[#313d45] flex items-center gap-3">
      <Button
        variant="ghost"
        size="icon"
        className="lg:hidden text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]"
        onClick={onBack}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      
      <div className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-[#2a3942] rounded-lg p-2 -m-2 transition-colors" onClick={onOpenDetails}>
        <div className="relative">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-[#6b7c85] text-white">
              {selectedContact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </AvatarFallback>
            <AvatarImage src={selectedContact.avatar} alt={selectedContact.name} />
          </Avatar>
          {selectedContact.isOnline && (
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-[#00d9ff] border-2 border-[#202c33]" />
          )}
        </div>
        
        <div className="flex-1">
          <h3 className="font-medium text-[#e9edef]">{selectedContact.name}</h3>
          <p className="text-xs text-[#8696a0]">
            {selectedContact.isOnline ? "online" : "visto por último hoje às " + selectedContact.lastMessageTime}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon" className="text-[#8696a0] hover:text-[#e9edef] hover:bg-[#2a3942]" onClick={onOpenDetails}>
          <Info className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
