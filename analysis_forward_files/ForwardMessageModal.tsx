
import React from 'react';
import { X, Send, Users, MessageSquare } from 'lucide-react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { ContactSelectionList } from './ContactSelectionList';
import { ForwardMessagePreview } from './ForwardMessagePreview';
import { SelectedContactsPreview } from './SelectedContactsPreview';
import { useContactSelection } from '@/hooks/whatsapp/forward/useContactSelection';
import { Message, Contact } from '@/types/chat';
import { ForwardProgress } from '@/types/whatsapp/forward';
import { cn } from '@/lib/utils';

interface ForwardMessageModalProps {
  isOpen: boolean;
  message: Message | null;
  contacts: Contact[];
  selectedContacts: Contact[];
  additionalComment: string;
  isForwarding: boolean;
  forwardProgress: ForwardProgress;
  onClose: () => void;
  onSelectionChange: (contacts: Contact[]) => void;
  onCommentChange: (comment: string) => void;
  onExecuteForward: () => void;
}

export const ForwardMessageModal: React.FC<ForwardMessageModalProps> = ({
  isOpen,
  message,
  contacts,
  selectedContacts,
  additionalComment,
  isForwarding,
  forwardProgress,
  onClose,
  onSelectionChange,
  onCommentChange,
  onExecuteForward
}) => {
  const {
    filteredContacts,
    selectedContactIds,
    searchQuery,
    isAllSelected,
    selectedCount,
    toggleContact,
    toggleAllContacts,
    setSearchQuery
  } = useContactSelection({
    contacts,
    onSelectionChange
  });

  if (!message) return null;

  const canForward = selectedContacts.length > 0 && !isForwarding;
  const progressPercentage = forwardProgress.total > 0 
    ? (forwardProgress.current / forwardProgress.total) * 100 
    : 0;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent 
        className={cn(
          "max-w-4xl max-h-[90vh] p-0 overflow-hidden",
          "bg-white/95 backdrop-blur-xl border border-white/30 shadow-glass-lg"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <div className="flex items-center gap-3">
            <MessageSquare className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                Encaminhar Mensagem
              </h2>
              <p className="text-sm text-gray-600">
                Selecione os contatos para encaminhar esta mensagem
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isForwarding}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex flex-1 min-h-0">
          {/* Left Panel - Contact Selection */}
          <div className="w-1/2 border-r border-white/20 flex flex-col">
            <div className="p-4 border-b border-white/10">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  Contatos ({selectedCount} selecionados)
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleAllContacts}
                  disabled={isForwarding}
                  className="text-xs"
                >
                  {isAllSelected ? 'Desmarcar todos' : 'Selecionar todos'}
                </Button>
              </div>
            </div>

            <div className="flex-1 min-h-0">
              <ContactSelectionList
                contacts={filteredContacts}
                selectedContactIds={selectedContactIds}
                searchQuery={searchQuery}
                onToggleContact={toggleContact}
                onSearchChange={setSearchQuery}
                disabled={isForwarding}
              />
            </div>
          </div>

          {/* Right Panel - Preview & Actions */}
          <div className="w-1/2 flex flex-col">
            {/* Message Preview */}
            <div className="p-4 border-b border-white/10">
              <h3 className="font-medium text-gray-900 mb-3">
                Mensagem a ser encaminhada:
              </h3>
              <ForwardMessagePreview message={message} />
            </div>

            {/* Selected Contacts Preview */}
            {selectedContacts.length > 0 && (
              <div className="p-4 border-b border-white/10">
                <SelectedContactsPreview contacts={selectedContacts} />
              </div>
            )}

            {/* Additional Comment */}
            <div className="p-4 border-b border-white/10">
              <label className="block text-sm font-medium text-gray-900 mb-2">
                Comentário adicional (opcional):
              </label>
              <Textarea
                value={additionalComment}
                onChange={(e) => onCommentChange(e.target.value)}
                placeholder="Digite um comentário para acompanhar a mensagem encaminhada..."
                disabled={isForwarding}
                rows={3}
                className="resize-none"
              />
            </div>

            {/* Progress */}
            {isForwarding && (
              <div className="p-4 border-b border-white/10">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Encaminhando...</span>
                    <span>{forwardProgress.current} de {forwardProgress.total}</span>
                  </div>
                  <Progress value={progressPercentage} className="w-full" />
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="p-4 mt-auto">
              <div className="flex justify-end gap-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  disabled={isForwarding}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={onExecuteForward}
                  disabled={!canForward}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {isForwarding 
                    ? 'Encaminhando...' 
                    : `Encaminhar para ${selectedContacts.length} contatos`
                  }
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
