
import React from 'react';
import { Contact } from '@/types/chat';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { formatPhoneDisplay } from '@/utils/phoneFormatter';
import { ContactTags } from './ContactTags';
import { StageDropdownMenu } from './StageDropdownMenu';
import { TagsPopover } from './TagsPopover';
import { cn } from '@/lib/utils';

interface ContactItemProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: (contact: Contact) => void;
  onStageChange: (contactId: string, newStage: string) => void;
  onTagsChange: (contactId: string) => void;
}

export const ContactItem = ({
  contact,
  isSelected,
  onSelect,
  onStageChange,
  onTagsChange
}: ContactItemProps) => {
  // 🐛 DEBUG: Log para verificar re-renderização do item
  console.log('[ContactItem] 🔄 Re-renderizando contato:', {
    id: contact.id,
    name: contact.name,
    leadId: contact.leadId,
    tagsCount: contact.tags?.length || 0,
    tags: contact.tags?.map(t => ({ id: t.id, name: t.name })) || [],
    timestamp: new Date().toISOString()
  });
  const displayName = contact.name || formatPhoneDisplay(contact.phone);
  // ✅ CORREÇÃO: Condição mais rigorosa para evitar mostrar "0"
  const hasUnread = contact.unreadCount && contact.unreadCount > 0;

  return (
    <div
      className={cn(
        "flex items-center gap-3 p-3.5 border-b border-gray-100 cursor-pointer transition-all duration-200",
        "hover:bg-blue-50/30 hover:border-blue-200/50",
        isSelected && "bg-blue-50 border-blue-200 shadow-sm",
        hasUnread && !isSelected && "bg-green-50/30 border-green-200/50" // Nova mensagem
      )}
      onClick={() => onSelect(contact)}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage 
            src={contact.profilePicUrl || contact.avatar} 
            alt={displayName}
          />
          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-purple-100 text-blue-700 font-medium">
            {displayName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* ✅ CORREÇÃO: Indicador de nova mensagem - só aparece se houver mensagens não lidas */}
        {hasUnread && contact.unreadCount > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center animate-pulse">
            <Badge variant="secondary" className="bg-green-500 text-white text-xs px-1.5 py-0.5 min-w-0 h-auto">
              {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
            </Badge>
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 space-y-1">
        <div className="flex items-center justify-between">
          <h4 className={cn(
            "text-sm truncate max-w-[140px]",
            hasUnread ? "font-bold text-gray-900" : "font-medium text-gray-700"
          )}>
            {displayName}
          </h4>
          
          <div className="flex items-center gap-1.5">
            <TagsPopover 
              currentTags={contact.tags || []}
              leadId={contact.leadId} // ✅ PASSAR leadId
              onTagsChange={() => onTagsChange(contact.id)}
            />
            
            <StageDropdownMenu
              contact={contact}
              currentStageId={contact.stageId || null} // ✅ CORREÇÃO SEGURA: Garantir que seja null se undefined
              onStageChange={(newStage) => onStageChange(contact.id, newStage)}
            />
          </div>
        </div>

        {/* Última mensagem */}
        {contact.lastMessage && (
          <p className={cn(
            "text-xs truncate max-w-[200px]",
            hasUnread ? "text-gray-800 font-medium" : "text-gray-500"
          )}>
            {contact.lastMessage}
          </p>
        )}

        {/* Horário da última mensagem */}
        {contact.lastMessageTime && (
          <p className="text-xs text-gray-400">
            {new Date(contact.lastMessageTime).toLocaleTimeString('pt-BR', {
              hour: '2-digit',
              minute: '2-digit'
            })}
          </p>
        )}

        {/* Tags do contato */}
        <ContactTags tags={contact.tags || []} />
      </div>
    </div>
  );
};

ContactItem.displayName = 'ContactItem';
