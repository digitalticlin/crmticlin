
import { useState } from "react";
import { cn } from "@/lib/utils";
import { Contact, Message } from "@/types/chat";
import { ChatHeader } from "./ChatHeader";
import { MessagesList } from "./MessagesList";
import { MessageInput } from "./MessageInput";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ChevronRight, ChevronLeft, Save, User, Mail, Phone, Tag, StickyNote } from "lucide-react";

interface ChatAreaProps {
  selectedContact: Contact;
  messages: Message[];
  onOpenContactDetails: () => void;
  onBack: () => void;
  onSendMessage: (message: string) => void;
}

export const ChatArea = ({
  selectedContact,
  messages,
  onOpenContactDetails,
  onBack,
  onSendMessage,
}: ChatAreaProps) => {
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [contactData, setContactData] = useState({
    name: selectedContact.name,
    email: selectedContact.email || "",
    phone: selectedContact.phone,
    tags: selectedContact.tags || [],
    notes: selectedContact.notes || ""
  });

  const toggleEditPanel = () => {
    setShowEditPanel(!showEditPanel);
  };

  const handleInputChange = (field: string, value: string) => {
    setContactData({
      ...contactData,
      [field]: value
    });
  };

  const handleSaveContact = () => {
    // Esta função seria implementada para salvar as alterações no estado global
    // Por enquanto apenas fechamos o painel
    setShowEditPanel(false);
  };

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full flex-1">
      <ResizablePanel defaultSize={showEditPanel ? 70 : 100} minSize={50}>
        <div className="h-full flex flex-col bg-white/5 dark:bg-black/5 backdrop-blur-lg">
          <ChatHeader 
            selectedContact={selectedContact} 
            onOpenContactDetails={onOpenContactDetails}
            onBack={onBack}
          />
          <MessagesList messages={messages} />
          <MessageInput onSendMessage={onSendMessage} />
        </div>
      </ResizablePanel>
      
      {showEditPanel && (
        <>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize={30} minSize={25}>
            <div className="h-full p-4 border-l border-gray-200 dark:border-gray-700 bg-white/5 dark:bg-black/5 backdrop-blur-lg flex flex-col">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-lg">Editar Contato</h3>
                <Button variant="ghost" size="sm" onClick={toggleEditPanel}>
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
              
              <div className="space-y-4 overflow-auto flex-1">
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    <User className="h-4 w-4 inline mr-1" /> Nome
                  </label>
                  <Input 
                    value={contactData.name} 
                    onChange={(e) => handleInputChange("name", e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    <Mail className="h-4 w-4 inline mr-1" /> Email
                  </label>
                  <Input 
                    value={contactData.email} 
                    onChange={(e) => handleInputChange("email", e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    <Phone className="h-4 w-4 inline mr-1" /> Telefone
                  </label>
                  <Input 
                    value={contactData.phone} 
                    onChange={(e) => handleInputChange("phone", e.target.value)}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    <Tag className="h-4 w-4 inline mr-1" /> Etiquetas
                  </label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {contactData.tags && contactData.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                  <Input 
                    placeholder="Adicionar etiqueta e pressionar Enter"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        const newTag = e.currentTarget.value.trim();
                        if (newTag && !contactData.tags?.includes(newTag)) {
                          setContactData({
                            ...contactData,
                            tags: [...(contactData.tags || []), newTag]
                          });
                          e.currentTarget.value = "";
                        }
                      }
                    }}
                  />
                </div>
                
                <div>
                  <label className="text-sm font-medium mb-1 block">
                    <StickyNote className="h-4 w-4 inline mr-1" /> Observações
                  </label>
                  <Textarea 
                    value={contactData.notes} 
                    onChange={(e) => handleInputChange("notes", e.target.value)} 
                    className="min-h-[120px]"
                  />
                </div>
              </div>
              
              <div className="mt-4">
                <Button 
                  className="w-full bg-ticlin hover:bg-ticlin/90 text-black"
                  onClick={handleSaveContact}
                >
                  <Save className="h-4 w-4 mr-2" /> Salvar Alterações
                </Button>
              </div>
            </div>
          </ResizablePanel>
        </>
      )}
      
      {!showEditPanel && (
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute right-2 top-16 z-10 bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-full"
          onClick={toggleEditPanel}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
      )}
    </ResizablePanelGroup>
  );
};
