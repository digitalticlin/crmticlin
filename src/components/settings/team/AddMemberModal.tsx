
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, EyeOff, RefreshCw, UserPlus } from "lucide-react";
import { MultiSelectWhatsApp } from "./MultiSelectWhatsApp";
import { MultiSelectFunnels } from "./MultiSelectFunnels";

interface AddMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    full_name: string;
    email: string;
    password: string;
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
    password: "",
    role: "operational" as "operational" | "manager",
    assignedWhatsAppIds: [] as string[],
    assignedFunnelIds: [] as string[]
  });

  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim() || !formData.email.trim() || !formData.password.trim()) {
      return;
    }

    const success = await onSubmit({
      ...formData,
      whatsapp_personal: formData.whatsapp_personal || undefined
    });

    if (success) {
      setFormData({
        full_name: "",
        email: "",
        whatsapp_personal: "",
        password: "",
        role: "operational",
        assignedWhatsAppIds: [],
        assignedFunnelIds: []
      });
      onOpenChange(false);
    }
  };

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/35 backdrop-blur-xl border border-white/30 shadow-2xl rounded-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl text-gray-800">
            <div className="p-2 bg-gradient-to-r from-blue-500/20 to-blue-400/10 rounded-lg">
              <UserPlus className="h-5 w-5 text-blue-500" />
            </div>
            Adicionar Membro da Equipe
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações Pessoais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
              Informações Pessoais
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name" className="text-gray-700">Nome Completo *</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => handleChange("full_name", e.target.value)}
                  placeholder="Nome completo do membro"
                  required
                  className="bg-white/70 backdrop-blur-sm border-white/30 text-gray-900"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-700">Email *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="email@exemplo.com"
                  required
                  className="bg-white/70 backdrop-blur-sm border-white/30 text-gray-900"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="whatsapp_personal" className="text-gray-700">WhatsApp Pessoal</Label>
              <Input
                id="whatsapp_personal"
                value={formData.whatsapp_personal}
                onChange={(e) => handleChange("whatsapp_personal", e.target.value)}
                placeholder="(00) 00000-0000"
                className="bg-white/70 backdrop-blur-sm border-white/30 text-gray-900"
              />
            </div>
          </div>

          {/* Credenciais */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
              Credenciais de Acesso
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Senha *</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => handleChange("password", e.target.value)}
                    placeholder="Senha do usuário"
                    required
                    className="bg-white/70 backdrop-blur-sm border-white/30 text-gray-900"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={generatePassword}
                  className="px-3 bg-white/70 backdrop-blur-sm border-white/30 text-gray-700 hover:bg-white/90"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Permissões */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 border-b border-gray-200 pb-2">
              Permissões e Acessos
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="role" className="text-gray-700">Nível de Acesso</Label>
              <Select value={formData.role} onValueChange={(value: "operational" | "manager") => handleChange("role", value)}>
                <SelectTrigger className="bg-white/70 backdrop-blur-sm border-white/30 text-gray-900">
                  <SelectValue placeholder="Selecione o nível" />
                </SelectTrigger>
                <SelectContent className="bg-white/90 backdrop-blur-sm border-white/30">
                  <SelectItem value="manager">GESTOR</SelectItem>
                  <SelectItem value="operational">OPERACIONAL</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-gray-700">Funis de Acesso</Label>
                <MultiSelectFunnels
                  selectedIds={formData.assignedFunnelIds}
                  onSelectionChange={(ids) => handleChange("assignedFunnelIds", ids)}
                  allFunnels={allFunnels}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-gray-700">Instâncias WhatsApp</Label>
                <MultiSelectWhatsApp
                  selectedIds={formData.assignedWhatsAppIds}
                  onSelectionChange={(ids) => handleChange("assignedWhatsAppIds", ids)}
                  allWhatsApps={allWhatsApps}
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
              className="bg-white/70 backdrop-blur-sm border-white/30 text-gray-700 hover:bg-white/90"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || !formData.full_name.trim() || !formData.email.trim() || !formData.password.trim()}
              className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white"
            >
              {loading ? "Criando..." : "Criar Membro"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
