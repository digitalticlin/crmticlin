
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { unifiedTags } from "@/data/unifiedFakeData";
import { useState } from "react";
import { TagsPopover } from "./TagsPopover";
import { getTagStyleClasses } from "@/utils/tagColors";
import { MessageCircle } from "lucide-react";

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

  // Nome ou número para exibição
  const displayName = contact.name || contact.phone;

  return (
    <>
      <div
        className={cn(
          "p-3 rounded-2xl hover:bg-white/20 cursor-pointer transition-all duration-200 relative group",
          isSelected && "bg-white/25 shadow-lg ring-2 ring-white/30"
        )}
        onClick={() => onSelect(contact)}
      >
        <div className="flex items-start gap-3">
          {/* Avatar */}
          <Avatar className="h-10 w-10 ring-2 ring-white/20 flex-shrink-0">
            <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-sm font-semibold">
              {displayName.split(' ').map(n => n[0]).join('').substring(0, 2)}
            </AvatarFallback>
            <AvatarImage src={contact.avatar} alt={displayName} />
          </Avatar>
          
          <div className="flex-1 min-w-0">
            {/* Header: Nome/Número + Badge de não lidas */}
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-gray-900 truncate text-sm flex-1">
                {displayName}
              </h3>
              
              {/* Badge de mensagens não lidas */}
              {hasUnreadMessages && (
                <div className="flex items-center gap-1 bg-red-500 text-white rounded-full px-2 py-1 text-xs flex-shrink-0">
                  <MessageCircle className="h-3 w-3" />
                  <span>{contact.unreadCount}</span>
                </div>
              )}
            </div>
            
            {/* Última mensagem */}
            <p className="text-xs text-gray-700 truncate mb-2 leading-relaxed">
              {contact.lastMessage || "Clique para conversar"}
            </p>
            
            {/* Tags + Company - Limitadas a 2 itens no total + botão "+x" */}
            {allTagItems.length > 0 && (
              <div className="flex items-center gap-1 overflow-hidden">
                <div className="flex items-center gap-1 flex-nowrap">
                  {/* Mostrar apenas os primeiros 2 itens (tags + company) */}
                  {visibleItems.map((item, index) => (
                    <Badge 
                      key={index}
                      variant="outline" 
                      className={cn(
                        "text-[11px] font-semibold flex-shrink-0 max-w-[80px] truncate px-2 py-0.5",
                        item.type === 'tag' 
                          ? getTagColor(item.value)
                          : 'border-2 border-gray-500 bg-gray-500/20 text-gray-800'
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
                          className="text-[11px] border-2 border-gray-500 bg-gray-500/20 text-gray-800 cursor-pointer hover:bg-gray-500/30 transition-colors flex-shrink-0 min-w-[28px] px-1.5 py-0.5"
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
      </div>
    </>
  );
};
