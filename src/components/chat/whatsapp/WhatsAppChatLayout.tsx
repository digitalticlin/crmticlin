
import React from 'react';

interface WhatsAppChatLayoutProps {
  children: React.ReactNode;
}

export const WhatsAppChatLayout = ({ children }: WhatsAppChatLayoutProps) => {
  return (
    <div className="flex h-screen bg-gray-100">
      {children}
    </div>
  );
};
