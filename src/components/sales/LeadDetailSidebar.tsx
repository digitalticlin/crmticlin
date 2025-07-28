import React, { useState, useCallback } from 'react';
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, CheckCheck, Copy, Plus, Trash2, MessageCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DatePicker } from "@/components/ui/date-picker"
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { toast } from 'sonner';
import { SalesFunnelService } from "@/services/sales/salesFunnelService";
import { SalesFunnelDealForm } from "./SalesFunnelDealForm";
import { formatCurrency } from "@/utils/currencyFormatter";
import { KanbanLead, KanbanTag } from "@/types/kanban";
import { Deal } from '@/types/chat';

interface LeadDetailSidebarProps {
  selectedLead: KanbanLead | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenChat: (leadId: string) => void;
  availableTags: KanbanTag[];
  onToggleTag: (tagId: string) => void;
  onUpdateNotes: (notes: string) => void;
  onCreateTag: (name: string, color: string) => void;
  onUpdatePurchaseValue: (value: number) => void;
  onUpdateAssignedUser: (user: string) => void;
  onDeleteLead: () => void;
  onUpdateEmail: (email: string) => void;
  onUpdateCompany: (company: string) => void;
  onUpdateAddress: (address: string) => void;
  onUpdateDocumentId: (documentId: string) => void;
  onUpdatePurchaseDate: (date: string) => void;
  onUpdateOwner: (owner: string) => void;
  onUpdatePhoneNumber: (phone: string) => void;
  onUpdateLeadName: (name: string) => void;
  onUpdateLeadStage: (stageId: string) => void;
  onCreateDeal: (deal: Omit<Deal, 'id'>) => void;
  onUpdateDeal: (dealId: string, deal: Partial<Deal>) => void;
  onDeleteDeal: (dealId: string) => void;
  isUpdating?: boolean;
}

