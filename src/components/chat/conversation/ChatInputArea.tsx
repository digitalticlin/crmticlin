
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip } from 'lucide-react';

interface ChatInputAreaProps {
  onSendMessage: (message: string) => Promise<boolean>;
  placeholder?: string;
  disabled?: boolean;
}

export const ChatInputArea: React.FC<ChatInputAreaProps> = ({
  onSendMessage,
  placeholder = "Digite uma mensagem...",
  disabled = false
}) => {
  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || disabled || isSending) return;

    setIsSending(true);
    try {
      const success = await onSendMessage(message.trim());
      if (success) {
        setMessage('');
      }
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="p-2 h-10 w-10"
        disabled={disabled}
      >
        <Paperclip className="h-4 w-4" />
      </Button>
      
      <div className="flex-1 relative">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={placeholder}
          disabled={disabled || isSending}
          className="pr-12"
        />
        <Button
          type="submit"
          size="sm"
          className="absolute right-1 top-1 h-8 w-8 p-0"
          disabled={disabled || isSending || !message.trim()}
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </form>
  );
};
