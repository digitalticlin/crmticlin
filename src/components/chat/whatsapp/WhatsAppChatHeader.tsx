
import React from 'react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ArrowLeft, Phone, Video, Search, MoreVertical } from "lucide-react";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";

interface WhatsAppChatHeaderProps {
  contact: Contact;
  onBack?: () => void;
  onEditLead?: () => void;
  leadId?: string;
}

export const WhatsAppChatHeader = ({
  contact,
  onBack,
  onEditLead,
  leadId
}: WhatsAppChatHeaderProps) => {
  const displayName = contact.name || formatPhoneDisplay(contact.phone);

  return (
    <div className="flex items-center p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      {onBack && (
        <Button
          variant="ghost"
          size="icon"
          className="mr-1 md:hidden"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
      )}
      
      <div className="flex items-center gap-3 flex-1">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-green-100 text-green-600">
            {displayName.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
          <AvatarImage src={contact.avatar} alt={displayName} />
        </Avatar>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900 dark:text-white">
            {displayName}
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {contact.isOnline ? "Online" : "Offline"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-1">
        {onEditLead && (
          <Button variant="ghost" size="icon" onClick={onEditLead}>
            <MoreVertical className="h-5 w-5" />
          </Button>
        )}
        <Button variant="ghost" size="icon">
          <Phone className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="h-5 w-5" />
        </Button>
        <Button variant="ghost" size="icon">
          <Search className="h-5 w-5" />
        </Button>
      </div>
    </div>
  );
};
