
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { unifiedTags } from "@/data/unifiedFakeData";
import { useState } from "react";
import { TagsPopover } from "./TagsPopover";
import { getTagStyleClasses } from "@/utils/tagColors";
import { MessageCircle, User, Clock, CheckCheck, Check, DollarSign } from "lucide-react";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { formatCurrency } from "@/lib/utils";

interface ContactItemProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: (contact: Contact) => void;
}

export const ContactItem = ({ contact, isSelected, onSelect }: ContactItemProps) => {
  const [showTagsPopover, setShowTagsPopover] = useState(false);

  // Função para obter cor da tag sincronizada com o funil
  const getTagColor = (tagName: string) => {
    const unifiedTag = unifiedTags.find(tag => tag.name === tagName);
    if (unifiedTag) {
      return getTagStyleClasses(unifiedTag.color);
    }
    return 'border-2 border-gray-500 bg-gray-500/20 text-gray-800';
  };

  // Combinar tags e company em um único array para o limite de 2 itens
  const allTagItems = [
    ...(contact.tags || []).map(tag => ({ type: 'tag', value: tag })),
    ...(contact.company ? [{ type: 'company', value: contact.company }] : [])
  ];

  const visibleItems = allTagItems.slice(0, 2);
  const remainingCount = allTagItems.length - 2;

  // Verificar se há mensagens não lidas
  const hasUnreadMessages = contact.unreadCount && contact.unreadCount > 0;

  // Nome ou número formatado para exibição
  const displayName = contact.name || formatPhoneDisplay(contact.phone);

  // Formatação do horário da última mensagem (estilo WhatsApp)
  const formatMessageTime = (timeString?: string) => {
    if (!timeString) return '';
    
    try {
      const date = new Date(timeString);
      const now = new Date();
      const diffInHours = Math.abs(now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 24) {
        return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
      } else {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
      }
    } catch {
      return timeString;
    }
  };

  // Status da mensagem (simulado - pode ser integrado com dados reais)
  const getMessageStatusIcon = () => {
    // Por enquanto, simulamos status baseado em dados disponíveis
    if (contact.lastMessage) {
      return <CheckCheck className="h-3 w-3 text-blue-500" />;
    }
    return <Check className="h-3 w-3 text-gray-400" />;
  };

  return (
    <>
      <div
        className={cn(
          "p-3 rounded-xl hover:bg-white/10 cursor-pointer transition-all duration-200 relative group border border-transparent",
          isSelected && "bg-white/15 shadow-md ring-1 ring-white/20 border-white/20"
        )}
        onClick={() => onSelect(contact)}
      >
        <div className="flex items-start gap-3">
          {/* Avatar com indicador online */}
          <div className="relative flex-shrink-0">
            <Avatar className="h-12 w-12 ring-2 ring-white/10">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-sm font-semibold">
                {displayName.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
              <AvatarImage src={contact.avatar} alt={displayName} />
            </Avatar>
            
            {/* Indicador online/offline */}
            {contact.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
            )}
          </div>
          
          <div className="flex-1 min-w-0 space-y-1">
            {/* Header: Nome + Horário + Badge não lidas */}
            <div className="flex items-center justify-between gap-2">
              <h3 className="font-semibold text-gray-900 truncate text-base flex-1">
                {displayName}
              </h3>
              
              <div className="flex items-center gap-2 flex-shrink-0">
                {/* Horário da última mensagem */}
                <span className="text-xs text-gray-500 flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatMessageTime(contact.lastMessageTime)}
                </span>
                
                {/* Badge de mensagens não lidas (estilo WhatsApp) */}
                {hasUnreadMessages && (
                  <div className="bg-green-500 text-white rounded-full min-w-[20px] h-5 flex items-center justify-center text-xs font-medium px-1.5">
                    {contact.unreadCount}
                  </div>
                )}
              </div>
            </div>
            
            {/* Última mensagem + Status */}
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-600 truncate flex-1 leading-relaxed">
                {contact.lastMessage || "Clique para conversar"}
              </p>
              {getMessageStatusIcon()}
            </div>
            
            {/* Informações do Lead */}
            <div className="flex items-center justify-between gap-2 mt-2">
              {/* Valor da negociação */}
              {contact.purchaseValue && contact.purchaseValue > 0 && (
                <div className="flex items-center gap-1 text-green-600 text-xs font-semibold">
                  <DollarSign className="h-3 w-3" />
                  <span>{formatCurrency(contact.purchaseValue)}</span>
                </div>
              )}
              
              {/* Usuário responsável */}
              {contact.assignedUser && (
                <div className="flex items-center gap-1 text-gray-500 text-xs">
                  <User className="h-3 w-3" />
                  <span className="truncate max-w-[80px]">{contact.assignedUser}</span>
                </div>
              )}
            </div>
            
            {/* Tags + Company - Footer */}
            {allTagItems.length > 0 && (
              <div className="flex items-center gap-1 overflow-hidden pt-1">
                <div className="flex items-center gap-1 flex-nowrap">
                  {/* Mostrar apenas os primeiros 2 itens (tags + company) */}
                  {visibleItems.map((item, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className={cn(
                        "text-[10px] font-medium flex-shrink-0 max-w-[70px] truncate px-1.5 py-0.5 h-5",
                        item.type === 'tag' 
                          ? getTagColor(item.value)
                          : 'border border-gray-400 bg-gray-100 text-gray-700'
                      )}
                    >
                      {item.value}
                    </Badge>
                  ))}
                  
                  {/* Botão "+x" apenas se houver mais de 2 itens no total */}
                  {remainingCount > 0 && (
                    <div onClick={(e) => e.stopPropagation()}>
                      <TagsPopover
                        contactName={contact.name}
                        tags={contact.tags || []}
                        open={showTagsPopover}
                        onOpenChange={setShowTagsPopover}
                      >
                        <Badge 
                          variant="outline" 
                          className="text-[10px] border border-gray-400 bg-gray-100 text-gray-700 cursor-pointer hover:bg-gray-200 transition-colors flex-shrink-0 min-w-[24px] px-1.5 py-0.5 h-5"
                        >
                          +{remainingCount}
                        </Badge>
                      </TagsPopover>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Linha divisória sutil */}
        <div className="absolute bottom-0 left-16 right-3 h-px bg-white/10" />
      </div>
    </>
  );
};
