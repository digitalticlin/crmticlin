
import React from 'react';
import { Contact } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface SelectedContactsPreviewProps {
  contacts: Contact[];
  onRemoveContact?: (contactId: string) => void;
}

export const SelectedContactsPreview: React.FC<SelectedContactsPreviewProps> = ({
  contacts,
  onRemoveContact
}) => {
  if (contacts.length === 0) {
    return null;
  }

  return (
    <div>
      <h4 className="font-medium text-gray-900 mb-3">
        Contatos selecionados ({contacts.length}):
      </h4>
      
      <div className="max-h-32 overflow-y-auto space-y-2">
        {contacts.map(contact => {
          const displayName = contact.name || contact.phone;
          const initials = displayName
            .split(' ')
            .map(word => word.charAt(0))
            .join('')
            .toUpperCase()
            .slice(0, 2);

          return (
            <div
              key={contact.id}
              className="flex items-center gap-2 bg-blue-50 rounded-lg p-2"
            >
              <Avatar className="w-6 h-6">
                <AvatarImage src={contact.avatar} alt={displayName} />
                <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                  {initials}
                </AvatarFallback>
              </Avatar>
              
              <span className="text-sm text-gray-900 flex-1 truncate">
                {displayName}
              </span>
              
              {onRemoveContact && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveContact(contact.id)}
                  className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
