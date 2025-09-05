import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Shield, Phone, Mail, User } from "lucide-react";
import { MultiSelectWhatsApp } from "./MultiSelectWhatsApp";
import { MultiSelectFunnels } from "./MultiSelectFunnels";
import { TeamMember } from "@/hooks/useTeamManagement";

interface EditMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: TeamMember | null;
  onSubmit: (memberId: string, data: {
    full_name: string;
    email?: string;
    role: "operational";
    assignedWhatsAppIds: string[];
    assignedFunnelIds: string[];
    whatsapp_personal?: string;
  }) => Promise<boolean>;
  loading: boolean;
  allWhatsApps: any[];
  allFunnels: any[];
}

export const EditMemberModal = ({ 
  open, 
  onOpenChange, 
  member,
  onSubmit, 
  loading, 
  allWhatsApps, 
  allFunnels 
}: EditMemberModalProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    whatsapp_personal: "",
    role: "operational" as "operational",
    assignedWhatsAppIds: [] as string[],
    assignedFunnelIds: [] as string[]
  });

  // Preencher formulário quando membro for selecionado
  useEffect(() => {
    if (member) {
      setFormData({
        full_name: member.full_name || "",
        email: member.email || "",
        whatsapp_personal: member.whatsapp || "",
        role: "operational" as "operational",
        assignedWhatsAppIds: member.whatsapp_access || [],
        assignedFunnelIds: member.funnel_access || []
      });
    }
  }, [member]);

  const handleSubmit = async () => {
    if (!member) return;

    const success = await onSubmit(member.id, {
      full_name: formData.full_name,
      email: formData.email || undefined,
      role: formData.role,
      assignedWhatsAppIds: formData.assignedWhatsAppIds,
      assignedFunnelIds: formData.assignedFunnelIds,
      whatsapp_personal: formData.whatsapp_personal || undefined,
    });

    if (success) {
      onOpenChange(false);
    }
  };

  if (!member) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-white/20 backdrop-blur-md border border-white/30 shadow-glass rounded-2xl max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <DialogTitle className="text-2xl font-bold text-gray-900 flex items-center gap-3">
            <div className="bg-blue-500/20 backdrop-blur-sm border border-blue-300/30 p-2 rounded-xl">
              <Edit className="h-6 w-6 text-blue-700" />
            </div>
            Editar Membro da Equipe
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Informações Pessoais */}
          <div className="bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl p-4 space-y-4">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <User className="h-4 w-4" />
              Informações Pessoais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-gray-700 font-medium">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Nome do membro"
                  required
                  className="bg-white/60 backdrop-blur-sm border border-white/40"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700 font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="email@exemplo.com"
                    className="bg-white/60 backdrop-blur-sm border border-white/40 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="whatsapp_personal" className="text-gray-700 font-medium">WhatsApp Pessoal</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4" />
                  <Input
                    id="whatsapp_personal"
                    value={formData.whatsapp_personal}
                    onChange={(e) => setFormData({ ...formData, whatsapp_personal: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="bg-white/60 backdrop-blur-sm border border-white/40 pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="role" className="text-gray-700 font-medium">Função</Label>
                <div className="bg-blue-50/60 backdrop-blur-sm border border-blue-200/60 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <User className="h-5 w-5 text-blue-600" />
                    <span className="font-bold text-blue-800">OPERACIONAL</span>
                    <span className="ml-auto text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded-full">Fixo</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    Acesso limitado aos funis e instâncias WhatsApp específicas atribuídas pelo administrador.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Acessos Específicos */}
          {
            <div className="bg-white/40 backdrop-blur-sm border border-white/30 rounded-xl p-4 space-y-4">
              <h3 className="font-bold text-gray-900 flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Controle de Acessos
              </h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Acesso aos Funis</Label>
                  <MultiSelectFunnels
                    allFunnels={allFunnels}
                    selectedIds={formData.assignedFunnelIds}
                    onSelectionChange={(funnelIds) => setFormData({ ...formData, assignedFunnelIds: funnelIds })}
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-gray-700 font-medium">Acesso às Instâncias WhatsApp</Label>
                  <MultiSelectWhatsApp
                    allWhatsApps={allWhatsApps}
                    selectedIds={formData.assignedWhatsAppIds}
                    onSelectionChange={(whatsAppIds) => setFormData({ ...formData, assignedWhatsAppIds: whatsAppIds })}
                  />
                </div>
              </div>
            </div>
          }

        </div>

        <DialogFooter className="pt-6 gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="bg-white/40 backdrop-blur-sm border border-white/30 hover:bg-white/60 rounded-xl"
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={loading || !formData.full_name}
            className="bg-blue-500 hover:bg-blue-600 text-white rounded-xl shadow-glass min-w-[120px]"
          >
            {loading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Salvando...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                Salvar Alterações
              </div>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};