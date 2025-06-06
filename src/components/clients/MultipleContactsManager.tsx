import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Phone, Mail, MessageCircle } from "lucide-react";
import { LeadContact } from "@/hooks/clients/types";

interface MultipleContactsManagerProps {
  contacts: LeadContact[];
  onChange: (contacts: LeadContact[]) => void;
  disabled?: boolean;
}

export const MultipleContactsManager = ({ contacts, onChange, disabled }: MultipleContactsManagerProps) => {
  const addContact = () => {
    const newContact: LeadContact = {
      contact_type: 'phone',
      contact_value: '',
      is_primary: contacts.length === 0,
    };
    onChange([...contacts, newContact]);
  };

  const updateContact = (index: number, field: keyof LeadContact, value: any) => {
    const updated = contacts.map((contact, i) => {
      if (i === index) {
        const updatedContact = { ...contact, [field]: value };
        // Se marcar como primário, desmarcar outros
        if (field === 'is_primary' && value === true) {
          return updatedContact;
        }
        return updatedContact;
      } else if (field === 'is_primary' && value === true) {
        return { ...contact, is_primary: false };
      }
      return contact;
    });
    onChange(updated);
  };

  const removeContact = (index: number) => {
    const updated = contacts.filter((_, i) => i !== index);
    // Se removeu o primário e ainda há contatos, marcar o primeiro como primário
    if (contacts[index]?.is_primary && updated.length > 0) {
      updated[0].is_primary = true;
    }
    onChange(updated);
  };

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'whatsapp': return <MessageCircle className="h-4 w-4" />;
      default: return <Phone className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-gray-700 font-medium">Contatos</Label>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addContact}
          disabled={disabled}
          className="h-8 text-xs bg-white/20 border-white/40 hover:bg-white/30 backdrop-blur-sm"
        >
          <Plus className="h-3 w-3 mr-1" />
          Adicionar
        </Button>
      </div>

      {contacts.map((contact, index) => (
        <div key={index} className="border border-white/30 rounded-lg p-3 space-y-3 bg-white/20 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {getContactIcon(contact.contact_type)}
              <span className="text-sm font-medium">
                {contact.is_primary ? 'Contato Principal' : `Contato ${index + 1}`}
              </span>
            </div>
            {contacts.length > 1 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeContact(index)}
                disabled={disabled}
                className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs text-gray-600">Tipo</Label>
              <Select
                value={contact.contact_type}
                onValueChange={(value) => updateContact(index, 'contact_type', value)}
                disabled={disabled}
              >
                <SelectTrigger className="h-8 bg-white/50 border-white/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Telefone</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="whatsapp">WhatsApp</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-600">Contato</Label>
              <Input
                value={contact.contact_value}
                onChange={(e) => updateContact(index, 'contact_value', e.target.value)}
                placeholder={
                  contact.contact_type === 'email' 
                    ? 'email@exemplo.com' 
                    : '(00) 00000-0000'
                }
                disabled={disabled}
                className="h-8 bg-white/50 border-white/40"
              />
            </div>

            <div className="flex items-end">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={contact.is_primary}
                  onChange={(e) => updateContact(index, 'is_primary', e.target.checked)}
                  disabled={disabled}
                  className="rounded border-white/40"
                />
                <span className="text-xs text-gray-600">Principal</span>
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
