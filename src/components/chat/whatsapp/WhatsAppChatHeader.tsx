
import { Button } from "@/components/ui/button";
import { ArrowLeft, Phone, Edit, RefreshCw } from "lucide-react";
import { Contact } from "@/types/chat";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";
import { TiclinAvatar } from "@/components/ui/ticlin-avatar";
import { ChatHeaderTags } from "../ChatHeaderTags";
import { StageSelector } from "../StageSelector";
import { useLeadTags } from "@/hooks/salesFunnel/useLeadTags";
import { useEffect, useState } from "react";

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
  // ✅ NOVO: Estado local para sincronização em tempo real
  const [localContact, setLocalContact] = useState<Contact>(selectedContact);
  const displayName = getDisplayName(localContact);
  const { leadTags, availableTags, loading, fetchTags, addTag, removeTag } = useLeadTags(localContact.leadId || '');

  // ✅ NOVO: Atualizar estado local quando selectedContact muda
  useEffect(() => {
    setLocalContact(selectedContact);
  }, [selectedContact.id]);

  // ✅ NOVO: Listener para atualizações em tempo real
  useEffect(() => {
    const handleContactUpdate = (event: CustomEvent) => {
      const { leadId, updatedContact } = event.detail;
      
      if (leadId === localContact.leadId || leadId === localContact.id) {
        console.log('[WhatsAppChatHeader] 🔄 Atualizando contato no header:', {
          leadId,
          newName: updatedContact.name,
          oldName: localContact.name
        });
        
        setLocalContact(prev => ({
          ...prev,
          ...updatedContact
        }));
      }
    };

    const handleContactNameUpdate = (event: CustomEvent) => {
      const { leadId, contactId, newName } = event.detail;
      
      if (leadId === localContact.leadId || contactId === localContact.id) {
        console.log('[WhatsAppChatHeader] 📝 Atualizando nome no header:', {
          leadId,
          contactId,
          newName,
          oldName: localContact.name
        });
        
        setLocalContact(prev => ({
          ...prev,
          name: newName
        }));
      }
    };

    const handleTagsRefresh = () => {
      if (localContact.leadId) {
        console.log('[WhatsAppChatHeader] 🏷️ Atualizando tags no header');
        fetchTags();
      }
    };

    window.addEventListener('leadUpdated', handleContactUpdate);
    window.addEventListener('contactNameUpdated', handleContactNameUpdate);
    window.addEventListener('refreshLeadTags', handleTagsRefresh);

    return () => {
      window.removeEventListener('leadUpdated', handleContactUpdate);
      window.removeEventListener('contactNameUpdated', handleContactNameUpdate);
      window.removeEventListener('refreshLeadTags', handleTagsRefresh);
    };
  }, [localContact.leadId, localContact.id, fetchTags]);

  useEffect(() => {
    if (localContact.leadId) {
      fetchTags();
    }
  }, [localContact.leadId, fetchTags]);

  return (
    <div className="flex flex-col backdrop-blur-sm bg-gradient-to-r from-white/10 to-white/5 border-b border-white/20">
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
              profilePicUrl={localContact.profilePicUrl}
              customAvatar={localContact.avatar}
              name={displayName}
              size="md"
            />
            {localContact.isOnline && (
              <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-white" />
            )}
          </div>
          
          <div className="flex-1">
            <h3 className="font-medium text-gray-900">{displayName}</h3>
            <p className="text-xs text-gray-600">
              {localContact.isOnline ? "online" : "visto por último hoje às " + localContact.lastMessageTime}
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
      {localContact.leadId && (
        <div className="px-4 pb-3 flex items-center gap-3">
          {/* Controle de Etapa */}
          <StageSelector 
            leadId={localContact.leadId}
            currentStageId={localContact.stageId || null}
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
