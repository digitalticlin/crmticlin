
import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { MoreVertical, Phone, Video } from 'lucide-react';
import { Contact } from '@/types/chat';

interface ContactHeaderProps {
  contact: Contact;
  onOpenContactDetails?: () => void;
}

export const ContactHeader: React.FC<ContactHeaderProps> = ({
  contact,
  onOpenContactDetails
}) => {
  return (
    <div className="flex items-center justify-between p-4 border-b bg-white">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={contact.avatar || contact.profilePicUrl} />
          <AvatarFallback>
            {contact.name?.charAt(0) || contact.phone.charAt(0)}
          </AvatarFallback>
        </Avatar>
        
        <div className="flex-1">
          <h3 className="font-medium text-gray-900">
            {contact.name || contact.phone}
          </h3>
          <p className="text-sm text-gray-500">
            {contact.isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Phone className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="h-9 w-9 p-0">
          <Video className="h-4 w-4" />
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          className="h-9 w-9 p-0"
          onClick={onOpenContactDetails}
        >
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
