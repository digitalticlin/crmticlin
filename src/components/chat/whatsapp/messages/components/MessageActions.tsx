
import React from 'react';
import { MoreVertical, RotateCcw, Trash2, Copy } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface MessageActionsProps {
  message: any;
  onResend?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  className?: string;
}

export function MessageActions({ 
  message, 
  onResend, 
  onDelete, 
  className 
}: MessageActionsProps) {
  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
    }
  };

  const canResend = message.status === 'error' || message.status === 'failed';
  const canDelete = message.from_me;

  return (
    <div className={cn("flex", className)}>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "w-8 h-8 rounded-full p-0",
              "bg-white/10 backdrop-blur-sm border border-white/20",
              "hover:bg-white/20 transition-all duration-200",
              "text-white/70 hover:text-white"
            )}
          >
            <MoreVertical className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent 
          align="end"
          className="bg-white/90 backdrop-blur-lg border border-white/20 shadow-xl"
        >
          {message.text && (
            <DropdownMenuItem onClick={handleCopy}>
              <Copy className="w-4 h-4 mr-2" />
              Copiar texto
            </DropdownMenuItem>
          )}
          
          {canResend && onResend && (
            <DropdownMenuItem onClick={() => onResend(message.id)}>
              <RotateCcw className="w-4 h-4 mr-2" />
              Reenviar
            </DropdownMenuItem>
          )}
          
          {canDelete && onDelete && (
            <DropdownMenuItem 
              onClick={() => onDelete(message.id)}
              className="text-red-600 hover:text-red-700"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Excluir
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
