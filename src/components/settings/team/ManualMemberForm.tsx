
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, UserPlus } from "lucide-react";

interface ManualMemberFormProps {
  onSubmit: (data: {
    full_name: string;
    email: string;
    password: string;
    role: "operational" | "manager";
    assignedWhatsAppIds: string[];
    assignedFunnelIds: string[];
  }) => Promise<boolean>;
  loading: boolean;
  allWhatsApps: { id: string; instance_name: string }[];
  allFunnels: { id: string; name: string }[];
}

export const ManualMemberForm = ({
  onSubmit,
  loading,
  allWhatsApps,
  allFunnels,
}: ManualMemberFormProps) => {
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    password: "",
    role: "operational" as "operational" | "manager",
  });
  const [assignedWhatsApps, setAssignedWhatsApps] = useState<string[]>([]);
  const [assignedFunnels, setAssignedFunnels] = useState<string[]>([]);
  const [showPassword, setShowPassword] = useState(false);

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, password }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name || !formData.email || !formData.password) {
      return;
    }

    const success = await onSubmit({
      ...formData,
      assignedWhatsAppIds: assignedWhatsApps,
      assignedFunnelIds: assignedFunnels,
    });

    if (success) {
      setFormData({ full_name: "", email: "", password: "", role: "operational" });
      setAssignedWhatsApps([]);
      setAssignedFunnels([]);
    }
  };

  const handleWhatsAppChange = (whatsappId: string, checked: boolean) => {
    setAssignedWhatsApps(prev => 
      checked 
        ? [...prev, whatsappId]
        : prev.filter(id => id !== whatsappId)
    );
  };

  const handleFunnelChange = (funnelId: string, checked: boolean) => {
    setAssignedFunnels(prev => 
      checked 
        ? [...prev, funnelId]
        : prev.filter(id => id !== funnelId)
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Adicionar Membro da Equipe
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Dados básicos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="full_name">Nome Completo</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                placeholder="Digite o nome completo"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="usuario@exemplo.com"
                required
              />
            </div>
          </div>

          {/* Senha e Role */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="Digite a senha"
                    required
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
                <Button type="button" variant="outline" onClick={generatePassword}>
                  Gerar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Função</Label>
              <Select value={formData.role} onValueChange={(value: "operational" | "manager") => setFormData(prev => ({ ...prev, role: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a função" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="operational">OPERACIONAL</SelectItem>
                  <SelectItem value="manager">GESTOR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Permissões - só para operacional */}
          {formData.role === "operational" && (
            <div className="space-y-4">
              <div className="space-y-3">
                <Label>WhatsApp - Telefones Permitidos</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {allWhatsApps.map((whatsapp) => (
                    <div key={whatsapp.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`whatsapp-${whatsapp.id}`}
                        checked={assignedWhatsApps.includes(whatsapp.id)}
                        onCheckedChange={(checked) => handleWhatsAppChange(whatsapp.id, checked as boolean)}
                      />
                      <Label htmlFor={`whatsapp-${whatsapp.id}`} className="text-sm">
                        {whatsapp.instance_name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-3">
                <Label>Funis - Funis Permitidos</Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {allFunnels.map((funnel) => (
                    <div key={funnel.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`funnel-${funnel.id}`}
                        checked={assignedFunnels.includes(funnel.id)}
                        onCheckedChange={(checked) => handleFunnelChange(funnel.id, checked as boolean)}
                      />
                      <Label htmlFor={`funnel-${funnel.id}`} className="text-sm">
                        {funnel.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Criando..." : "Criar Membro"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
