
import React, { memo } from "react";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { TagsPopover } from "./TagsPopover";
import { StageDropdownMenu } from "../../sales/funnel/StageDropdownMenu";
import { ContactTags } from "./ContactTags";

interface ContactItemProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: (contact: Contact) => void;
  onStageChange?: (contactId: string, newStage: any) => void;
  onTagsChange?: (contactId: string) => void;
}

// ✅ OTIMIZAÇÃO: Memoização otimizada com comparação profunda apenas para campos relevantes
export const ContactItem = memo(({
  contact,
  isSelected,
  onSelect,
  onStageChange,
  onTagsChange
}: ContactItemProps) => {
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
              onTagsChange={() => onTagsChange?.(contact.id)}
            />
            
            <StageDropdownMenu
              contact={contact}
              currentStageId={contact.stageId || null} // ✅ CORREÇÃO SEGURA: Garantir que seja null se undefined
              onStageChange={(newStage) => onStageChange?.(contact.id, newStage)}
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
}, (prevProps, nextProps) => {
  // ✅ OTIMIZAÇÃO CRÍTICA: Comparação otimizada para evitar re-renders desnecessários
  const contactChanged = 
    prevProps.contact.id !== nextProps.contact.id ||
    prevProps.contact.name !== nextProps.contact.name ||
    prevProps.contact.lastMessage !== nextProps.contact.lastMessage ||
    prevProps.contact.lastMessageTime !== nextProps.contact.lastMessageTime ||
    prevProps.contact.unreadCount !== nextProps.contact.unreadCount ||
    prevProps.contact.stageId !== nextProps.contact.stageId;

  const selectionChanged = prevProps.isSelected !== nextProps.isSelected;

  // ✅ OTIMIZAÇÃO: Comparação inteligente de tags (apenas se contacto não mudou)
  let tagsChanged = false;
  if (!contactChanged) {
    const prevTags = prevProps.contact.tags || [];
    const nextTags = nextProps.contact.tags || [];
    
    tagsChanged = prevTags.length !== nextTags.length ||
      prevTags.some((tag, index) => 
        !nextTags[index] || 
        tag.id !== nextTags[index].id || 
        tag.name !== nextTags[index].name ||
        tag.color !== nextTags[index].color
      );
  }

  // ✅ RETORNAR: true = não re-renderizar, false = re-renderizar
  const shouldNotRerender = !contactChanged && !selectionChanged && !tagsChanged;
  
  return shouldNotRerender;
});

ContactItem.displayName = 'ContactItem';
