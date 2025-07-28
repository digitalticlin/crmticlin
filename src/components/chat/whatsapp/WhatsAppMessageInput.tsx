
import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Paperclip, Loader2, Wifi, WifiOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface WhatsAppMessageInputProps {
  onSendMessage: (message: string, mediaType?: string, mediaUrl?: string) => Promise<boolean>;
  isSending?: boolean;
  realtimeStats?: {
    isConnected: boolean;
    connectionAttempts: number;
    maxAttempts: number;
  };
}

export const WhatsAppMessageInput: React.FC<WhatsAppMessageInputProps> = ({
  onSendMessage,
  isSending = false,
  realtimeStats
}) => {
  const [message, setMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSendMessage = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!message.trim() || isSending) return;

    console.log('[WhatsAppMessageInput] 📤 Enviando mensagem:', {
      messageLength: message.length,
      isSending
    });

    setIsTyping(true);
    const messageToSend = message.trim();
    setMessage('');

    try {
      const success = await onSendMessage(messageToSend);
      
      if (success) {
        console.log('[WhatsAppMessageInput] ✅ Mensagem enviada com sucesso');
        // Manter o foco no input
        inputRef.current?.focus();
      } else {
        console.error('[WhatsAppMessageInput] ❌ Falha ao enviar mensagem');
        // Restaurar mensagem em caso de falha
        setMessage(messageToSend);
      }
    } catch (error) {
      console.error('[WhatsAppMessageInput] ❌ Erro ao enviar mensagem:', error);
      // Restaurar mensagem em caso de erro
      setMessage(messageToSend);
    } finally {
      setIsTyping(false);
    }
  }, [message, isSending, onSendMessage]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  }, [handleSendMessage]);

  const isDisabled = isSending || isTyping || !message.trim();

  return (
    <div className="border-t border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
      {/* Status da conexão realtime */}
      {realtimeStats && (
        <div className="flex items-center justify-between px-4 py-1 text-xs">
          <div className="flex items-center gap-2">
            {realtimeStats.isConnected ? (
              <>
                <Wifi className="w-3 h-3 text-green-500" />
                <span className="text-green-600 dark:text-green-400">
                  Conectado
                </span>
              </>
            ) : (
              <>
                <WifiOff className="w-3 h-3 text-red-500" />
                <span className="text-red-600 dark:text-red-400">
                  Desconectado ({realtimeStats.connectionAttempts}/{realtimeStats.maxAttempts})
                </span>
              </>
            )}
          </div>
          <span className="text-gray-500 dark:text-gray-400">
            🔄 Conectado
          </span>
        </div>
      )}

      <form onSubmit={handleSendMessage} className="flex items-center gap-2 p-4">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="flex-shrink-0"
          disabled={isSending}
        >
          <Paperclip className="w-4 h-4" />
        </Button>

        <Input
          ref={inputRef}
          type="text"
          placeholder="Digite uma mensagem..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isSending}
          className="flex-1 bg-gray-100 dark:bg-gray-800 border-0 focus:ring-2 focus:ring-green-500 rounded-full px-4 py-2"
        />

        <Button
          type="submit"
          size="sm"
          disabled={isDisabled}
          className={cn(
            "flex-shrink-0 rounded-full w-10 h-10 p-0",
            isDisabled 
              ? "bg-gray-400 dark:bg-gray-600" 
              : "bg-green-500 hover:bg-green-600 dark:bg-green-600 dark:hover:bg-green-700"
          )}
        >
          {isSending || isTyping ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </form>
    </div>
  );
};
