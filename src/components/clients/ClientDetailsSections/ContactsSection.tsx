
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Phone, Mail, MessageSquare, Save, X, Plus, Trash2 } from "lucide-react";
import { ClientData, LeadContact } from "@/hooks/clients/types";

interface ContactsSectionProps {
  client: ClientData;
}

export function ContactsSection({ client }: ContactsSectionProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedContacts, setEditedContacts] = useState<LeadContact[]>(client.contacts || []);

  const handleSave = () => {
    // Here you can implement the update logic for contacts
    setIsEditing(false);
  };

  const addContact = () => {
    const newContact: LeadContact = {
      contact_type: 'phone',
      contact_value: '',
      is_primary: false
    };
    setEditedContacts([...editedContacts, newContact]);
  };

  const removeContact = (index: number) => {
    setEditedContacts(editedContacts.filter((_, i) => i !== index));
  };

  const updateContact = (index: number, updates: Partial<LeadContact>) => {
    const updated = [...editedContacts];
    updated[index] = { ...updated[index], ...updates };
    setEditedContacts(updated);
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageSquare className="h-4 w-4" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <MessageSquare className="h-5 w-5 text-[#d3d800]" />
          <h3 className="text-lg font-semibold text-gray-900">Contatos</h3>
        </div>
        {!isEditing && (
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setIsEditing(true)}
            className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <div className="space-y-4">
        {/* Telefone Principal */}
        <div className="flex items-start gap-3">
          <Phone className="h-5 w-5 text-[#d3d800] mt-0.5" />
          <div className="flex-1">
            <Label className="text-sm font-medium text-gray-700">Telefone Principal</Label>
            <p className="text-gray-900 font-medium">{client.phone}</p>
          </div>
          <Badge className="bg-green-100 text-green-800 border-green-200">Principal</Badge>
        </div>

        {/* Contatos Adicionais */}
        {isEditing ? (
          <div className="space-y-3">
            <Label className="text-sm font-medium text-gray-700">Contatos Adicionais</Label>
            {editedContacts.map((contact, index) => (
              <div key={index} className="flex gap-2 items-end">
                <div className="flex-1">
                  <Select 
                    value={contact.contact_type} 
                    onValueChange={(value) => updateContact(index, { contact_type: value as 'phone' | 'email' | 'whatsapp' })}
                  >
                    <SelectTrigger className="border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="phone">Telefone</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex-2">
                  <Input
                    value={contact.contact_value}
                    onChange={(e) => updateContact(index, { contact_value: e.target.value })}
                    className="border-gray-300 focus:border-[#d3d800] focus:ring-[#d3d800]"
                    placeholder="Valor do contato"
                  />
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeContact(index)}
                  className="text-red-600 hover:text-red-800 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={addContact}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Contato
            </Button>
          </div>
        ) : (
          <div className="space-y-2">
            {(client.contacts || []).map((contact, index) => (
              <div key={index} className="flex items-center gap-3">
                {getContactIcon(contact.contact_type)}
                <div>
                  <span className="text-sm text-gray-600 capitalize">{contact.contact_type}:</span>
                  <span className="text-gray-900 ml-2">{contact.contact_value}</span>
                  {contact.is_primary && (
                    <Badge className="ml-2 bg-blue-100 text-blue-800 border-blue-200 text-xs">Principal</Badge>
                  )}
                </div>
              </div>
            ))}
            {(!client.contacts || client.contacts.length === 0) && (
              <p className="text-gray-500 text-sm">Nenhum contato adicional cadastrado</p>
            )}
          </div>
        )}

        {isEditing && (
          <div className="flex gap-2 pt-4 border-t border-gray-200">
            <Button 
              size="sm" 
              onClick={handleSave}
              className="bg-[#d3d800] hover:bg-[#b8c200] text-black"
            >
              <Save className="h-3 w-3 mr-1" />
              Salvar
            </Button>
            <Button 
              size="sm" 
              variant="outline" 
              onClick={() => {
                setIsEditing(false);
                setEditedContacts(client.contacts || []);
              }}
              className="border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              <X className="h-3 w-3 mr-1" />
              Cancelar
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
