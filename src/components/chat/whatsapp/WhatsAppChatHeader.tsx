
import React from 'react';
import { Contact } from '@/types/chat';
import { ArrowLeft, MoreVertical, RefreshCw, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TiclinAvatar } from '@/components/ui/ticlin-avatar';

interface WhatsAppChatHeaderProps {
  selectedContact?: Contact & { leadId?: string };
  onBack?: () => void;
  onEditLead?: () => void;
  onRefreshMessages?: () => void;
  isRefreshing?: boolean;
}

export const WhatsAppChatHeader = ({ 
  selectedContact, 
  onBack, 
  onEditLead, 
  onRefreshMessages,
  isRefreshing = false 
}: WhatsAppChatHeaderProps) => {
  if (!selectedContact) {
    return (
      <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm border-b border-white/20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gray-200 animate-pulse" />
          <div>
            <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="w-16 h-3 bg-gray-200 rounded animate-pulse mt-1" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between p-4 bg-white/10 backdrop-blur-sm border-b border-white/20">
      <div className="flex items-center gap-3">
        {onBack && (
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
        )}
        <TiclinAvatar
          profilePicUrl={selectedContact.profilePicUrl}
          name={selectedContact.name || selectedContact.phone}
          size="sm"
        />
        <div>
          <h3 className="font-medium text-white">
            {selectedContact.name || selectedContact.phone}
          </h3>
          <p className="text-sm text-white/60">
            {selectedContact.isOnline ? 'Online' : 'Offline'}
          </p>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        {onRefreshMessages && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onRefreshMessages}
            disabled={isRefreshing}
          >
            <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
          </Button>
        )}
        {onEditLead && (
          <Button variant="ghost" size="sm" onClick={onEditLead}>
            <Edit className="h-4 w-4" />
          </Button>
        )}
        <Button variant="ghost" size="sm">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};
