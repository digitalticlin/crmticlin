
import React from 'react';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2, X, Settings, MessageSquare } from 'lucide-react';
import { Contact } from '@/types/chat';
import { useState } from 'react';
import { toast } from 'sonner';

interface ContactContextMenuProps {
  contact: Contact;
  children: React.ReactNode;
  onDeleteConversation?: (contactId: string) => Promise<void>;
  onCloseConversation?: (contactId: string) => Promise<void>;
  onEditContact?: (contact: Contact) => void;
}

export const ContactContextMenu = ({
  contact,
  children,
  onDeleteConversation,
  onCloseConversation,
  onEditContact
}: ContactContextMenuProps) => {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCloseDialog, setShowCloseDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  console.log('[ContactContextMenu] Props received:', {
    contactId: contact.id,
    contactName: contact.name,
    hasDeleteFunction: !!onDeleteConversation,
    hasCloseFunction: !!onCloseConversation,
    hasEditFunction: !!onEditContact
  });

  const displayName = contact.name || contact.phone;

  const handleDeleteConversation = async () => {
    console.log('[ContactContextMenu] handleDeleteConversation called:', contact.id);
    if (!onDeleteConversation) {
      console.log('[ContactContextMenu] No onDeleteConversation function provided');
      return;
    }
    
    setIsLoading(true);
    try {
      await onDeleteConversation(contact.id);
      toast.success(`Conversa com ${displayName} foi excluída`);
    } catch (error) {
      toast.error('Erro ao excluir conversa');
      console.error('Error deleting conversation:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
    }
  };

  const handleCloseConversation = async () => {
    console.log('[ContactContextMenu] handleCloseConversation called:', contact.id);
    if (!onCloseConversation) {
      console.log('[ContactContextMenu] No onCloseConversation function provided');
      return;
    }
    
    setIsLoading(true);
    try {
      await onCloseConversation(contact.id);
      toast.success(`Conversa com ${displayName} foi fechada`);
    } catch (error) {
      toast.error('Erro ao fechar conversa');
      console.error('Error closing conversation:', error);
    } finally {
      setIsLoading(false);
      setShowCloseDialog(false);
    }
  };

  const handleEditContact = () => {
    if (onEditContact) {
      onEditContact(contact);
    }
  };

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger asChild>
          {children}
        </ContextMenuTrigger>
        <ContextMenuContent className="w-64 bg-white/20 backdrop-blur-md border-white/30 shadow-glass">
          <ContextMenuItem 
            className="flex items-center gap-3 px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-white/20 cursor-pointer"
            onClick={handleEditContact}
          >
            <Settings className="h-4 w-4" />
            <span>Editar Contato</span>
          </ContextMenuItem>
          
          <ContextMenuItem 
            className="flex items-center gap-3 px-3 py-2 text-gray-800 dark:text-gray-200 hover:bg-white/20 cursor-pointer"
            onClick={() => setShowCloseDialog(true)}
          >
            <X className="h-4 w-4" />
            <span>Fechar Conversa</span>
          </ContextMenuItem>
          
          <ContextMenuSeparator className="bg-white/20" />
          
          <ContextMenuItem 
            className="flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50/20 cursor-pointer"
            onClick={() => setShowDeleteDialog(true)}
          >
            <Trash2 className="h-4 w-4" />
            <span>Excluir Conversa</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-white/20 backdrop-blur-md border-white/30 shadow-glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800 dark:text-gray-200">
              Excluir Conversa
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Tem certeza que deseja excluir toda a conversa com <strong>{displayName}</strong>? 
              Esta ação não pode ser desfeita e todas as mensagens serão perdidas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-white/20 hover:bg-white/30 border-white/30 text-gray-800 dark:text-gray-200"
              disabled={isLoading}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-red-600 hover:bg-red-700 text-white"
              onClick={handleDeleteConversation}
              disabled={isLoading}
            >
              {isLoading ? 'Excluindo...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Close Confirmation Dialog */}
      <AlertDialog open={showCloseDialog} onOpenChange={setShowCloseDialog}>
        <AlertDialogContent className="bg-white/20 backdrop-blur-md border-white/30 shadow-glass">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-gray-800 dark:text-gray-200">
              Fechar Conversa
            </AlertDialogTitle>
            <AlertDialogDescription className="text-gray-600 dark:text-gray-400">
              Deseja fechar a conversa com <strong>{displayName}</strong>? 
              O contato será movido para conversas arquivadas mas as mensagens serão preservadas.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-white/20 hover:bg-white/30 border-white/30 text-gray-800 dark:text-gray-200"
              disabled={isLoading}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction 
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={handleCloseConversation}
              disabled={isLoading}
            >
              {isLoading ? 'Fechando...' : 'Fechar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
