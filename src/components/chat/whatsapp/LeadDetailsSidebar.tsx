
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Contact } from '@/types/chat';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Building, 
  FileText, 
  Calendar,
  DollarSign,
  TrendingUp,
  Edit3,
  Save,
  X
} from 'lucide-react';

export interface LeadDetailsSidebarProps {
  contact: Contact;
  isOpen: boolean;
  onClose: () => void;
  onUpdateContact: (updatedContact: Contact) => void;
}

export const LeadDetailsSidebar = ({ 
  contact, 
  isOpen, 
  onClose, 
  onUpdateContact 
}: LeadDetailsSidebarProps) => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [editData, setEditData] = useState({
    name: contact.name || '',
    email: contact.email || '',
    address: contact.address || '',
    company: contact.company || '',
    notes: contact.notes || '',
    purchaseValue: contact.purchaseValue || 0
  });

  useEffect(() => {
    setEditData({
      name: contact.name || '',
      email: contact.email || '',
      address: contact.address || '',
      company: contact.company || '',
      notes: contact.notes || '',
      purchaseValue: contact.purchaseValue || 0
    });
  }, [contact]);

  const handleSave = async () => {
    if (!user || !contact.id) return;

    setIsLoading(true);
    try {
      const { error } = await supabase
        .from('leads')
        .update({
          name: editData.name,
          email: editData.email,
          address: editData.address,
          company: editData.company,
          notes: editData.notes,
          purchase_value: editData.purchaseValue,
          updated_at: new Date().toISOString()
        })
        .eq('id', contact.id)
        .eq('created_by_user_id', user.id);

      if (error) throw error;

      const updatedContact = {
        ...contact,
        name: editData.name,
        email: editData.email,
        address: editData.address,
        company: editData.company,
        notes: editData.notes,
        purchaseValue: editData.purchaseValue
      };

      onUpdateContact(updatedContact);
      setIsEditing(false);
      toast.success('Contato atualizado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao atualizar contato:', error);
      toast.error('Erro ao atualizar contato: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      name: contact.name || '',
      email: contact.email || '',
      address: contact.address || '',
      company: contact.company || '',
      notes: contact.notes || '',
      purchaseValue: contact.purchaseValue || 0
    });
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-96 bg-white border-l border-gray-200 shadow-lg z-50 overflow-y-auto">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Detalhes do Lead</h2>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit3 className="w-4 h-4" />
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  <X className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  onClick={handleSave}
                  disabled={isLoading}
                >
                  <Save className="w-4 h-4" />
                </Button>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Informações Básicas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-4 h-4" />
              Informações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              {isEditing ? (
                <Input
                  id="name"
                  value={editData.name}
                  onChange={(e) => setEditData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Nome do contato"
                />
              ) : (
                <p className="text-sm text-gray-600">{contact.name || 'Não informado'}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Telefone</Label>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-gray-400" />
                <p className="text-sm text-gray-600">{contact.phone}</p>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              {isEditing ? (
                <Input
                  id="email"
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="email@exemplo.com"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{contact.email || 'Não informado'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Endereço</Label>
              {isEditing ? (
                <Input
                  id="address"
                  value={editData.address}
                  onChange={(e) => setEditData(prev => ({ ...prev, address: e.target.value }))}
                  placeholder="Endereço completo"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{contact.address || 'Não informado'}</p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="company">Empresa</Label>
              {isEditing ? (
                <Input
                  id="company"
                  value={editData.company}
                  onChange={(e) => setEditData(prev => ({ ...prev, company: e.target.value }))}
                  placeholder="Nome da empresa"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <Building className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-600">{contact.company || 'Não informado'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Informações de Vendas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Informações de Vendas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="purchaseValue">Valor Potencial</Label>
              {isEditing ? (
                <Input
                  id="purchaseValue"
                  type="number"
                  value={editData.purchaseValue}
                  onChange={(e) => setEditData(prev => ({ ...prev, purchaseValue: Number(e.target.value) }))}
                  placeholder="0"
                />
              ) : (
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-600">
                    {contact.purchaseValue ? `R$ ${contact.purchaseValue.toLocaleString()}` : 'Não informado'}
                  </p>
                </div>
              )}
            </div>

            {contact.funnelStage && (
              <div className="space-y-2">
                <Label>Estágio do Funil</Label>
                <Badge variant="outline">{contact.funnelStage}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Notas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Observações
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isEditing ? (
              <Textarea
                value={editData.notes}
                onChange={(e) => setEditData(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Adicione observações sobre este contato..."
                rows={4}
              />
            ) : (
              <p className="text-sm text-gray-600">
                {contact.notes || 'Nenhuma observação adicionada'}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Informações de Atividade */}
        {(contact.lastMessage || contact.createdAt) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Atividade
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {contact.lastMessage && (
                <div>
                  <Label className="text-xs text-gray-500">Última Mensagem</Label>
                  <p className="text-sm text-gray-600 mt-1">{contact.lastMessage}</p>
                  {contact.lastMessageTime && (
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(contact.lastMessageTime).toLocaleString()}
                    </p>
                  )}
                </div>
              )}
              
              {contact.createdAt && (
                <div>
                  <Label className="text-xs text-gray-500">Primeiro Contato</Label>
                  <p className="text-sm text-gray-600 mt-1">
                    {new Date(contact.createdAt).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};
