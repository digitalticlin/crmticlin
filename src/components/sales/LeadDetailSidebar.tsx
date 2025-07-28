
import React, { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { KanbanLead, KanbanTag } from '@/types/kanban';
import { TagSelector } from '@/components/sales/TagSelector';
import { LeadDetailFooter } from '@/components/sales/leadDetail/LeadDetailFooter';
import { NotesField } from '@/components/sales/leadDetail/NotesField';
import { ChatPreview } from '@/components/sales/leadDetail/ChatPreview';
import { Separator } from '@/components/ui/separator';
import { Calendar, DollarSign, MessageSquare, User, Phone, Mail, MapPin, Building, Tag } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LeadDetailSidebarProps {
  lead: KanbanLead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLead: (leadId: string, updates: Partial<KanbanLead>) => void;
  onOpenChat: (lead: KanbanLead) => void;
  availableTags: KanbanTag[];
  onCreateTag: (name: string, color: string) => void;
}

export const LeadDetailSidebar = ({
  lead,
  isOpen,
  onClose,
  onUpdateLead,
  onOpenChat,
  availableTags,
  onCreateTag
}: LeadDetailSidebarProps) => {
  const [editingField, setEditingField] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  if (!lead) return null;

  const handleFieldEdit = (field: string, currentValue: string) => {
    setEditingField(field);
    setTempValue(currentValue || '');
  };

  const handleFieldSave = (field: string) => {
    onUpdateLead(lead.id, { [field]: tempValue });
    setEditingField(null);
    setTempValue('');
  };

  const handleFieldCancel = () => {
    setEditingField(null);
    setTempValue('');
  };

  const handleNotesUpdate = (notes: string) => {
    onUpdateLead(lead.id, { notes });
  };

  const handleTagToggle = (tagId: string) => {
    const currentTags = lead.tags || [];
    const isSelected = currentTags.some(t => t.id === tagId);
    
    let newTags;
    if (isSelected) {
      newTags = currentTags.filter(t => t.id !== tagId);
    } else {
      const tagToAdd = availableTags.find(t => t.id === tagId);
      if (tagToAdd) {
        newTags = [...currentTags, tagToAdd];
      } else {
        newTags = currentTags;
      }
    }
    
    onUpdateLead(lead.id, { tags: newTags });
  };

  const EditableField = ({ 
    field, 
    label, 
    value, 
    icon: Icon, 
    type = 'text' 
  }: { 
    field: string; 
    label: string; 
    value: string; 
    icon: any; 
    type?: string; 
  }) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium flex items-center gap-2">
        <Icon className="h-4 w-4" />
        {label}
      </Label>
      {editingField === field ? (
        <div className="flex gap-2">
          <Input
            type={type}
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            className="flex-1"
          />
          <Button size="sm" onClick={() => handleFieldSave(field)}>
            Salvar
          </Button>
          <Button size="sm" variant="outline" onClick={handleFieldCancel}>
            Cancelar
          </Button>
        </div>
      ) : (
        <div 
          className="p-2 rounded border bg-gray-50 dark:bg-gray-800 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700"
          onClick={() => handleFieldEdit(field, value)}
        >
          {value || `Clique para adicionar ${label.toLowerCase()}`}
        </div>
      )}
    </div>
  );

  // Convert selectedTags to selectedTagIds
  const selectedTagIds = (lead.tags || []).map(tag => tag.id);

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-[600px] sm:w-[540px] overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Detalhes do Lead
          </SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {lead.name?.charAt(0) || 'L'}
            </div>
            <div>
              <h2 className="text-xl font-semibold">{lead.name}</h2>
              <p className="text-sm text-muted-foreground">
                Criado {formatDistanceToNow(new Date(lead.created_at || Date.now()), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-4">
            <EditableField 
              field="phone" 
              label="Telefone" 
              value={lead.phone || ''} 
              icon={Phone}
              type="tel"
            />
            <EditableField 
              field="email" 
              label="E-mail" 
              value={lead.email || ''} 
              icon={Mail}
              type="email"
            />
            <EditableField 
              field="company" 
              label="Empresa" 
              value={lead.company || ''} 
              icon={Building}
            />
            <EditableField 
              field="address" 
              label="Endereço" 
              value={lead.address || ''} 
              icon={MapPin}
            />
            <EditableField 
              field="purchaseValue" 
              label="Valor do Negócio" 
              value={lead.purchaseValue?.toString() || ''} 
              icon={DollarSign}
              type="number"
            />
          </div>

          <Separator />

          <div>
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <Tag className="h-4 w-4" />
              Tags
            </h3>
            <TagSelector
              availableTags={availableTags}
              selectedTagIds={selectedTagIds}
              onToggleTag={handleTagToggle}
              onCreateTag={onCreateTag}
            />
          </div>

          <Separator />

          <NotesField 
            notes={lead.notes}
            onUpdateNotes={handleNotesUpdate}
          />

          {(lead.lastMessage || lead.lastMessageTime) && (
            <>
              <Separator />
              <ChatPreview 
                lastMessage={lead.lastMessage || 'Sem mensagens'}
                lastMessageTime={lead.lastMessageTime || ''}
                onOpenChat={() => onOpenChat(lead)}
              />
            </>
          )}
        </div>

        <LeadDetailFooter onClose={onClose} />
      </SheetContent>
    </Sheet>
  );
};