export const LeadDetailSidebar = ({
  selectedLead,
  isOpen,
  onClose,
  onOpenChat,
  availableTags,
  onToggleTag,
  onUpdateNotes,
  onCreateTag,
  onUpdatePurchaseValue,
  onUpdateAssignedUser,
  onDeleteLead,
  onUpdateEmail,
  onUpdateCompany,
  onUpdateAddress,
  onUpdateDocumentId,
  onUpdatePurchaseDate,
  onUpdateOwner,
  onUpdatePhoneNumber,
  onUpdateLeadName,
  onUpdateLeadStage,
  onCreateDeal,
  onUpdateDeal,
  onDeleteDeal,
  isUpdating = false
}: LeadDetailSidebarProps) => {
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [newTagName, setNewTagName] = useState('');
  const [newTagColor, setNewTagColor] = useState('#cccccc');
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<Deal | null>(null);

  const handleTagToggle = useCallback((tagId: string) => {
    if (selectedLead) {
      onToggleTag(tagId);
    }
  }, [selectedLead, onToggleTag]);

  const handleNotesChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (selectedLead) {
      onUpdateNotes(e.target.value);
    }
  }, [selectedLead, onUpdateNotes]);

  const handlePurchaseValueChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedLead) {
      const value = parseFloat(e.target.value);
      if (!isNaN(value)) {
        onUpdatePurchaseValue(value);
      }
    }
  }, [selectedLead, onUpdatePurchaseValue]);

  const handleAssignedUserChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedLead) {
      onUpdateAssignedUser(e.target.value);
    }
  }, [selectedLead, onUpdateAssignedUser]);

  const handleDeleteLeadClick = useCallback(async () => {
    if (selectedLead) {
      try {
        await SalesFunnelService.deleteLead(selectedLead.id);
        toast.success('Lead excluído com sucesso');
        onClose();
        onDeleteLead();
      } catch (error) {
        console.error('Erro ao excluir lead:', error);
        toast.error('Erro ao excluir lead');
      }
    }
  }, [selectedLead, onClose, onDeleteLead]);

  const handleCreateTag = useCallback(async () => {
    if (newTagName.trim() !== '') {
      await onCreateTag(newTagName, newTagColor);
      setNewTagName('');
      setNewTagColor('#cccccc');
      setIsTagModalOpen(false);
    }
  }, [newTagName, newTagColor, onCreateTag]);

  const handleEmailChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedLead) {
      onUpdateEmail(e.target.value);
    }
  }, [selectedLead, onUpdateEmail]);

  const handleCompanyChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedLead) {
      onUpdateCompany(e.target.value);
    }
  }, [selectedLead, onUpdateCompany]);

  const handleAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedLead) {
      onUpdateAddress(e.target.value);
    }
  }, [selectedLead, onUpdateAddress]);

  const handleDocumentIdChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedLead) {
      onUpdateDocumentId(e.target.value);
    }
  }, [selectedLead, onUpdateDocumentId]);

  const handlePurchaseDateChange = useCallback((date: Date | undefined) => {
    if (selectedLead && date) {
      const isoDate = date.toISOString();
      onUpdatePurchaseDate(isoDate);
    }
  }, [selectedLead, onUpdatePurchaseDate]);

  const handleOwnerChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedLead) {
      onUpdateOwner(e.target.value);
    }
  }, [selectedLead, onUpdateOwner]);

  const handlePhoneNumberChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedLead) {
      onUpdatePhoneNumber(e.target.value);
    }
  }, [selectedLead, onUpdatePhoneNumber]);

  const handleLeadNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (selectedLead) {
      onUpdateLeadName(e.target.value);
    }
  }, [selectedLead, onUpdateLeadName]);

  const handleLeadStageChange = useCallback((stageId: string) => {
    if (selectedLead) {
      onUpdateLeadStage(stageId);
    }
  }, [selectedLead, onUpdateLeadStage]);

  const handleCreateDeal = useCallback((deal: Omit<Deal, 'id'>) => {
    if (selectedLead) {
      onCreateDeal(deal);
      setIsDealModalOpen(false);
    }
  }, [selectedLead, onCreateDeal]);

  const handleUpdateDeal = useCallback((dealId: string, deal: Partial<Deal>) => {
    if (selectedLead) {
      onUpdateDeal(dealId, deal);
      setSelectedDeal(null);
    }
  }, [selectedLead, onUpdateDeal]);

  const handleDeleteDeal = useCallback((dealId: string) => {
    if (selectedLead) {
      onDeleteDeal(dealId);
      setSelectedDeal(null);
    }
  }, [selectedLead, onDeleteDeal]);

  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Não informado';
    
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  return (
    <div className={cn(
      "fixed right-0 top-0 bottom-0 w-80 bg-white border-l border-gray-200 shadow-lg transition-transform duration-300 z-50",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Detalhes do Lead</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-x">
              <path d="M18 6 6 18" />
              <path d="M6 6 18 18" />
            </svg>
          </Button>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-sm font-medium text-gray-700">Nome</Label>
            <Input
              type="text"
              id="name"
              value={selectedLead?.name || ''}
              onChange={handleLeadNameChange}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium text-gray-700">Telefone</Label>
            <div className="flex items-center">
              <Input
                type="tel"
                id="phone"
                value={selectedLead?.phone || ''}
                onChange={handlePhoneNumberChange}
                className="text-sm flex-1 mr-2"
              />
              <Button size="sm" onClick={() => {
                if (selectedLead?.id) {
                  onOpenChat(selectedLead.id);
                }
              }}>
                <MessageCircle className="mr-2 h-4 w-4" />
                Chat
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
            <Input
              type="email"
              id="email"
              value={selectedLead?.email || ''}
              onChange={handleEmailChange}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="company" className="text-sm font-medium text-gray-700">Empresa</Label>
            <Input
              type="text"
              id="company"
              value={selectedLead?.company || ''}
              onChange={handleCompanyChange}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address" className="text-sm font-medium text-gray-700">Endereço</Label>
            <Input
              type="text"
              id="address"
              value={selectedLead?.address || ''}
              onChange={handleAddressChange}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="documentId" className="text-sm font-medium text-gray-700">CPF/CNPJ</Label>
            <Input
              type="text"
              id="documentId"
              value={selectedLead?.documentId || ''}
              onChange={handleDocumentIdChange}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseValue" className="text-sm font-medium text-gray-700">Valor de Compra</Label>
            <Input
              type="number"
              id="purchaseValue"
              value={selectedLead?.purchaseValue?.toString() || ''}
              onChange={handlePurchaseValueChange}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="purchaseDate" className="text-sm font-medium text-gray-700">Data de Compra</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal text-sm",
                    !selectedLead?.created_at && "text-muted-foreground"
                  )}
                >
                  {selectedLead?.created_at ? (
                    formatDate(selectedLead.created_at)
                  ) : (
                    <span>Selecione a data</span>
                  )}
                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center" side="bottom">
                <DatePicker
                  mode="single"
                  selected={selectedLead?.created_at ? new Date(selectedLead.created_at) : undefined}
                  onSelect={handlePurchaseDateChange}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="owner" className="text-sm font-medium text-gray-700">Responsável</Label>
            <Input
              type="text"
              id="owner"
              value={selectedLead?.owner_id || ''}
              onChange={handleOwnerChange}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Data de Criação</label>
            <div className="text-sm text-gray-600">
              {formatDate(selectedLead?.created_at)}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Tags</Label>
              <Button variant="ghost" size="sm" onClick={() => setIsTagModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Tag
              </Button>
            </div>
            <div className="flex flex-wrap gap-2">
              {availableTags.map(tag => (
                <Badge
                  key={tag.id}
                  variant={selectedLead?.tags?.some(t => t.id === tag.id) ? "default" : "outline"}
                  onClick={() => handleTagToggle(tag.id)}
                  className="cursor-pointer text-sm"
                >
                  {tag.name}
                </Badge>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-sm font-medium text-gray-700">Anotações</Label>
            <Textarea
              id="notes"
              value={selectedLead?.notes || ''}
              onChange={handleNotesChange}
              className="text-sm"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium text-gray-700">Negociações</Label>
              <Button variant="ghost" size="sm" onClick={() => setIsDealModalOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Negociação
              </Button>
            </div>

            <div className="text-sm text-gray-600">
              Nenhuma negociação encontrada
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="destructive" size="sm" onClick={handleDeleteLeadClick} disabled={isUpdating}>
              Excluir Lead
            </Button>
            <Button size="sm" disabled={isUpdating}>
              Salvar
            </Button>
          </div>
        </div>
      </div>

      <Dialog open={isTagModalOpen} onOpenChange={setIsTagModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Criar Nova Tag</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="name" className="text-right">
                Nome
              </Label>
              <Input id="name" value={newTagName} onChange={(e) => setNewTagName(e.target.value)} className="col-span-3" type="text" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Cor
              </Label>
              <Input
                type="color"
                id="color"
                value={newTagColor}
                onChange={(e) => setNewTagColor(e.target.value)}
                className="col-span-3 h-10"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleCreateTag}>Criar Tag</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={isDealModalOpen || selectedDeal !== null} onOpenChange={(open) => {
        setIsDealModalOpen(open);
        if (!open) setSelectedDeal(null);
      }}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedDeal ? 'Editar Negociação' : 'Criar Negociação'}</DialogTitle>
          </DialogHeader>
          <SalesFunnelDealForm
            deal={selectedDeal}
            onCreate={handleCreateDeal}
            onUpdate={handleUpdateDeal}
            onClose={() => {
              setIsDealModalOpen(false);
              setSelectedDeal(null);
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};
