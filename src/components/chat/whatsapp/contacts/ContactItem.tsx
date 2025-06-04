import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { unifiedTags } from "@/data/unifiedFakeData";
import { useState } from "react";
import { TagsPopover } from "./TagsPopover";
import { getTagStyleClasses } from "@/utils/tagColors";

interface ContactItemProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: (contact: Contact) => void;
}

export const ContactItem = ({ contact, isSelected, onSelect }: ContactItemProps) => {
  const [showTagsPopover, setShowTagsPopover] = useState(false);

  const formatLastMessageTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };

  // Função para obter cor da tag sincronizada com o funil
  const getTagColor = (tagName: string) => {
    const unifiedTag = unifiedTags.find(tag => tag.name === tagName);
    if (unifiedTag) {
      // Usar as cores corretas do padrão de etiquetas
      return getTagStyleClasses(unifiedTag.color);
    }
    // Fallback para tags não encontradas
    return 'border-2 border-gray-500 bg-gray-500/20 text-gray-800';
  };

  // Handler para evitar propagação do clique no "+x"
  const handleTagsPlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTagsPopover(true);
  };

  // Combinar tags e company em um único array para o limite de 2 itens
  const allTagItems = [
    ...(contact.tags || []).map(tag => ({ type: 'tag', value: tag })),
    ...(contact.company ? [{ type: 'company', value: contact.company }] : [])
  ];

  const visibleItems = allTagItems.slice(0, 2);
  const remainingCount = allTagItems.length - 2;

  return (
    <>
      <div
        className={cn(
          "p-2 rounded-2xl hover:bg-white/20 cursor-pointer transition-all duration-200 relative group",
          isSelected && "bg-white/25 shadow-lg ring-2 ring-white/30"
        )}
        onClick={() => onSelect(contact)}
      >
        <div className="flex items-start gap-2">
          <div className="relative">
            <Avatar className="h-10 w-10 ring-2 ring-white/20">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-sm font-semibold">
                {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
              <AvatarImage src={contact.avatar} alt={contact.name} />
            </Avatar>
            {contact.isOnline && (
              <div className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-green-500 border-2 border-white shadow-sm" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold text-gray-900 truncate text-sm">{contact.name}</h3>
              <div className="flex items-center gap-2 ml-2">
                {contact.lastMessageTime && (
                  <span className="text-xs text-gray-600 whitespace-nowrap font-medium">
                    {formatLastMessageTime(contact.lastMessageTime)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <p className="text-xs text-gray-700 truncate flex-1 leading-relaxed">
                {contact.lastMessage || "Clique para conversar"}
              </p>
              
              {/* Só mostrar badge se unreadCount existir e for maior que 0 */}
              {contact.unreadCount && Number(contact.unreadCount) > 0 && (
                <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs px-1.5 py-0.5 rounded-full ml-2 shadow-sm">
                  {Number(contact.unreadCount) > 99 ? '99+' : contact.unreadCount}
                </Badge>
              )}
            </div>
            
            {/* Tags + Company - Limitadas a 2 itens no total + botão "+x" */}
            {allTagItems.length > 0 && (
              <div className="flex items-center gap-1 mt-1 overflow-hidden">
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
                    <TagsPopover
                      contactName={contact.name}
                      tags={contact.tags || []}
                      open={showTagsPopover}
                      onOpenChange={setShowTagsPopover}
                    >
                      <Badge 
                        variant="outline" 
                        className="text-[11px] border-2 border-gray-500 bg-gray-500/20 text-gray-800 cursor-pointer hover:bg-gray-500/30 transition-colors flex-shrink-0 min-w-[28px] px-1.5 py-0.5"
                        onClick={handleTagsPlusClick}
                      >
                        +{remainingCount}
                      </Badge>
                    </TagsPopover>
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
