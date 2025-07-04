import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Phone, Video, Search, MoreVertical } from "lucide-react";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { ChatHeaderTags } from "./ChatHeaderTags";
import { useLeadTags } from "@/hooks/salesFunnel/useLeadTags";
import { useEffect } from "react";

interface ChatHeaderProps {
  selectedContact: Contact;
  onOpenContactDetails: () => void;
  onBack: () => void;
  leadId?: string;
}

export const ChatHeader = ({
  selectedContact,
  onOpenContactDetails,
  onBack,
  leadId
}: ChatHeaderProps) => {
  const displayName = selectedContact.name || formatPhoneDisplay(selectedContact.phone);
  const { leadTags, availableTags, loading, fetchTags, addTag, removeTag } = useLeadTags(leadId || '');

  useEffect(() => {
    if (leadId) {
      fetchTags();
    }
  }, [leadId, fetchTags]);

  return (
    <div className="flex flex-col border-b border-gray-200 dark:border-gray-700">
      <div className="p-3 flex items-center">
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

      {/* Seção de Tags */}
      {leadId && (
        <ChatHeaderTags
          leadTags={leadTags}
          availableTags={availableTags}
          onAddTag={addTag}
          onRemoveTag={removeTag}
          isLoading={loading}
        />
      )}
    </div>
  );
};
