
import React from 'react';
import { WhatsAppChatProvider, useWhatsAppChat } from '@/components/chat/whatsapp/WhatsAppChatProvider';
import { WhatsAppChatTabs } from './WhatsAppChatTabs';
import { useIsMobile } from '@/hooks/use-mobile';

const WhatsAppChatContent = () => {
  const {
    instances,
    activeInstance,
    setActiveInstance,
    isLoadingInstances
  } = useWhatsAppChat();

  return (
    <div className="h-full">
      <WhatsAppChatTabs />
    </div>
  );
};

export const WhatsAppChatPage = () => {
  const isMobile = useIsMobile();
  
  return (
    <WhatsAppChatProvider isMobile={isMobile}>
      <WhatsAppChatContent />
    </WhatsAppChatProvider>
  );
};
