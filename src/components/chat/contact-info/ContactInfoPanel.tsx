
import { useState } from "react";
import { Contact } from "@/types/chat";
import { formatCurrency } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { DealHistory } from "@/components/chat/DealHistory";
import { 
  CheckCircle, XCircle, User, Mail, Phone, 
  Tag, StickyNote, MessageSquare, Plus, X, DollarSign 
} from "lucide-react";

interface ContactInfoPanelProps {
  selectedContact: Contact;
  onOpenContactDetails: () => void;
}

export function ContactInfoPanel({ 
  selectedContact, 
  onOpenContactDetails 
}: ContactInfoPanelProps) {
  const [contactData, setContactData] = useState({
    name: selectedContact.name,
    email: selectedContact.email || "",
    phone: selectedContact.phone,
    tags: selectedContact.tags || [],
    notes: selectedContact.notes || "",
    purchaseValue: selectedContact.purchaseValue || 0,
    assignedUser: selectedContact.assignedUser || ""
  });

  const handleInputChange = (field: string, value: any) => {
    setContactData({
      ...contactData,
      [field]: value
    });
  };

  const handleSaveContact = () => {
    console.log("Saving contact data:", contactData);
  };

  const handleAddTag = (tag: string) => {
    if (tag && !contactData.tags.includes(tag)) {
      setContactData({
        ...contactData,
        tags: [...contactData.tags, tag]
      });
    }
  };

  const handleRemoveTag = (tag: string) => {
    setContactData({
      ...contactData,
      tags: contactData.tags.filter(t => t !== tag)
    });
  };

  const handleMarkDeal = (status: "won" | "lost") => {
    console.log(`Marking deal as ${status} for contact: ${selectedContact.id}`);
  };

  // Mock deal history data
  const mockDeals = [
    {
      id: "deal1",
      status: "won" as const,
      value: 5000,
      date: "12/05/2025",
      note: "Cliente aceitou proposta do plano básico"
    },
    {
      id: "deal2",
      status: "lost" as const,
      value: 8500,
      date: "02/04/2025",
      note: "Cliente optou por concorrente com preço menor"
    },
    {
      id: "deal3",
      status: "won" as const,
      value: 12000,
      date: "15/03/2025",
      note: "Upgrade do plano básico para premium"
    }
  ];

  return (
    <div className="h-full p-4 border-l border-gray-200 dark:border-gray-700 bg-white/5 dark:bg-black/5 backdrop-blur-lg flex flex-col overflow-auto">
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-4">Informações do Lead</h3>
        
        <ContactInfoFields 
          contactData={contactData}
          onInputChange={handleInputChange}
          onAddTag={handleAddTag}
          onRemoveTag={handleRemoveTag}
        />
      </div>
      
      <div className="mb-4">
        <h3 className="font-semibold text-lg mb-2 flex items-center">
          Histórico de Negociações
        </h3>
        
        <div className="flex gap-2 mb-3">
          <Button 
            variant="outline"
            className="flex-1 gap-1 bg-green-50 hover:bg-green-100 text-green-700 border-green-200"
            onClick={() => handleMarkDeal("won")}
          >
            <CheckCircle className="h-4 w-4" />
            Marcar Ganho
          </Button>
          
          <Button 
            variant="outline" 
            className="flex-1 gap-1 bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
            onClick={() => handleMarkDeal("lost")}
          >
            <XCircle className="h-4 w-4" />
            Marcar Perdido
          </Button>
        </div>
        
        <DealHistory deals={mockDeals} />
      </div>
      
      <div className="mt-auto">
        <Button 
          className="w-full bg-primary hover:bg-primary/90"
          onClick={handleSaveContact}
        >
          Salvar Alterações
        </Button>
        <Button 
          variant="outline" 
          className="w-full mt-2 flex gap-1"
          onClick={onOpenContactDetails}
        >
          <MessageSquare className="h-4 w-4" />
          Ver Histórico Completo
        </Button>
      </div>
    </div>
  );
}

// Sub-component for contact info fields
interface ContactInfoFieldsProps {
  contactData: {
    name: string;
    email: string;
    phone: string;
    tags: string[];
    notes: string;
    purchaseValue: number;
    assignedUser: string;
  };
  onInputChange: (field: string, value: any) => void;
  onAddTag: (tag: string) => void;
  onRemoveTag: (tag: string) => void;
}

function ContactInfoFields({ 
  contactData, 
  onInputChange, 
  onAddTag, 
  onRemoveTag 
}: ContactInfoFieldsProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium mb-1 flex items-center">
          <User className="h-4 w-4 mr-1" /> Nome
        </label>
        <Input 
          value={contactData.name} 
          onChange={(e) => onInputChange("name", e.target.value)}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 flex items-center">
          <Mail className="h-4 w-4 mr-1" /> Email
        </label>
        <Input 
          value={contactData.email} 
          onChange={(e) => onInputChange("email", e.target.value)}
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 flex items-center">
          <Phone className="h-4 w-4 mr-1" /> Telefone
        </label>
        <Input 
          value={contactData.phone} 
          onChange={(e) => onInputChange("phone", e.target.value)}
        />
      </div>

      <div>
        <label className="text-sm font-medium mb-1 flex items-center">
          <DollarSign className="h-4 w-4 mr-1" /> Valor da Compra
        </label>
        <Input 
          type="number"
          value={contactData.purchaseValue} 
          onChange={(e) => onInputChange("purchaseValue", parseFloat(e.target.value) || 0)}
          placeholder="0.00"
        />
        {contactData.purchaseValue > 0 && (
          <p className="text-xs text-muted-foreground mt-1">
            {formatCurrency(contactData.purchaseValue)}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium mb-1 flex items-center">
          <User className="h-4 w-4 mr-1" /> Responsável
        </label>
        <Input 
          value={contactData.assignedUser} 
          onChange={(e) => onInputChange("assignedUser", e.target.value)}
          placeholder="Atribuir responsável"
        />
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 flex items-center">
          <Tag className="h-4 w-4 mr-1" /> Etiquetas
        </label>
        <div className="flex flex-wrap gap-1 mb-2">
          {contactData.tags.map((tag, index) => (
            <Badge key={index} variant="secondary" className="flex items-center gap-1">
              {tag}
              <button 
                onClick={() => onRemoveTag(tag)}
                className="ml-1 hover:text-destructive"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
        <div className="flex gap-1">
          <Input 
            placeholder="Nova etiqueta"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                onAddTag(e.currentTarget.value);
                e.currentTarget.value = "";
              }
            }}
          />
          <Button 
            size="icon" 
            variant="outline"
            onClick={() => {
              const input = document.querySelector('input[placeholder="Nova etiqueta"]') as HTMLInputElement;
              if (input) {
                onAddTag(input.value);
                input.value = "";
              }
            }}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div>
        <label className="text-sm font-medium mb-1 flex items-center">
          <StickyNote className="h-4 w-4 mr-1" /> Observações
        </label>
        <Textarea 
          value={contactData.notes} 
          onChange={(e) => onInputChange("notes", e.target.value)} 
          className="min-h-[120px]"
        />
      </div>
    </div>
  );
}
