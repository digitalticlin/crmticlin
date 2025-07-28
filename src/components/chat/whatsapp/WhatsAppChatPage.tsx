import React from 'react';
import { WhatsAppChatProvider } from './WhatsAppChatProvider';
import { WhatsAppChatLayout } from './WhatsAppChatLayout';
import { WhatsAppChatHeader } from './WhatsAppChatHeader';
import { WhatsAppContactsList } from './contacts/WhatsAppContactsList';
import { WhatsAppMessagesSection } from './messages/WhatsAppMessagesSection';
import { WhatsAppChatActions } from './WhatsAppChatActions';
import { WhatsAppChatErrorBoundary } from './WhatsAppChatErrorBoundary';
import { PerformanceMonitor } from '@/components/debug/PerformanceMonitor';

const WhatsAppChatPage: React.FC = () => {
  return (
    <WhatsAppChatErrorBoundary>
      <WhatsAppChatProvider>
        <WhatsAppChatLayout
          header={<WhatsAppChatHeader />}
          sidebar={<WhatsAppContactsList />}
          content={<WhatsAppMessagesSection />}
          actions={<WhatsAppChatActions />}
        />
      </WhatsAppChatProvider>
    </WhatsAppChatErrorBoundary>
  );
};

export default WhatsAppChatPage;
