
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Contact, Message } from "@/types/chat";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Paperclip, Mic, StopCircle } from "lucide-react";
import { ChatMessages } from "./ChatMessages";
import { ChatContacts } from "./ChatContacts";
import { cn } from "@/lib/utils";
import { useToast } from "@/components/ui/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useMediaQuery } from 'usehooks-ts';
import { LeadDetailsSidebar } from './LeadDetailsSidebar';
import { useChatContext } from './ChatProvider';
import { MediaUploader } from './MediaUploader';
import { AudioRecorder } from './AudioRecorder';

interface WhatsAppChatLayoutProps {
  contacts: Contact[];
  selectedContact: Contact;
  onSelectContact: (contact: Contact) => void;
  messages: Message[];
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<void>;
  onTyping: (isTyping: boolean) => void;
  isTyping: boolean;
  onSearch: (term: string) => void;
  searchTerm: string;
  onMediaUpload: (file: File) => Promise<void>;
  selectedContactId: string;
  onContactUpdate: (updatedContact: Contact) => void;
  onLeadDetail: (contact: Contact) => void;
  contactsLoading: boolean;
  totalContactsAvailable: number;
}

export const WhatsAppChatContainer = ({
  contacts,
  selectedContact,
  onSelectContact,
  messages,
  onSendMessage,
  onTyping,
  isTyping,
  searchTerm,
  onSearch,
  onMediaUpload,
  selectedContactId,
  onContactUpdate,
  onLeadDetail,
  contactsLoading,
  totalContactsAvailable
}: WhatsAppChatLayoutProps) => {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isDetailsSidebarOpen, setIsDetailsSidebarOpen] = useState(false);
  const { toast } = useToast();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const { setOptimisticMessage } = useChatContext();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    onTyping(e.target.value.length > 0);
  }, [onTyping]);

  const handleSendMessage = useCallback(async () => {
    if (input.trim() === '') return;

    // UI Otimista: Criar mensagem temporária
    const optimisticMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      time: new Date().toLocaleTimeString(),
      status: 'sending',
      isIncoming: false,
      fromMe: true,
      timestamp: new Date().toISOString(),
      mediaType: 'text',
      isOptimistic: true
    };
    setOptimisticMessage(optimisticMessage);

    // Enviar mensagem real
    try {
      await onSendMessage(input);
      setInput('');
      onTyping(false);
      if (inputRef.current) {
        inputRef.current.focus();
      }
    } catch (error: any) {
      console.error("Erro ao enviar mensagem:", error);
      toast({
        title: "Erro ao enviar mensagem",
        description: error.message || "Ocorreu um erro ao enviar a mensagem.",
        variant: "destructive",
      });
    }
  }, [input, onSendMessage, onTyping, toast, setOptimisticMessage]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }, [handleSendMessage]);

  const handleMediaUpload = async (file: File) => {
    try {
      await onMediaUpload(file);
    } catch (error: any) {
      console.error("Erro ao fazer upload da mídia:", error);
      toast({
        title: "Erro ao enviar mídia",
        description: error.message || "Ocorreu um erro ao enviar a mídia.",
        variant: "destructive",
      });
    }
  };

  const handleAudioSend = async (audioBlob: Blob) => {
    try {
      const audioUrl = URL.createObjectURL(audioBlob);
      await onSendMessage('', 'audio', audioUrl);
    } catch (error: any) {
      console.error("Erro ao enviar áudio:", error);
      toast({
        title: "Erro ao enviar áudio",
        description: error.message || "Ocorreu um erro ao enviar o áudio.",
        variant: "destructive",
      });
    } finally {
      setIsRecording(false);
    }
  };

  return (
    <div className="flex h-full">
      {/* Contacts Sidebar (hidden on small screens) */}
      {!isMobile && (
        <aside className="w-80 border-r flex-shrink-0 h-full">
          <ChatContacts
            contacts={contacts}
            selectedContact={selectedContact}
            onSelectContact={onSelectContact}
            searchTerm={searchTerm}
            onSearch={onSearch}
            contactsLoading={contactsLoading}
            totalContactsAvailable={totalContactsAvailable}
          />
        </aside>
      )}

      {/* Chat Area */}
      <div className="flex flex-col flex-grow h-full">
        {/* Header */}
        <header className="border-b p-4">
          <div className="font-semibold">{selectedContact?.name || 'Selecione um contato'}</div>
        </header>

        {/* Messages Area */}
        <div className="flex-grow overflow-hidden relative">
          {selectedContact ? (
            <ChatMessages messages={messages} />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              Selecione um contato para iniciar a conversa
            </div>
          )}
        </div>

        {/* Input Area */}
        {selectedContact && (
          <div className="p-4 border-t">
            <div className="flex items-center gap-2">
              {/* Media Uploader */}
              <MediaUploader onMediaUpload={handleMediaUpload} />

              {/* Audio Recorder */}
              <AudioRecorder
                onStartRecording={() => setIsRecording(true)}
                onStopRecording={() => setIsRecording(false)}
                onSend={handleAudioSend}
                isRecording={isRecording}
              />

              {/* Input */}
              <Input
                ref={inputRef}
                placeholder="Digite sua mensagem..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-grow rounded-full py-2 px-4 border-0 shadow-sm focus-visible:ring-0 focus-visible:ring-offset-0"
                disabled={isRecording}
              />

              {/* Send Button */}
              <Button onClick={handleSendMessage} disabled={input.trim() === '' || isRecording} className="rounded-full p-2">
                <Send className="h-4 w-4" />
                <span className="sr-only">Enviar</span>
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Lead Details Sidebar (hidden on small screens) */}
      {!isMobile && selectedContact && (
        <LeadDetailsSidebar 
          contact={selectedContact} 
          isOpen={isDetailsSidebarOpen}
          onClose={() => setIsDetailsSidebarOpen(false)}
          onUpdateContact={onContactUpdate}
        />
      )}
    </div>
  );
};
