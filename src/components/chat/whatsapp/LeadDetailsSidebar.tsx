import React, { useState, useEffect } from 'react';
import { X, User, Mail, Building, DollarSign, UserCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Contact } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface LeadDetailsSidebarProps {
  selectedContact: Contact | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateContact: (contact: Contact) => void;
}

export const LeadDetailsSidebar = ({ 
  selectedContact, 
  isOpen, 
  onClose, 
  onUpdateContact 
}: LeadDetailsSidebarProps) => {
  const [formData, setFormData] = useState({
    name: selectedContact?.name || '',
    email: selectedContact?.email || '',
    company: selectedContact?.company || '',
    purchaseValue: selectedContact?.purchaseValue?.toString() || '',
    assignedUser: selectedContact?.assignedUser || '',
    notes: selectedContact?.notes || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (selectedContact) {
      setFormData({
        name: selectedContact.name || '',
        email: selectedContact.email || '',
        company: selectedContact.company || '',
        purchaseValue: selectedContact.purchaseValue?.toString() || '',
        assignedUser: selectedContact.assignedUser || '',
        notes: selectedContact.notes || '',
      });
    }
  }, [selectedContact]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const { data, error } = await supabase
        .from('leads')
        .update({
          name: formData.name,
          email: formData.email,
          company: formData.company,
          purchase_value: formData.purchaseValue ? parseFloat(formData.purchaseValue) : null,
          assigned_user: formData.assignedUser,
          notes: formData.notes,
        })
        .eq('id', selectedContact?.id)
        .select()
        .single();

      if (error) {
        console.error('Erro ao atualizar lead:', error);
        toast.error('Erro ao atualizar lead. Tente novamente.');
        return;
      }

      const updatedContact: Contact = {
        ...selectedContact,
        name: formData.name,
        email: formData.email,
        company: formData.company,
        purchaseValue: formData.purchaseValue ? parseFloat(formData.purchaseValue) : null,
        assignedUser: formData.assignedUser,
        notes: formData.notes,
      };

      onUpdateContact(updatedContact);
      toast.success('Lead atualizado com sucesso!');
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar lead:', error);
      toast.error('Erro ao atualizar lead. Tente novamente.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!selectedContact) return null;

  return (
    <>
      {/* Overlay para mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}
      
      {/* Sidebar */}
      <div className={cn(
        "fixed right-0 top-0 h-full w-80 bg-white/10 backdrop-blur-md border-l border-white/20 shadow-xl transform transition-transform duration-300 ease-in-out z-50",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-white/20">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-800">
                Detalhes do Lead
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="text-gray-600 hover:text-gray-800"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto glass-scrollbar p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Nome */}
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-medium text-gray-700">
                  <User className="h-4 w-4 inline mr-2" />
                  Nome
                </Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="bg-white/20 border-white/30 text-gray-800 placeholder:text-gray-600"
                  placeholder="Nome do lead"
                />
              </div>

              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium text-gray-700">
                  <Mail className="h-4 w-4 inline mr-2" />
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="bg-white/20 border-white/30 text-gray-800 placeholder:text-gray-600"
                  placeholder="email@exemplo.com"
                />
              </div>

              {/* Empresa */}
              <div className="space-y-2">
                <Label htmlFor="company" className="text-sm font-medium text-gray-700">
                  <Building className="h-4 w-4 inline mr-2" />
                  Empresa
                </Label>
                <Input
                  id="company"
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="bg-white/20 border-white/30 text-gray-800 placeholder:text-gray-600"
                  placeholder="Nome da empresa"
                />
              </div>

              {/* Valor de Compra */}
              <div className="space-y-2">
                <Label htmlFor="purchaseValue" className="text-sm font-medium text-gray-700">
                  <DollarSign className="h-4 w-4 inline mr-2" />
                  Valor de Compra
                </Label>
                <Input
                  id="purchaseValue"
                  type="number"
                  step="0.01"
                  value={formData.purchaseValue}
                  onChange={(e) => setFormData({ ...formData, purchaseValue: e.target.value })}
                  className="bg-white/20 border-white/30 text-gray-800 placeholder:text-gray-600"
                  placeholder="0.00"
                />
              </div>

              {/* Usuário Responsável */}
              <div className="space-y-2">
                <Label htmlFor="assignedUser" className="text-sm font-medium text-gray-700">
                  <UserCheck className="h-4 w-4 inline mr-2" />
                  Usuário Responsável
                </Label>
                <Input
                  id="assignedUser"
                  value={formData.assignedUser}
                  onChange={(e) => setFormData({ ...formData, assignedUser: e.target.value })}
                  className="bg-white/20 border-white/30 text-gray-800 placeholder:text-gray-600"
                  placeholder="Nome do responsável"
                />
              </div>

              {/* Observações */}
              <div className="space-y-2">
                <Label htmlFor="notes" className="text-sm font-medium text-gray-700">
                  Observações
                </Label>
                <Textarea
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="bg-white/20 border-white/30 text-gray-800 placeholder:text-gray-600 min-h-[100px]"
                  placeholder="Observações sobre o lead..."
                />
              </div>

              {/* Botões */}
              <div className="flex space-x-2 pt-4">
                <Button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700"
                >
                  {isSaving ? 'Salvando...' : 'Salvar'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onClose}
                  className="border-white/30 text-gray-700 hover:bg-white/10"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};
