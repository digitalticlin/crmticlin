
import React from 'react';
import { WhatsAppChatProvider } from './WhatsAppChatProvider';
import { WhatsAppChatLayout } from './WhatsAppChatLayout';
import { WhatsAppChatHeader } from './WhatsAppChatHeader';
import { WhatsAppContactsList } from './contacts/WhatsAppContactsList';
import { WhatsAppMessagesSection } from './messages/WhatsAppMessagesSection';
import { WhatsAppChatActions } from './WhatsAppChatActions';
import { WhatsAppChatErrorBoundary } from './WhatsAppChatErrorBoundary';

export const WhatsAppChatPage: React.FC = () => {
  return (
    <WhatsAppChatErrorBoundary>
      <WhatsAppChatProvider>
        <div className="flex h-full w-full">
          {/* Sidebar - Contacts */}
          <div className="w-1/3 min-w-[300px] max-w-[400px]">
            <WhatsAppContactsList />
          </div>
          
          {/* Main Content */}
          <div className="flex-1 flex flex-col">
            <WhatsAppChatHeader />
            <WhatsAppMessagesSection />
            <WhatsAppChatActions />
          </div>
        </div>
      </WhatsAppChatProvider>
    </WhatsAppChatErrorBoundary>
  );
};

export default WhatsAppChatPage;
