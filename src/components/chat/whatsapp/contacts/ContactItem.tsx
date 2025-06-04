
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Contact } from "@/types/chat";
import { unifiedTags } from "@/data/unifiedFakeData";
import { useState } from "react";
import { TagsModal } from "./TagsModal";

interface ContactItemProps {
  contact: Contact;
  isSelected: boolean;
  onSelect: (contact: Contact) => void;
}

export const ContactItem = ({ contact, isSelected, onSelect }: ContactItemProps) => {
  const [showTagsModal, setShowTagsModal] = useState(false);

  const formatLastMessageTime = (timeString: string) => {
    if (!timeString) return '';
    return timeString;
  };

  // Função para obter cor da tag sincronizada com o funil
  const getTagColor = (tagName: string) => {
    const unifiedTag = unifiedTags.find(tag => tag.name === tagName);
    if (unifiedTag) {
      // Converter a cor do funil para o estilo do chat com opacidade
      return `bg-white/40 text-black border-white/20`;
    }
    // Fallback para tags não encontradas
    return 'bg-white/40 text-black border-white/20';
  };

  const handleTagsPlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowTagsModal(true);
  };

  return (
    <>
      <div
        className={cn(
          "p-4 rounded-2xl hover:bg-white/20 cursor-pointer transition-all duration-200 relative group",
          isSelected && "bg-white/25 shadow-lg ring-2 ring-white/30"
        )}
        onClick={() => onSelect(contact)}
      >
        <div className="flex items-start gap-4">
          <div className="relative">
            <Avatar className="h-14 w-14 ring-2 ring-white/20">
              <AvatarFallback className="bg-gradient-to-br from-green-500 to-green-600 text-white text-lg font-semibold">
                {contact.name.split(' ').map(n => n[0]).join('').substring(0, 2)}
              </AvatarFallback>
              <AvatarImage src={contact.avatar} alt={contact.name} />
            </Avatar>
            {contact.isOnline && (
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-green-500 border-2 border-white shadow-sm" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-semibold text-gray-900 truncate text-lg">{contact.name}</h3>
              <div className="flex items-center gap-2 ml-2">
                {contact.lastMessageTime && (
                  <span className="text-sm text-gray-600 whitespace-nowrap font-medium">
                    {formatLastMessageTime(contact.lastMessageTime)}
                  </span>
                )}
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-2">
              <p className="text-sm text-gray-700 truncate flex-1 leading-relaxed">
                {contact.lastMessage || "Clique para conversar"}
              </p>
              
              {/* Só mostrar o badge se unreadCount for maior que 0 */}
              {contact.unreadCount && contact.unreadCount > 0 && (
                <Badge className="bg-green-500 hover:bg-green-600 text-white text-xs px-2 py-1 rounded-full ml-2 shadow-sm">
                  {contact.unreadCount > 99 ? '99+' : contact.unreadCount}
                </Badge>
              )}
            </div>
            
            {/* Tags do Lead - Sincronizadas com o funil */}
            {contact.tags && contact.tags.length > 0 && (
              <div className="flex flex-nowrap gap-1 mt-2 overflow-hidden">
                {contact.tags.slice(0, 2).map((tag, index) => (
                  <Badge 
                    key={index}
                    variant="outline" 
                    className={cn(
                      "text-xs border backdrop-blur-[2px] shadow-md font-semibold flex-shrink-0",
                      getTagColor(tag)
                    )}
                  >
                    {tag}
                  </Badge>
                ))}
                {contact.tags.length > 2 && (
                  <Badge 
                    variant="outline" 
                    className="text-xs border-white/20 text-black bg-white/30 backdrop-blur-[2px] shadow-md cursor-pointer hover:bg-white/40 transition-colors flex-shrink-0"
                    onClick={handleTagsPlusClick}
                  >
                    +{contact.tags.length - 2}
                  </Badge>
                )}
              </div>
            )}
            
            {/* Company Info */}
            {contact.company && (
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className="text-xs border-white/20 text-black bg-white/30 backdrop-blur-[2px] shadow-md">
                  {contact.company}
                </Badge>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal de Tags */}
      <TagsModal
        isOpen={showTagsModal}
        onClose={() => setShowTagsModal(false)}
        contactName={contact.name}
        tags={contact.tags || []}
      />
    </>
  );
};
