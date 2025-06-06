
import { useState } from "react";
import { Contact } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, MapPin, Building, FileText } from "lucide-react";

interface BasicInfoSectionProps {
  selectedContact: Contact;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editedContact: Partial<Contact>;
  setEditedContact: (contact: Partial<Contact>) => void;
  onSave: () => void;
  isLoading: boolean;
}

export const BasicInfoSection = ({
  selectedContact,
  isEditing,
  setIsEditing,
  editedContact,
  setEditedContact,
  onSave,
  isLoading
}: BasicInfoSectionProps) => {
  const currentContact = { ...selectedContact, ...editedContact };

  return (
    <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 shadow-lg border border-white/30">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <User className="h-5 w-5 text-lime-400" />
          Informações Básicas
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsEditing(!isEditing)}
          className="text-lime-400 hover:text-lime-500 hover:bg-lime-50 rounded-lg"
        >
          {isEditing ? 'Cancelar' : 'Editar'}
        </Button>
      </div>

      <div className="space-y-4">
        {/* Nome */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <User className="h-4 w-4 text-lime-400" />
            Nome
          </Label>
          {isEditing ? (
            <Input
              value={editedContact.name || currentContact.name}
              onChange={(e) => setEditedContact({...editedContact, name: e.target.value})}
              className="bg-white/70 border-white/30 focus:border-lime-400 focus:ring-lime-400/20"
            />
          ) : (
            <p className="text-gray-800 font-medium">{currentContact.name}</p>
          )}
        </div>

        {/* Telefone */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <Phone className="h-4 w-4 text-lime-400" />
            Telefone
          </Label>
          <p className="text-gray-700 bg-gray-50/50 p-2 rounded-lg">{currentContact.phone}</p>
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-lime-400" />
            Email
          </Label>
          {isEditing ? (
            <Input
              type="email"
              value={editedContact.email || currentContact.email || ''}
              onChange={(e) => setEditedContact({...editedContact, email: e.target.value})}
              className="bg-white/70 border-white/30 focus:border-lime-400 focus:ring-lime-400/20"
              placeholder="email@exemplo.com"
            />
          ) : (
            <p className="text-gray-700">{currentContact.email || 'Não informado'}</p>
          )}
        </div>

        {/* Empresa */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <Building className="h-4 w-4 text-lime-400" />
            Empresa
          </Label>
          {isEditing ? (
            <Input
              value={editedContact.company || currentContact.company || ''}
              onChange={(e) => setEditedContact({...editedContact, company: e.target.value})}
              className="bg-white/70 border-white/30 focus:border-lime-400 focus:ring-lime-400/20"
              placeholder="Nome da empresa"
            />
          ) : (
            <p className="text-gray-700">{currentContact.company || 'Não informado'}</p>
          )}
        </div>

        {/* CPF/CNPJ */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-lime-400" />
            CPF/CNPJ
          </Label>
          {isEditing ? (
            <Input
              value={editedContact.documentId || currentContact.documentId || ''}
              onChange={(e) => setEditedContact({...editedContact, documentId: e.target.value})}
              className="bg-white/70 border-white/30 focus:border-lime-400 focus:ring-lime-400/20"
              placeholder="000.000.000-00 ou 00.000.000/0000-00"
            />
          ) : (
            <p className="text-gray-700">{currentContact.documentId || 'Não informado'}</p>
          )}
        </div>

        {/* Endereço */}
        <div className="space-y-2">
          <Label className="text-gray-700 font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4 text-lime-400" />
            Endereço
          </Label>
          {isEditing ? (
            <Input
              value={editedContact.address || currentContact.address || ''}
              onChange={(e) => setEditedContact({...editedContact, address: e.target.value})}
              className="bg-white/70 border-white/30 focus:border-lime-400 focus:ring-lime-400/20"
              placeholder="Endereço completo"
            />
          ) : (
            <p className="text-gray-700">{currentContact.address || 'Não informado'}</p>
          )}
        </div>

        {isEditing && (
          <Button 
            onClick={onSave} 
            disabled={isLoading}
            className="w-full bg-lime-400/80 hover:bg-lime-500/80 text-black border border-lime-400 shadow-lg rounded-lg font-semibold"
          >
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        )}
      </div>
    </div>
  );
};
