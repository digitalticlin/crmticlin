import React, { useState, useEffect } from 'react';
import { Contact } from '@/types/chat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { X, Edit, Save, User, Phone, Mail, MapPin, Building, FileText, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

export interface LeadDetailsSidebarProps {
  selectedContact?: Contact | null;
  contact?: Contact;
  isOpen: boolean;
  onClose: () => void;
  onUpdateContact: (updatedContact: Contact) => void;
  onContactUpdate?: (updatedContact: Contact) => void;
  onLeadDetail?: (contact: Contact) => void;
}

export const LeadDetailsSidebar = ({
  selectedContact,
  contact,
  isOpen,
  onClose,
  onUpdateContact,
  onContactUpdate,
  onLeadDetail
}: LeadDetailsSidebarProps) => {
  const currentContact = selectedContact || contact;
  const [isEditing, setIsEditing] = useState(false);
  const [editedContact, setEditedContact] = useState<Contact | null>(null);

  useEffect(() => {
    if (currentContact) {
      setEditedContact({ ...currentContact });
    }
  }, [currentContact]);

  if (!currentContact) return null;

  const handleSave = async () => {
    if (!editedContact) return;

    try {
      // Call the appropriate update handler
      if (onUpdateContact) {
        onUpdateContact(editedContact);
      }
      if (onContactUpdate) {
        onContactUpdate(editedContact);
      }
      
      setIsEditing(false);
      toast.success('Contato atualizado com sucesso!');
    } catch (error) {
      console.error('Error updating contact:', error);
      toast.error('Erro ao atualizar contato');
    }
  };

  const handleCancel = () => {
    setEditedContact(currentContact ? { ...currentContact } : null);
    setIsEditing(false);
  };

  const handleInputChange = (field: keyof Contact, value: any) => {
    if (!editedContact) return;
    
    setEditedContact({
      ...editedContact,
      [field]: value
    });
  };

  return (
    <div className={`fixed right-0 top-0 h-full w-80 bg-white border-l shadow-lg transform transition-transform duration-300 ease-in-out z-50 ${
      isOpen ? 'translate-x-0' : 'translate-x-full'
    }`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Detalhes do Lead</h2>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
              >
                <Edit className="h-4 w-4" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancel}
                >
                  Cancelar
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSave}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Salvar
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Profile Section */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center space-x-3">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={currentContact.avatar || currentContact.profilePicUrl} />
                  <AvatarFallback>
                    {currentContact.name ? currentContact.name.charAt(0).toUpperCase() : currentContact.phone.slice(-2)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  {isEditing ? (
                    <Input
                      value={editedContact?.name || ''}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Nome do contato"
                      className="font-medium"
                    />
                  ) : (
                    <h3 className="font-medium text-lg">
                      {currentContact.name || 'Sem nome'}
                    </h3>
                  )}
                  <p className="text-sm text-gray-500">{currentContact.phone}</p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <User className="h-4 w-4 mr-2" />
                Informações de Contato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Telefone</Label>
                <div className="flex items-center mt-1">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  {isEditing ? (
                    <Input
                      value={editedContact?.phone || ''}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="Telefone"
                    />
                  ) : (
                    <span className="text-sm">{currentContact.phone}</span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Email</Label>
                <div className="flex items-center mt-1">
                  <Mail className="h-4 w-4 mr-2 text-gray-400" />
                  {isEditing ? (
                    <Input
                      value={editedContact?.email || ''}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="Email"
                      type="email"
                    />
                  ) : (
                    <span className="text-sm">{currentContact.email || 'Não informado'}</span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Endereço</Label>
                <div className="flex items-center mt-1">
                  <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                  {isEditing ? (
                    <Input
                      value={editedContact?.address || ''}
                      onChange={(e) => handleInputChange('address', e.target.value)}
                      placeholder="Endereço"
                    />
                  ) : (
                    <span className="text-sm">{currentContact.address || 'Não informado'}</span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Empresa</Label>
                <div className="flex items-center mt-1">
                  <Building className="h-4 w-4 mr-2 text-gray-400" />
                  {isEditing ? (
                    <Input
                      value={editedContact?.company || ''}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Empresa"
                    />
                  ) : (
                    <span className="text-sm">{currentContact.company || 'Não informado'}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Business Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Informações Comerciais
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs text-gray-500">Valor de Compra</Label>
                <div className="flex items-center mt-1">
                  {isEditing ? (
                    <Input
                      value={editedContact?.purchaseValue || ''}
                      onChange={(e) => handleInputChange('purchaseValue', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                      type="number"
                      step="0.01"
                    />
                  ) : (
                    <span className="text-sm">
                      {currentContact.purchaseValue 
                        ? `R$ ${currentContact.purchaseValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}` 
                        : 'Não informado'
                      }
                    </span>
                  )}
                </div>
              </div>

              <div>
                <Label className="text-xs text-gray-500">Responsável</Label>
                <div className="flex items-center mt-1">
                  <User className="h-4 w-4 mr-2 text-gray-400" />
                  {isEditing ? (
                    <Input
                      value={editedContact?.assignedUser || ''}
                      onChange={(e) => handleInputChange('assignedUser', e.target.value)}
                      placeholder="Responsável"
                    />
                  ) : (
                    <span className="text-sm">{currentContact.assignedUser || 'Não atribuído'}</span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm flex items-center">
                <FileText className="h-4 w-4 mr-2" />
                Observações
              </CardTitle>
            </CardHeader>
            <CardContent>
              {isEditing ? (
                <Textarea
                  value={editedContact?.notes || ''}
                  onChange={(e) => handleInputChange('notes', e.target.value)}
                  placeholder="Adicione observações sobre este lead..."
                  rows={4}
                />
              ) : (
                <p className="text-sm text-gray-600">
                  {currentContact.notes || 'Nenhuma observação adicionada'}
                </p>
              )}
            </CardContent>
          </Card>

          {/* Tags */}
          {currentContact.tags && currentContact.tags.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Tags</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {currentContact.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Resumo de Atividade</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Última mensagem:</span>
                <span>
                  {currentContact.lastMessageTime 
                    ? new Date(currentContact.lastMessageTime).toLocaleDateString('pt-BR')
                    : 'Nunca'
                  }
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Mensagens não lidas:</span>
                <span>{currentContact.unreadCount || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Criado em:</span>
                <span>
                  {currentContact.createdAt 
                    ? new Date(currentContact.createdAt).toLocaleDateString('pt-BR')
                    : 'Não informado'
                  }
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};
