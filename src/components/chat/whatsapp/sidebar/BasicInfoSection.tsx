
import { useState } from "react";
import { Contact } from "@/types/chat";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, Mail, MapPin, Building, FileText, Save, X } from "lucide-react";

interface BasicInfoSectionProps {
  selectedContact: Contact;
  isEditing: boolean;
  setIsEditing: (editing: boolean) => void;
  editedContact: Partial<Contact>;
  setEditedContact: (contact: Partial<Contact>) => void;
  onSave: () => void;
  isLoading: boolean;
  onUpdateBasicInfo?: (field: string, value: string) => void;
}

export const BasicInfoSection = ({
  selectedContact,
  isEditing,
  setIsEditing,
  editedContact,
  setEditedContact,
  onSave,
  isLoading,
  onUpdateBasicInfo
}: BasicInfoSectionProps) => {
  const [localEditing, setLocalEditing] = useState<string | null>(null);
  const [tempValue, setTempValue] = useState<string>('');

  const currentContact = { ...selectedContact, ...editedContact };

  // Função para iniciar edição de um campo específico
  const startFieldEdit = (field: string, currentValue: string) => {
    setLocalEditing(field);
    setTempValue(currentValue || '');
  };

  // Função para salvar um campo específico
  const saveField = async (field: string) => {
    if (onUpdateBasicInfo && tempValue !== (currentContact[field as keyof Contact] || '')) {
      await onUpdateBasicInfo(field, tempValue);
      
      // ✅ SINCRONIZAÇÃO EM TEMPO REAL: Disparar evento quando nome é alterado
      if (field === 'name' && selectedContact.leadId) {
        console.log('[BasicInfoSection] 📡 Disparando evento de atualização de nome:', {
          leadId: selectedContact.leadId,
          oldName: currentContact[field as keyof Contact] || '',
          newName: tempValue
        });
        
        // Disparar evento customizado para sincronizar nome em todos os componentes
        window.dispatchEvent(new CustomEvent('contactNameUpdated', {
          detail: {
            leadId: selectedContact.leadId,
            contactId: selectedContact.id,
            newName: tempValue,
            oldName: currentContact[field as keyof Contact] || ''
          }
        }));
      }
    }
    setLocalEditing(null);
    setTempValue('');
  };

  // Função para cancelar edição de um campo
  const cancelFieldEdit = () => {
    setLocalEditing(null);
    setTempValue('');
  };

  // ✅ CORREÇÃO: Componente para renderizar um campo editável
  const EditableField = ({ 
    label, 
    field, 
    icon: Icon, 
    placeholder, 
    readOnly = false,
    type = "text" 
  }: {
    label: string;
    field: keyof Contact;
    icon: any;
    placeholder?: string;
    readOnly?: boolean;
    type?: string;
  }) => {
    const value = currentContact[field] as string || '';
    const isEditingThisField = localEditing === field;

    return (
      <div className="space-y-1">
        <Label className="text-gray-700 font-medium flex items-center gap-2 text-sm">
          <Icon className="h-3 w-3 text-lime-400" />
          {label}
        </Label>
        
        {readOnly ? (
          <p className="text-gray-700 bg-gray-50/60 p-2 rounded-lg text-sm break-all">{value}</p>
        ) : isEditingThisField ? (
          <div className="space-y-2">
            <Input
              type={type}
              value={tempValue}
              onChange={(e) => setTempValue(e.target.value)}
              className="bg-white/80 border-white/40 focus:border-lime-400 focus:ring-lime-400/20 text-sm h-8"
              placeholder={placeholder}
              autoFocus
            />
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => saveField(field as string)}
                disabled={isLoading}
                className="bg-lime-400/80 hover:bg-lime-500/80 text-black border border-lime-400 shadow-lg rounded-lg font-semibold text-xs h-6 px-2"
              >
                <Save className="h-3 w-3 mr-1" />
                {isLoading ? 'Salvando...' : 'Salvar'}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={cancelFieldEdit}
                className="text-gray-600 border-gray-300 hover:bg-gray-50 text-xs h-6 px-2"
              >
                <X className="h-3 w-3 mr-1" />
                Cancelar
              </Button>
            </div>
          </div>
        ) : (
          <div 
            className="text-gray-700 text-sm break-words cursor-pointer hover:bg-gray-50/60 p-2 rounded-lg transition-colors"
            onClick={() => startFieldEdit(field as string, value)}
          >
            {value || (
              <span className="text-gray-400 italic">
                Clique para adicionar {label.toLowerCase()}
              </span>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-white/40">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <User className="h-5 w-5 text-lime-400" />
          Informações Básicas
        </h3>
        {isEditing && (
          <Button 
            onClick={() => setIsEditing(false)}
            variant="ghost" 
            size="sm" 
            className="text-lime-400 hover:text-lime-500 hover:bg-lime-50 rounded-lg text-xs px-2 py-1"
          >
            Cancelar Edição em Lote
          </Button>
        )}
      </div>

      <div className="space-y-3">
        <EditableField
          label="Nome"
          field="name"
          icon={User}
          placeholder="Nome completo"
        />

        <EditableField
          label="Telefone"
          field="phone"
          icon={Phone}
          readOnly={true}
        />

        <EditableField
          label="Email"
          field="email"
          icon={Mail}
          placeholder="email@exemplo.com"
          type="email"
        />

        <EditableField
          label="Empresa"
          field="company"
          icon={Building}
          placeholder="Nome da empresa"
        />

        <EditableField
          label="CPF/CNPJ"
          field="documentId"
          icon={FileText}
          placeholder="000.000.000-00"
        />

        <EditableField
          label="Endereço"
          field="address"
          icon={MapPin}
          placeholder="Endereço completo"
        />
      </div>
    </div>
  );
};
