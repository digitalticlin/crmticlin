
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader2 } from 'lucide-react';

interface MessageInputProps {
  onSendMessage: (text: string) => Promise<boolean>;
  isSending: boolean;
  contactName: string;
}

export const MessageInput = ({ onSendMessage, isSending, contactName }: MessageInputProps) => {
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || isSending) return;

    const success = await onSendMessage(message.trim());
    if (success) {
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2 items-center">
      <Input
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder={`Mensagem para ${contactName}...`}
        disabled={isSending}
        className="flex-1"
      />
      <Button 
        type="submit" 
        disabled={!message.trim() || isSending}
        size="sm"
        className="bg-green-600 hover:bg-green-700"
      >
        {isSending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  );
};
