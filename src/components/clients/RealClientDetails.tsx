
import { ClientData } from "@/hooks/clients/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, Phone, Mail, Building, MapPin, Calendar, DollarSign } from "lucide-react";
import { useState } from "react";
import { formatPhoneDisplay } from "@/utils/phoneFormatter";

interface RealClientDetailsProps {
  client: ClientData;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: (client: ClientData) => void;
  onUpdateNotes: (notes: string) => void;
  onUpdatePurchaseValue: (value: number | undefined) => void;
}

export function RealClientDetails({
  client,
  isOpen,
  onOpenChange,
  onEdit,
  onUpdateNotes,
  onUpdatePurchaseValue
}: RealClientDetailsProps) {
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isEditingValue, setIsEditingValue] = useState(false);
  const [notesValue, setNotesValue] = useState(client.notes || "");
  const [purchaseValue, setPurchaseValue] = useState(client.purchase_value?.toString() || "");

  const handleSaveNotes = () => {
    onUpdateNotes(notesValue);
    setIsEditingNotes(false);
  };

  const handleSaveValue = () => {
    const value = purchaseValue ? parseFloat(purchaseValue) : undefined;
    onUpdatePurchaseValue(value);
    setIsEditingValue(false);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "Não informado";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = () => {
    if (client.purchase_value && client.purchase_value > 0) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">Cliente</Badge>;
    }
    return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Lead</Badge>;
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-[500px] overflow-y-auto">
        <SheetHeader className="space-y-4">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold">{client.name}</SheetTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(client)}
              className="flex items-center gap-2"
            >
              <Edit className="h-4 w-4" />
              Editar
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Informações de Contato</h3>
            
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-500" />
                <div>
                  <Label className="text-sm font-medium text-gray-700">Telefone</Label>
                  <p className="text-sm">{formatPhoneDisplay(client.phone)}</p>
                </div>
              </div>

              {client.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <p className="text-sm">{client.email}</p>
                  </div>
                </div>
              )}

              {client.company && (
                <div className="flex items-center gap-3">
                  <Building className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Empresa</Label>
                    <p className="text-sm">{client.company}</p>
                  </div>
                </div>
              )}

              {client.address && (
                <div className="flex items-center gap-3">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Endereço</Label>
                    <p className="text-sm">{client.address}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Purchase Value */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Valor de Compra</h3>
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-gray-500" />
              <div className="flex-1">
                {isEditingValue ? (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={purchaseValue}
                      onChange={(e) => setPurchaseValue(e.target.value)}
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSaveValue}>
                        Salvar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setIsEditingValue(false);
                          setPurchaseValue(client.purchase_value?.toString() || "");
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-gray-700">Valor</Label>
                      <p className="text-sm font-medium">{formatCurrency(client.purchase_value)}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setIsEditingValue(true)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Observações</h3>
            {isEditingNotes ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Adicione observações sobre o cliente..."
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  className="min-h-[100px]"
                />
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleSaveNotes}>
                    Salvar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditingNotes(false);
                      setNotesValue(client.notes || "");
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {client.notes ? (
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{client.notes}</p>
                  ) : (
                    <p className="text-sm text-gray-500 italic">Nenhuma observação adicionada</p>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setIsEditingNotes(true)}
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Creation Date */}
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-900 border-b pb-2">Informações do Sistema</h3>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-500" />
              <div>
                <Label className="text-sm font-medium text-gray-700">Data de Criação</Label>
                <p className="text-sm">{new Date(client.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
