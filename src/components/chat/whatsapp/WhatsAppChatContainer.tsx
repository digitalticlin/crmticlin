import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  ChangeEvent,
} from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { Message } from '@/types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Lead } from '@/types/lead';
import { LeadDetailsSidebar } from './LeadDetailsSidebar';
import { useSearchParams } from 'react-router-dom';
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { MoreVertical } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useWhatsAppInstanceStore } from '@/hooks/whatsapp/whatsappInstanceStore';

interface WhatsAppChatLayoutProps {
  contacts: Lead[];
  selectedContact: Lead | null;
  onSelectContact: (contact: Lead) => void;
  messages: Message[];
  onSendMessage: (message: string) => void;
  isLoading: boolean;
  hasMore: boolean;
  loadMore: () => void;
  isLoadingMore: boolean;
  selectedLead: Lead | null;
  onUpdateLead: (lead: Lead) => Promise<void>;
  onDeleteLead: (leadId: string) => Promise<void>;
  totalContactsAvailable: number;
}

export const WhatsAppChatContainer: React.FC<WhatsAppChatLayoutProps> = ({
  contacts,
  selectedContact,
  onSelectContact,
  messages,
  onSendMessage,
  isLoading,
  hasMore,
  loadMore,
  isLoadingMore,
  selectedLead,
  onUpdateLead,
  onDeleteLead,
  totalContactsAvailable,
}) => {
  const [messageText, setMessageText] = useState('');
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const { selectedInstance } = useWhatsAppInstanceStore();

  const handleSidebarToggle = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setMessageText(e.target.value);
  };

  const handleSendMessage = () => {
    if (messageText.trim() !== '') {
      onSendMessage(messageText);
      setMessageText('');
    }
  };

  const formatDistanceToNow = (date: Date): string => {
    return format(date, 'dd/MM/yyyy HH:mm', { locale: ptBR });
  };

  useEffect(() => {
    // Scroll to bottom when component mounts or messages change
    chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Open sidebar when lead is selected via URL
    if (searchParams.get('leadId')) {
      setIsSidebarOpen(true);
    }
  }, [searchParams]);

  const WhatsAppChatLayout: React.FC<WhatsAppChatLayoutProps> = ({
    contacts,
    selectedContact,
    onSelectContact,
    messages,
    onSendMessage,
    isLoading,
    hasMore,
    loadMore,
    isLoadingMore,
    selectedLead,
    onUpdateLead,
    onDeleteLead,
    totalContactsAvailable,
  }) => {
    return (
      <div className="flex h-screen">
        {/* Contacts Sidebar */}
        <aside className="w-80 border-r overflow-y-auto">
          <div className="p-4">
            <h2 className="text-lg font-semibold mb-2">Contatos ({totalContactsAvailable})</h2>
            {isLoading ? (
              <div className="text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                Carregando contatos...
              </div>
            ) : (
              <>
                {contacts.length === 0 ? (
                  <p className="text-sm text-muted-foreground">Nenhum contato encontrado.</p>
                ) : (
                  <ul>
                    {contacts.map((contact) => (
                      <li
                        key={contact.id}
                        className={`p-2 rounded-md cursor-pointer hover:bg-secondary ${selectedContact?.id === contact.id ? 'bg-secondary' : ''
                          }`}
                        onClick={() => {
                          onSelectContact(contact);
                          setSearchParams({ leadId: contact.id });
                        }}
                      >
                        <div className="flex items-center space-x-2">
                          <Avatar>
                            <AvatarImage src={`https://avatar.vercel.sh/${contact.name}.png`} />
                            <AvatarFallback>{contact.name?.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span>{contact.name}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                {hasMore && (
                  <Button
                    variant="outline"
                    className="w-full mt-2"
                    onClick={loadMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Carregando mais...
                      </>
                    ) : (
                      'Carregar mais'
                    )}
                  </Button>
                )}
              </>
            )}
          </div>
        </aside>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          {selectedContact ? (
            <div className="border-b p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Avatar>
                  <AvatarImage src={`https://avatar.vercel.sh/${selectedContact.name}.png`} />
                  <AvatarFallback>{selectedContact.name?.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-lg font-semibold">{selectedContact.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedContact.phone}</p>
                </div>
              </div>
              <div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="h-8 w-8 p-0">
                      <span className="sr-only">Open menu</span>
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                    <DropdownMenuItem
                      onClick={handleSidebarToggle}
                    >
                      Ver detalhes
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <DropdownMenuItem className="text-red-500">
                          Excluir lead
                        </DropdownMenuItem>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação é irreversível. Todos os dados do lead serão permanentemente excluídos.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={async () => {
                              if (selectedContact?.id) {
                                await onDeleteLead(selectedContact.id);
                                toast({
                                  title: "Lead excluído",
                                  description: "O lead foi excluído com sucesso.",
                                });
                                onSelectContact(null as any);
                              }
                            }}
                          >
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          ) : (
            <div className="border-b p-4">
              <h3 className="text-lg font-semibold">Selecione um contato para visualizar as mensagens</h3>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 p-4 overflow-y-auto">
            <ScrollArea className="h-full">
              {isLoading ? (
                <div className="text-center">
                  <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  Carregando mensagens...
                </div>
              ) : (
                <div className="space-y-2">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex flex-col ${message.from_me ? 'items-end' : 'items-start'
                        }`}
                    >
                      <div
                        className={`rounded-lg px-3 py-2 text-sm shadow-sm w-fit max-w-[75%] ${message.from_me
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-800'
                          }`}
                      >
                        <p>{message.text}</p>
                        <time
                          dateTime={message.timestamp.toString()}
                          className="text-xs text-gray-500 ml-2"
                        >
                          {formatDistanceToNow(new Date(message.timestamp))}
                        </time>
                      </div>
                    </div>
                  ))}
                  <div ref={chatBottomRef} /> {/* Scroll anchor */}
                </div>
              )}
            </ScrollArea>
          </div>

          {/* Chat Input */}
          {selectedContact && (
            <div className="p-4 border-t">
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="icon">
                  <Paperclip className="h-5 w-5" />
                </Button>
                <Input
                  placeholder="Digite sua mensagem..."
                  value={messageText}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSendMessage();
                    }
                  }}
                />
                <Button onClick={handleSendMessage} disabled={isLoading}>
                  {isLoading ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  Enviar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Lead Details Sidebar */}
        {selectedLead && (
          <LeadDetailsSidebar
            isOpen={isSidebarOpen}
            onClose={handleSidebarToggle}
            lead={selectedLead}
            onUpdateLead={onUpdateLead}
          />
        )}
      </div>
    );
  };

  return (
    <WhatsAppChatLayout
      contacts={contacts}
      selectedContact={selectedContact}
      onSelectContact={onSelectContact}
      messages={messages}
      onSendMessage={onSendMessage}
      isLoading={isLoading}
      hasMore={hasMore}
      loadMore={loadMore}
      isLoadingMore={isLoadingMore}
      selectedLead={selectedLead}
      onUpdateLead={onUpdateLead}
      onDeleteLead={onDeleteLead}
      totalContactsAvailable={totalContactsAvailable}
    />
  );
};
