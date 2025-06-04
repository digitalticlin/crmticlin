
import { Contact, Message } from "@/types/chat";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { useState } from "react";
import { ChatConversation } from "./conversation/ChatConversation";
import { ContactInfoPanel } from "./contact-info/ContactInfoPanel";

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
  const [panelSize, setPanelSize] = useState({
    chat: 65,
    info: 35
  });

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full flex-1">
      <ResizablePanel 
        defaultSize={panelSize.chat} 
        minSize={40} 
        onResize={(size) => setPanelSize({...panelSize, chat: size})}
      >
        <ChatConversation
          selectedContact={selectedContact}
          messages={messages}
          onOpenContactDetails={onOpenContactDetails}
          onBack={onBack}
          onSendMessage={onSendMessage}
        />
      </ResizablePanel>
      
      <ResizableHandle withHandle />
      
      <ResizablePanel 
        defaultSize={panelSize.info} 
        minSize={25}
        onResize={(size) => setPanelSize({...panelSize, info: size})}
      >
        <ContactInfoPanel
          selectedContact={selectedContact}
          onOpenContactDetails={onOpenContactDetails}
        />
      </ResizablePanel>
    </ResizablePanelGroup>
  );
};
