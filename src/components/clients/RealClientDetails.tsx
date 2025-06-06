
import { ClientData } from "@/hooks/clients/types";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Edit, Phone, Mail, Building, MapPin, Calendar, DollarSign, FileText, Save, X } from "lucide-react";
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
  const [isEditingBasicInfo, setIsEditingBasicInfo] = useState(false);
  const [notesValue, setNotesValue] = useState(client.notes || "");
  const [purchaseValue, setPurchaseValue] = useState(client.purchase_value?.toString() || "");
  const [editedClient, setEditedClient] = useState({
    name: client.name,
    email: client.email || "",
    address: client.address || "",
    company: client.company || ""
  });

  const handleSaveNotes = () => {
    onUpdateNotes(notesValue);
    setIsEditingNotes(false);
  };

  const handleSaveValue = () => {
    const value = purchaseValue ? parseFloat(purchaseValue) : undefined;
    onUpdatePurchaseValue(value);
    setIsEditingValue(false);
  };

  const handleSaveBasicInfo = () => {
    // Aqui você pode implementar a atualização das informações básicas
    // Por enquanto apenas fechar o modo de edição
    setIsEditingBasicInfo(false);
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
      <SheetContent className="sm:max-w-[500px] overflow-y-auto bg-black/20 backdrop-blur-xl border-lime-400/30 shadow-2xl shadow-lime-400/10">
        <SheetHeader className="space-y-4 pb-6 border-b border-white/30">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-xl font-semibold text-white">{client.name}</SheetTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onEdit(client)}
              className="flex items-center gap-2 bg-lime-400/20 border-lime-400/40 text-lime-400 hover:bg-lime-400/30 hover:text-lime-300"
            >
              <Edit className="h-4 w-4" />
              Editar Completo
            </Button>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
          </div>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Basic Information with Glassmorphism */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-white border-b border-lime-400/30 pb-2 flex items-center gap-2">
                <div className="w-2 h-2 bg-lime-400 rounded-full shadow-lg shadow-lime-400/50"></div>
                Informações Básicas
              </h3>
              {!isEditingBasicInfo && (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsEditingBasicInfo(true)}
                  className="text-lime-400 hover:text-lime-300 hover:bg-lime-400/20 rounded-lg"
                >
                  <Edit className="h-4 w-4" />
                </Button>
              )}
            </div>
            
            <div className="grid gap-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-lime-400" />
                <div>
                  <Label className="text-sm font-medium text-white/80">Telefone</Label>
                  <p className="text-sm text-white">{formatPhoneDisplay(client.phone)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-lime-400" />
                <div className="flex-1">
                  <Label className="text-sm font-medium text-white/80">Email</Label>
                  {isEditingBasicInfo ? (
                    <Input
                      type="email"
                      value={editedClient.email}
                      onChange={(e) => setEditedClient({...editedClient, email: e.target.value})}
                      className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-lime-400 focus:ring-lime-400/20 text-white placeholder:text-white/60"
                      placeholder="email@exemplo.com"
                    />
                  ) : (
                    <p className="text-sm text-white">{client.email || 'Não informado'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building className="h-4 w-4 text-lime-400" />
                <div className="flex-1">
                  <Label className="text-sm font-medium text-white/80">Empresa</Label>
                  {isEditingBasicInfo ? (
                    <Input
                      value={editedClient.company}
                      onChange={(e) => setEditedClient({...editedClient, company: e.target.value})}
                      className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-lime-400 focus:ring-lime-400/20 text-white placeholder:text-white/60"
                      placeholder="Nome da empresa"
                    />
                  ) : (
                    <p className="text-sm text-white">{client.company || 'Não informado'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4 text-lime-400" />
                <div className="flex-1">
                  <Label className="text-sm font-medium text-white/80">Endereço</Label>
                  {isEditingBasicInfo ? (
                    <Input
                      value={editedClient.address}
                      onChange={(e) => setEditedClient({...editedClient, address: e.target.value})}
                      className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-lime-400 focus:ring-lime-400/20 text-white placeholder:text-white/60"
                      placeholder="Endereço completo"
                    />
                  ) : (
                    <p className="text-sm text-white">{client.address || 'Não informado'}</p>
                  )}
                </div>
              </div>

              {isEditingBasicInfo && (
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleSaveBasicInfo}
                    className="bg-lime-400/80 hover:bg-lime-500/80 text-black border border-lime-400 shadow-lg font-semibold"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditingBasicInfo(false);
                      setEditedClient({
                        name: client.name,
                        email: client.email || "",
                        address: client.address || "",
                        company: client.company || ""
                      });
                    }}
                    className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Purchase Value with Glassmorphism */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
            <h3 className="font-semibold text-white border-b border-lime-400/30 pb-2 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-lime-400 rounded-full shadow-lg shadow-lime-400/50"></div>
              Valor de Compra
            </h3>
            <div className="flex items-center gap-3">
              <DollarSign className="h-4 w-4 text-lime-400" />
              <div className="flex-1">
                {isEditingValue ? (
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="0.00"
                      value={purchaseValue}
                      onChange={(e) => setPurchaseValue(e.target.value)}
                      className="bg-white/20 backdrop-blur-sm border-white/40 focus:border-lime-400 focus:ring-lime-400/20 text-white placeholder:text-white/60"
                    />
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={handleSaveValue}
                        className="bg-lime-400/80 hover:bg-lime-500/80 text-black border border-lime-400 shadow-lg font-semibold"
                      >
                        <Save className="h-3 w-3 mr-1" />
                        Salvar
                      </Button>
                      <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={() => {
                          setIsEditingValue(false);
                          setPurchaseValue(client.purchase_value?.toString() || "");
                        }}
                        className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                      >
                        <X className="h-3 w-3 mr-1" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <div>
                      <Label className="text-sm font-medium text-white/80">Valor</Label>
                      <p className="text-sm font-medium text-white">{formatCurrency(client.purchase_value)}</p>
                    </div>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setIsEditingValue(true)}
                      className="text-lime-400 hover:text-lime-300 hover:bg-lime-400/20"
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Notes with Glassmorphism */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
            <h3 className="font-semibold text-white border-b border-lime-400/30 pb-2 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-lime-400 rounded-full shadow-lg shadow-lime-400/50"></div>
              Observações
            </h3>
            {isEditingNotes ? (
              <div className="space-y-2">
                <Textarea
                  placeholder="Adicione observações sobre o cliente..."
                  value={notesValue}
                  onChange={(e) => setNotesValue(e.target.value)}
                  className="min-h-[100px] bg-white/20 backdrop-blur-sm border-white/40 focus:border-lime-400 focus:ring-lime-400/20 text-white placeholder:text-white/60"
                />
                <div className="flex gap-2">
                  <Button 
                    size="sm" 
                    onClick={handleSaveNotes}
                    className="bg-lime-400/80 hover:bg-lime-500/80 text-black border border-lime-400 shadow-lg font-semibold"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    Salvar
                  </Button>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => {
                      setIsEditingNotes(false);
                      setNotesValue(client.notes || "");
                    }}
                    className="bg-white/20 backdrop-blur-sm border-white/40 text-white hover:bg-white/30"
                  >
                    <X className="h-3 w-3 mr-1" />
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  {client.notes ? (
                    <p className="text-sm text-white whitespace-pre-wrap">{client.notes}</p>
                  ) : (
                    <p className="text-sm text-white/60 italic">Nenhuma observação adicionada</p>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => setIsEditingNotes(true)}
                  className="text-lime-400 hover:text-lime-300 hover:bg-lime-400/20"
                >
                  <Edit className="h-3 w-3" />
                </Button>
              </div>
            )}
          </div>

          {/* Creation Date with Glassmorphism */}
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
            <h3 className="font-semibold text-white border-b border-lime-400/30 pb-2 mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-lime-400 rounded-full shadow-lg shadow-lime-400/50"></div>
              Informações do Sistema
            </h3>
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-lime-400" />
              <div>
                <Label className="text-sm font-medium text-white/80">Data de Criação</Label>
                <p className="text-sm text-white">{new Date(client.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
