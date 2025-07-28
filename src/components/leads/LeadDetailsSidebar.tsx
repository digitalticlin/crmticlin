
import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MessageSquare } from 'lucide-react';

interface LeadDetailsSidebarProps {
  leadId: string;
  onBack: () => void;
  onClose: () => void;
}

export const LeadDetailsSidebar: React.FC<LeadDetailsSidebarProps> = ({
  leadId,
  onBack,
  onClose
}) => {
  return (
    <div className="w-full h-full bg-white border-l border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
          >
            Fechar
          </Button>
        </div>
      </div>
      
      <div className="p-4">
        <SheetHeader>
          <SheetTitle>Detalhes do Lead</SheetTitle>
        </SheetHeader>
        
        <div className="mt-4 space-y-4">
          <div className="text-center py-8">
            <MessageSquare className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">
              Detalhes do lead #{leadId}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Funcionalidade em desenvolvimento
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
