
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Edit, RefreshCw } from "lucide-react";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { TiclinAvatar } from "@/components/ui/ticlin-avatar";
import { ChatHeaderTags } from "../ChatHeaderTags";
import { StageSelector } from "../StageSelector";
import { useLeadTags } from "@/hooks/salesFunnel/useLeadTags";
import { useEffect } from "react";

interface WhatsAppChatHeaderProps {
  selectedContact: Contact;
  onBack: () => void;
  onEditLead: () => void;
  onRefreshMessages?: () => void;
  isRefreshing?: boolean;
}

// Função para determinar se deve mostrar nome ou telefone (estilo WhatsApp)
const getDisplayName = (contact: Contact): string => {
  // Se o nome é diferente do telefone, significa que foi editado pelo usuário
  if (contact.name && contact.name !== contact.phone && contact.name.trim() !== '') {
    return contact.name;
  }
  // Caso contrário, mostra o telefone formatado
  return formatPhoneDisplay(contact.phone);
};

export const WhatsAppChatHeader = ({
  selectedContact,
  onBack,
  onEditLead,
  onRefreshMessages,
  isRefreshing = false,
}: WhatsAppChatHeaderProps) => {
  const displayName = getDisplayName(selectedContact);
  const { leadTags, availableTags, loading, fetchTags, addTag, removeTag } = useLeadTags(selectedContact.leadId || '');

  useEffect(() => {
    if (selectedContact.leadId) {
      fetchTags();
    }
  }, [selectedContact.leadId, fetchTags]);

  return (
    <div className="flex flex-col bg-white/10 backdrop-blur-md border-b border-white/20">
      <div className="p-4 flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-gray-700 hover:text-gray-900 hover:bg-white/20"
          onClick={onBack}
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="flex items-center gap-3 flex-1 cursor-pointer hover:bg-white/20 rounded-lg p-2 -m-2 transition-colors">
          <div className="relative">
            <TiclinAvatar 
              profilePicUrl={selectedContact.profilePicUrl}
              customAvatar={selectedContact.avatar}
              name={displayName}
              size="md"
            />
            {selectedContact.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{displayName}</h3>
            <p className="text-xs text-gray-600">
              {selectedContact.isOnline ? "online" : "visto por último hoje às " + selectedContact.lastMessageTime}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {onRefreshMessages && (
            <Button 
              variant="ghost" 
              size="icon" 
              className="text-gray-700 hover:text-gray-900 hover:bg-white/20" 
              onClick={onRefreshMessages}
              disabled={isRefreshing}
            >
              <RefreshCw className={`h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
          <Button variant="ghost" size="icon" className="text-gray-700 hover:text-gray-900 hover:bg-white/20" onClick={onEditLead}>
            <Edit className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" className="text-gray-700 hover:text-gray-900 hover:bg-white/20">
            <Phone className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* Seção de Tags e Controle de Etapa */}
      {selectedContact.leadId && (
        <div className="px-4 pb-3 flex items-center gap-3">
          {/* Controle de Etapa */}
          <StageSelector 
            leadId={selectedContact.leadId}
            currentStageId={selectedContact.stageId || null}
            className="shrink-0"
          />
          
          {/* Divisor visual */}
          <div className="w-px h-6 bg-white/20" />
          
          {/* Tags */}
          <div className="flex-1">
            <ChatHeaderTags
              leadTags={leadTags}
              availableTags={availableTags}
              onAddTag={addTag}
              onRemoveTag={removeTag}
              isLoading={loading}
            />
          </div>
        </div>
      )}
    </div>
  );
};
