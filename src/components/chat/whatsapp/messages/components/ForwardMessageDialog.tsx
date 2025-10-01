import React, { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Contact, Message } from '@/types/chat';
import { Search, Forward, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ForwardMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: Message | null;
  contacts: Contact[];
  currentContactId?: string;
  onForward: (targetContact: Contact) => Promise<void>;
}

export function ForwardMessageDialog({
  open,
  onOpenChange,
  message,
  contacts,
  currentContactId,
  onForward
}: ForwardMessageDialogProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isForwarding, setIsForwarding] = useState(false);

  // Filtrar contatos (excluir o contato atual e filtrar por busca)
  const filteredContacts = useMemo(() => {
    return contacts.filter(contact => {
      // Excluir contato atual
      if (contact.id === currentContactId) return false;

      // Filtrar por busca
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        return (
          contact.name?.toLowerCase().includes(query) ||
          contact.phone?.toLowerCase().includes(query) ||
          contact.company?.toLowerCase().includes(query)
        );
      }

      return true;
    });
  }, [contacts, currentContactId, searchQuery]);

  const handleForward = async (targetContact: Contact) => {
    setIsForwarding(true);
    try {
      await onForward(targetContact);
      onOpenChange(false);
      setSearchQuery(''); // Limpar busca ao fechar
    } catch (error) {
      console.error('[ForwardMessageDialog] Erro ao encaminhar:', error);
    } finally {
      setIsForwarding(false);
    }
  };

  if (!message) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-white/95 backdrop-blur-lg border border-white/20">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Forward className="w-5 h-5 text-ticlin-500" />
            Encaminhar mensagem
          </DialogTitle>
          <DialogDescription>
            Selecione um contato para encaminhar esta mensagem
          </DialogDescription>
        </DialogHeader>

        {/* Preview da mensagem */}
        <div className="p-3 bg-gray-100 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600 mb-1">Mensagem a ser encaminhada:</p>
          <div className="text-sm text-gray-800 line-clamp-3">
            {message.mediaType !== 'text' && (
              <span className="text-ticlin-600 font-medium">
                [{message.mediaType.toUpperCase()}]{' '}
              </span>
            )}
            {message.text || '(sem texto)'}
          </div>
        </div>

        {/* Campo de busca */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Buscar contato..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Lista de contatos */}
        <ScrollArea className="h-[300px] pr-4">
          {filteredContacts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
              <User className="w-12 h-12 mb-2 opacity-30" />
              <p className="text-sm">Nenhum contato encontrado</p>
            </div>
          ) : (
            <div className="space-y-1">
              {filteredContacts.map((contact) => (
                <Button
                  key={contact.id}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start p-3 h-auto",
                    "hover:bg-ticlin-50 transition-colors"
                  )}
                  onClick={() => handleForward(contact)}
                  disabled={isForwarding}
                >
                  <div className="flex items-center gap-3 w-full">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full bg-ticlin-100 flex items-center justify-center flex-shrink-0">
                      {contact.profile_pic_url || contact.profilePicUrl ? (
                        <img
                          src={contact.profile_pic_url || contact.profilePicUrl}
                          alt={contact.name}
                          className="w-full h-full rounded-full object-cover"
                        />
                      ) : (
                        <User className="w-5 h-5 text-ticlin-600" />
                      )}
                    </div>

                    {/* Informações do contato */}
                    <div className="flex-1 text-left">
                      <p className="font-medium text-gray-900">
                        {contact.name || contact.phone}
                      </p>
                      <p className="text-sm text-gray-500">
                        {contact.company ? `${contact.company} • ${contact.phone}` : contact.phone}
                      </p>
                    </div>

                    {/* Ícone de encaminhar */}
                    <Forward className="w-4 h-4 text-gray-400" />
                  </div>
                </Button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Contador de contatos */}
        <div className="text-sm text-gray-500 text-center">
          {filteredContacts.length} contato{filteredContacts.length !== 1 ? 's' : ''} disponível
          {filteredContacts.length !== 1 ? 'is' : ''}
        </div>
      </DialogContent>
    </Dialog>
  );
}
