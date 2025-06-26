
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
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <User className="h-5 w-5 text-lime-400" />
          Informações Básicas
        </h3>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setIsEditing(!isEditing)}
          className="text-lime-400 hover:text-lime-500 hover:bg-lime-50 rounded-lg text-xs px-2 py-1"
        >
          {isEditing ? 'Cancelar' : 'Editar'}
        </Button>
      </div>

      <div className="space-y-3">
        {/* Nome */}
        <div className="space-y-1">
          <Label className="text-gray-700 font-medium flex items-center gap-2 text-sm">
            <User className="h-3 w-3 text-lime-400" />
            Nome
          </Label>
          {isEditing ? (
            <Input
              value={editedContact.name || currentContact.name}
              onChange={(e) => setEditedContact({...editedContact, name: e.target.value})}
              className="bg-white/80 border-white/40 focus:border-lime-400 focus:ring-lime-400/20 text-sm h-8"
            />
          ) : (
            <p className="text-gray-800 font-medium text-sm break-words">{currentContact.name}</p>
          )}
        </div>

        {/* Telefone */}
        <div className="space-y-1">
          <Label className="text-gray-700 font-medium flex items-center gap-2 text-sm">
            <Phone className="h-3 w-3 text-lime-400" />
            Telefone
          </Label>
          <p className="text-gray-700 bg-gray-50/60 p-2 rounded-lg text-sm break-all">{currentContact.phone}</p>
        </div>

        {/* Email */}
        <div className="space-y-1">
          <Label className="text-gray-700 font-medium flex items-center gap-2 text-sm">
            <Mail className="h-3 w-3 text-lime-400" />
            Email
          </Label>
          {isEditing ? (
            <Input
              type="email"
              value={editedContact.email || currentContact.email || ''}
              onChange={(e) => setEditedContact({...editedContact, email: e.target.value})}
              className="bg-white/80 border-white/40 focus:border-lime-400 focus:ring-lime-400/20 text-sm h-8"
              placeholder="email@exemplo.com"
            />
          ) : (
            <p className="text-gray-700 text-sm break-words">{currentContact.email || 'Não informado'}</p>
          )}
        </div>

        {/* Empresa */}
        <div className="space-y-1">
          <Label className="text-gray-700 font-medium flex items-center gap-2 text-sm">
            <Building className="h-3 w-3 text-lime-400" />
            Empresa
          </Label>
          {isEditing ? (
            <Input
              value={editedContact.company || currentContact.company || ''}
              onChange={(e) => setEditedContact({...editedContact, company: e.target.value})}
              className="bg-white/80 border-white/40 focus:border-lime-400 focus:ring-lime-400/20 text-sm h-8"
              placeholder="Nome da empresa"
            />
          ) : (
            <p className="text-gray-700 text-sm break-words">{currentContact.company || 'Não informado'}</p>
          )}
        </div>

        {/* CPF/CNPJ */}
        <div className="space-y-1">
          <Label className="text-gray-700 font-medium flex items-center gap-2 text-sm">
            <FileText className="h-3 w-3 text-lime-400" />
            CPF/CNPJ
          </Label>
          {isEditing ? (
            <Input
              value={editedContact.documentId || currentContact.documentId || ''}
              onChange={(e) => setEditedContact({...editedContact, documentId: e.target.value})}
              className="bg-white/80 border-white/40 focus:border-lime-400 focus:ring-lime-400/20 text-sm h-8"
              placeholder="000.000.000-00"
            />
          ) : (
            <p className="text-gray-700 text-sm break-words">{currentContact.documentId || 'Não informado'}</p>
          )}
        </div>

        {/* Endereço */}
        <div className="space-y-1">
          <Label className="text-gray-700 font-medium flex items-center gap-2 text-sm">
            <MapPin className="h-3 w-3 text-lime-400" />
            Endereço
          </Label>
          {isEditing ? (
            <Input
              value={editedContact.address || currentContact.address || ''}
              onChange={(e) => setEditedContact({...editedContact, address: e.target.value})}
              className="bg-white/80 border-white/40 focus:border-lime-400 focus:ring-lime-400/20 text-sm h-8"
              placeholder="Endereço completo"
            />
          ) : (
            <p className="text-gray-700 text-sm break-words">{currentContact.address || 'Não informado'}</p>
          )}
        </div>

        {isEditing && (
          <Button 
            onClick={onSave} 
            disabled={isLoading}
            className="w-full bg-lime-400/80 hover:bg-lime-500/80 text-black border border-lime-400 shadow-lg rounded-lg font-semibold text-sm h-8 mt-4"
          >
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </Button>
        )}
      </div>
    </div>
  );
};
