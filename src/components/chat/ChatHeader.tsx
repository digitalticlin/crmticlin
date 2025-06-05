
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Phone, Video, Search, MoreVertical } from "lucide-react";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";

interface ChatHeaderProps {
  selectedContact: Contact;
  onOpenContactDetails: () => void;
  onBack: () => void;
}

export const ChatHeader = ({
  selectedContact,
  onOpenContactDetails,
  onBack,
}: ChatHeaderProps) => {
  // ATUALIZADO: Usar formatPhoneDisplay quando nome não disponível
  const displayName = selectedContact.name || formatPhoneDisplay(selectedContact.phone);

  return (
    <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex items-center">
      <Button
        variant="ghost"
        size="icon"
        className="mr-1 md:hidden"
        onClick={onBack}
      >
        <ArrowLeft className="h-5 w-5" />
      </Button>
      
      <div
        className="flex items-center gap-3 flex-1 cursor-pointer"
        onClick={onOpenContactDetails}
      >
        <Avatar className="h-10 w-10">
          <AvatarFallback>
            {displayName.split(' ').map(n => n[0]).join('')}
          </AvatarFallback>
          <AvatarImage src={selectedContact.avatar} alt={displayName} />
        </Avatar>
        
        <div>
          <h3 className="font-medium">{displayName}</h3>
          <p className="text-xs text-muted-foreground">
            {selectedContact.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
