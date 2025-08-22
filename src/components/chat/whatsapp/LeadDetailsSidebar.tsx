import React, { useState, useEffect } from 'react';
import { Contact, Deal, DealHistoryItem } from "@/types/chat";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar"
import { CalendarIcon, Check, ChevronDown, ChevronUp, Copy, Edit, Mail, MessageSquare, Phone, Plus, Trash2, User, X } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn, formatCurrency } from "@/lib/utils";
import { format } from "date-fns";
import { ptBR } from 'date-fns/locale';
import { DocumentSelector } from "@/components/clients/DocumentSelector";
import { DealHistory } from "@/components/clients/DealHistory";

interface LeadDetailsSidebarProps {
  contact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateNotes: (notes: string) => void;
  onUpdateAssignedUser: (user: string) => void;
  onUpdatePurchaseValue: (value: number | undefined) => void;
}

export const LeadDetailsSidebar = ({
  contact,
  isOpen,
  onClose,
  onUpdateNotes,
  onUpdateAssignedUser,
  onUpdatePurchaseValue
}: LeadDetailsSidebarProps) => {
  const [notes, setNotes] = useState(contact?.notes || "");
  const [assignedUser, setAssignedUser] = useState(contact?.assignedUser || "");
  const [purchaseValue, setPurchaseValue] = useState<number | undefined>(contact?.purchaseValue);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [tempValue, setTempValue] = useState<string>('');
  const [documentType, setDocumentType] = useState<'cpf' | 'cnpj' | undefined>(undefined);
  const [documentId, setDocumentId] = useState<string>('');

  useEffect(() => {
    if (contact) {
      setNotes(contact.notes || "");
      setAssignedUser(contact.assignedUser || "");
      setPurchaseValue(contact.purchaseValue);
    }
  }, [contact]);

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value);
  };

  const handleAssignedUserChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAssignedUser(e.target.value);
  };

  const handleSaveNotes = () => {
    onUpdateNotes(notes);
  };

  const handleSaveAssignedUser = () => {
    onUpdateAssignedUser(assignedUser);
  };

  const handleValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTempValue(e.target.value);
  };

  const handleEditValue = () => {
    setIsEditingValue(true);
    setTempValue(purchaseValue?.toString() || '');
  };

  const handleCancelEdit = () => {
    setIsEditingValue(false);
    setTempValue('');
  };

  const handleSaveValue = () => {
    const parsedValue = parseFloat(tempValue);
    if (!isNaN(parsedValue)) {
      setPurchaseValue(parsedValue);
      onUpdatePurchaseValue(parsedValue);
    } else {
      // Lidar com valor inválido (opcional)
      alert('Valor inválido. Digite um número.');
    }
    setIsEditingValue(false);
    setTempValue('');
  };

  const mockDeals: DealHistoryItem[] = [
    {
      id: '1',
      type: 'win', // Corrigido: usar 'win' em vez de 'won'
      value: 5000,
      date: '2024-01-15',
      stage: 'Fechado',
      notes: 'Cliente fechou contrato anual'
    },
    {
      id: '2',
      type: 'loss', // Corrigido: usar 'loss' em vez de 'lost'
      value: 3000,
      date: '2024-01-10',
      stage: 'Negociação',
      notes: 'Cliente desistiu por questões de orçamento'
    }
  ] as DealHistoryItem[]; // Corrigido: cast explícito

  if (!contact) {
    return (
      <div className={cn(
        "fixed top-0 right-0 h-full w-80 bg-gray-50 border-l shadow-md z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="p-6">
          <h2 className="text-lg font-semibold mb-4">Detalhes do Lead</h2>
          <p className="text-gray-500">Nenhum lead selecionado.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(
      "fixed top-0 right-0 h-full w-96 bg-white border-l shadow-md z-50 transform transition-transform duration-300 ease-in-out",
      isOpen ? "translate-x-0" : "translate-x-full"
    )}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-lg font-semibold">Detalhes do Lead</h2>
          <Button variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <Avatar>
            <AvatarImage src={contact.profilePicUrl} />
            <AvatarFallback>{contact.name?.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <h3 className="text-xl font-semibold">{contact.name}</h3>
            <p className="text-gray-500">{contact.phone}</p>
          </div>
        </div>

        <div className="space-y-4">
          {/* Informações de Contato */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Informações de Contato</h4>
            <div className="flex items-center space-x-2">
              <Phone className="h-4 w-4 text-gray-500" />
              <span>{contact.phone}</span>
            </div>
            {contact.email && (
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-gray-500" />
                <span>{contact.email}</span>
              </div>
            )}
          </div>

          {/* Documento */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Documento</h4>
            <DocumentSelector
              documentType={documentType}
              documentId={documentId}
              onDocumentTypeChange={(type) => setDocumentType(type)}
              onDocumentIdChange={(id) => setDocumentId(id)}
            />
          </div>

          {/* Valor da Negociação */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Valor da Negociação</h4>
            {isEditingValue ? (
              <div className="flex items-center space-x-2">
                <Input
                  type="number"
                  value={tempValue}
                  onChange={handleValueChange}
                  placeholder="Valor"
                />
                <Button size="sm" onClick={handleSaveValue}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={handleCancelEdit}>Cancelar</Button>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <span>{purchaseValue ? formatCurrency(purchaseValue) : 'Nenhum valor definido'}</span>
                <Button size="sm" variant="ghost" onClick={handleEditValue}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            )}
          </div>

          {/* Responsável */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Responsável</h4>
            <Select value={assignedUser} onValueChange={(value) => {
              setAssignedUser(value);
              handleSaveAssignedUser();
            }}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecionar responsável" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user1">Usuário 1</SelectItem>
                <SelectItem value="user2">Usuário 2</SelectItem>
                {/* Adicione mais usuários conforme necessário */}
              </SelectContent>
            </Select>
          </div>

          {/* Observações */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Observações</h4>
            <Textarea
              value={notes}
              onChange={handleNotesChange}
              placeholder="Adicione observações sobre o lead"
              className="min-h-[80px]"
            />
            <Button size="sm" onClick={handleSaveNotes}>Salvar Observações</Button>
          </div>

          {/* Histórico de Negociações */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-gray-700">Histórico de Negociações</h4>
            <DealHistory deals={mockDeals as Deal[]} />
          </div>
        </div>
      </div>
    </div>
  );
};
