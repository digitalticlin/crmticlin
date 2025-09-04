
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UserPlus, Shield, Users, Crown, Loader2 } from "lucide-react";
import { MultiSelectWhatsApp } from "./MultiSelectWhatsApp";
import { MultiSelectFunnels } from "./MultiSelectFunnels";

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    full_name: string;
    email: string;
    role: "operational" | "manager";
    assignedWhatsAppIds: string[];
    assignedFunnelIds: string[];
    whatsapp_personal?: string;
  }) => Promise<boolean>;
  loading: boolean;
  allWhatsApps: any[];
  allFunnels: any[];
}

export const AddMemberModal = ({ 
  open, 
  onOpenChange, 
  onSubmit, 
  loading, 
  allWhatsApps, 
  allFunnels 
}: AddMemberModalProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    whatsapp_personal: "",
    role: "operational" as "operational" | "manager",
    assignedWhatsAppIds: [] as string[],
    assignedFunnelIds: [] as string[]
  });


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('[AddMemberModal] Form data before submit:', formData);
    
    if (!formData.full_name.trim() || !formData.email.trim()) {
      console.log('[AddMemberModal] Validação falhou - campos obrigatórios ausentes');
      return;
    }

    const submitData = {
      ...formData,
      whatsapp_personal: formData.whatsapp_personal || undefined
    };
    
    console.log('[AddMemberModal] Dados enviados para onSubmit:', submitData);
    
    const success = await onSubmit(submitData);
    
    console.log('[AddMemberModal] Resultado do onSubmit:', success);

    if (success) {
      console.log('[AddMemberModal] Membro criado com sucesso, limpando formulário');
      setFormData({
        full_name: "",
        email: "",
        whatsapp_personal: "",
        role: "operational",
        assignedWhatsAppIds: [],
        assignedFunnelIds: []
      });
      onOpenChange(false);
    } else {
      console.log('[AddMemberModal] Falha ao criar membro');
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const getRoleInfo = (role: string) => {
    switch (role) {
      case "manager":
        return {
          label: "GESTOR",
          icon: Crown,
          color: "text-yellow-600",
          description: "Acesso total ao sistema, exceto gestão de equipe"
        };
      case "operational":
        return {
          label: "OPERACIONAL", 
          icon: Users,
          color: "text-blue-600",
          description: "Acesso limitado aos funis e instâncias específicas"
        };
      default:
        return {
          label: "SELECIONE",
          icon: Shield,
          color: "text-gray-600",
          description: "Escolha o nível de acesso"
        };
    }
  };

  const roleInfo = getRoleInfo(formData.role);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl flex flex-col">
        <DialogHeader className="border-b border-white/30 pb-6 bg-white/20 backdrop-blur-sm rounded-t-2xl -mx-6 -mt-6 px-6 pt-6">
          <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-gray-900">
            <div className="p-3 bg-white/30 backdrop-blur-sm rounded-xl border border-white/40 shadow-glass">
              <UserPlus className="h-6 w-6 text-yellow-500" />
            </div>
            Adicionar Novo Membro
          </DialogTitle>
          <p className="text-gray-700 mt-2 text-base font-medium">
            Convide um novo membro para sua equipe
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <div className="overflow-y-auto flex-1 px-1 space-y-6">
            {/* Informações Básicas */}
            <div className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl p-6 transition-all duration-300 hover:bg-white/50">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-yellow-500" />
                Informações Básicas
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name" className="text-gray-800 font-medium">Nome Completo *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange("full_name", e.target.value)}
                    placeholder="Ex: João Silva"
                    className="bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-800 font-medium">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange("email", e.target.value)}
                    placeholder="joao@empresa.com"
                    className="bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-xl"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="whatsapp_personal" className="text-gray-800 font-medium">WhatsApp Pessoal</Label>
                  <Input
                    id="whatsapp_personal"
                    value={formData.whatsapp_personal}
                    onChange={(e) => handleChange("whatsapp_personal", e.target.value)}
                    placeholder="(11) 99999-9999"
                    className="bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-xl"
                  />
                </div>

              </div>
            </div>

            {/* Nível de Acesso */}
            <div className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl p-6 transition-all duration-300 hover:bg-white/50">
              <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-yellow-500" />
                Nível de Acesso
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="role" className="text-gray-800 font-medium">Função no Sistema</Label>
                  <Select value={formData.role} onValueChange={(value: "operational" | "manager") => handleChange("role", value)}>
                    <SelectTrigger className="bg-white/40 backdrop-blur-sm border border-white/30 focus:border-yellow-500 rounded-xl">
                      <SelectValue placeholder="Selecione o nível" />
                    </SelectTrigger>
                    <SelectContent className="bg-white/90 backdrop-blur-md border border-white/30 rounded-xl shadow-glass">
                      <SelectItem value="manager" className="focus:bg-white/60">
                        <div className="flex items-center gap-2">
                          <Crown className="h-4 w-4 text-yellow-600" />
                          <span className="font-medium">GESTOR</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="operational" className="focus:bg-white/60">
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-blue-600" />
                          <span className="font-medium">OPERACIONAL</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Descrição do Nível */}
                <div className="bg-white/20 backdrop-blur-sm border border-white/20 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <roleInfo.icon className={`h-5 w-5 ${roleInfo.color}`} />
                    <span className="font-bold text-gray-800">{roleInfo.label}</span>
                  </div>
                  <p className="text-sm text-gray-700">{roleInfo.description}</p>
                </div>
              </div>
            </div>

            {/* Permissões Específicas - Apenas para Operacional */}
            {formData.role === "operational" && (
              <div className="bg-white/40 backdrop-blur-lg border border-white/30 shadow-glass rounded-xl p-6 transition-all duration-300 hover:bg-white/50">
                <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-yellow-500" />
                  Acessos Específicos
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-gray-800 font-medium">Funis de Acesso</Label>
                    <MultiSelectFunnels
                      selectedIds={formData.assignedFunnelIds}
                      onSelectionChange={(ids) => handleChange("assignedFunnelIds", ids)}
                      allFunnels={allFunnels}
                    />
                    <p className="text-xs text-gray-600">Funis que o membro pode visualizar e gerenciar</p>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-gray-800 font-medium">Instâncias WhatsApp</Label>
                    <MultiSelectWhatsApp
                      selectedIds={formData.assignedWhatsAppIds}
                      onSelectionChange={(ids) => handleChange("assignedWhatsAppIds", ids)}
                      allWhatsApps={allWhatsApps}
                    />
                    <p className="text-xs text-gray-600">Instâncias que o membro pode utilizar</p>
                  </div>
                </div>
              </div>
            )}

            {/* Nota para Gestores */}
            {formData.role === "manager" && (
              <div className="bg-yellow-50/60 backdrop-blur-sm border border-yellow-200/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="h-5 w-5 text-yellow-600" />
                  <span className="font-bold text-yellow-800">Acesso de Gestor</span>
                </div>
                <p className="text-sm text-yellow-700">
                  Gestores têm acesso total a todos os funis e instâncias WhatsApp automaticamente.
                  Não é necessário configurar acessos específicos.
                </p>
              </div>
            )}
          </div>
          
          <DialogFooter className="border-t border-white/30 pt-6 bg-white/20 backdrop-blur-sm rounded-b-2xl -mx-6 -mb-6 px-6 pb-6 mt-6 flex-shrink-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !formData.full_name.trim() || !formData.email.trim()}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold rounded-xl shadow-glass hover:shadow-glass-lg transition-all duration-200"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Criando...
                </>
              ) : (
                <>
                  <UserPlus className="h-4 w-4 mr-2" />
                  Adicionar Membro
                </>
              )}
            </Button>
          </DialogFooter>
        </form>

      </DialogContent>
    </Dialog>
  );
};
