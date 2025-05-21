
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X, UserPlus } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: (args: {
    full_name: string;
    email: string;
    role: string;
    assignedWhatsAppIds: string[];
    assignedFunnelIds: string[];
  }) => Promise<boolean>;
  loading: boolean;
  allWhatsApps: { id: string; instance_name: string }[];
  allFunnels: { id: string; name: string }[];
}

export function InviteMemberModal({
  open,
  onOpenChange,
  onInvite,
  loading,
  allWhatsApps,
  allFunnels,
}: Props) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("seller");
  const [assignedWhatsAppIds, setAssignedWhatsAppIds] = useState<string[]>([]);
  const [assignedFunnelIds, setAssignedFunnelIds] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    await onInvite({
      full_name: fullName,
      email,
      role,
      assignedWhatsAppIds,
      assignedFunnelIds,
    });
    setFullName("");
    setEmail("");
    setRole("seller");
    setAssignedWhatsAppIds([]);
    setAssignedFunnelIds([]);
    onOpenChange(false);
  };

  // Helper handlers for multi-select style chips
  const handleSelectWhatsApp = (id: string) => {
    if (!assignedWhatsAppIds.includes(id)) setAssignedWhatsAppIds([...assignedWhatsAppIds, id]);
  };
  const handleRemoveWhatsApp = (id: string) => {
    setAssignedWhatsAppIds(assignedWhatsAppIds.filter((w) => w !== id));
  };
  const handleSelectFunnel = (id: string) => {
    if (!assignedFunnelIds.includes(id)) setAssignedFunnelIds([...assignedFunnelIds, id]);
  };
  const handleRemoveFunnel = (id: string) => {
    setAssignedFunnelIds(assignedFunnelIds.filter((f) => f !== id));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="glass-morphism max-w-md w-full border border-white/20 shadow-2xl p-0 bg-white/10 backdrop-blur-xl !rounded-2xl"
        style={{ boxShadow: "0 8px 32px 0 rgba(31,38,135,0.3)", border: "1.5px solid rgba(255,255,255,0.12)" }}
      >
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="flex gap-2 items-center text-white text-lg font-semibold">
              <UserPlus className="h-5 w-5" /> Convidar Novo Membro
            </DialogTitle>
            <DialogDescription className="text-sm text-white/70">Preencha os dados do novo colaborador</DialogDescription>
          </DialogHeader>
          <div>
            <Label className="block mb-1 text-white">Nome completo</Label>
            <Input
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              required
              className="bg-white/40 text-black placeholder:text-gray-400 border border-white/20"
            />
          </div>
          <div>
            <Label className="block mb-1 text-white">Email</Label>
            <Input
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              className="bg-white/40 text-black placeholder:text-gray-400 border border-white/20"
              type="email"
            />
          </div>
          <div>
            <Label className="block mb-1 text-white">Cargo/Função</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white">
                <SelectValue placeholder="Escolha o cargo" />
              </SelectTrigger>
              <SelectContent className="glass-morphism bg-white/20 border-white/20 text-black">
                <SelectItem value="seller" className="text-black">Vendedor(a)</SelectItem>
                <SelectItem value="custom" className="text-black">Personalizado</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block mb-1 text-white">Instâncias WhatsApp permitidas</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {assignedWhatsAppIds.map(id => {
                const option = allWhatsApps.find(w => w.id === id);
                if (!option) return null;
                return (
                  <Badge
                    key={id}
                    className="bg-white/40 border border-white/40 text-black flex items-center px-2 py-1 gap-1"
                  >
                    {option.instance_name}
                    <X
                      onClick={() => handleRemoveWhatsApp(id)}
                      className="cursor-pointer ml-1 h-4 w-4"
                    />
                  </Badge>
                );
              })}
            </div>
            <Select onValueChange={handleSelectWhatsApp}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white w-full">
                <SelectValue placeholder="Selecionar instância" />
              </SelectTrigger>
              <SelectContent className="glass-morphism bg-white/40 border-white/20 text-black z-50">
                {allWhatsApps
                  .filter(w => !assignedWhatsAppIds.includes(w.id))
                  .map(w => (
                    <SelectItem
                      key={w.id}
                      value={w.id}
                      className="text-black"
                    >
                      {w.instance_name}
                    </SelectItem>
                  ))}
                {allWhatsApps.length === 0 && (
                  <SelectItem value="none" disabled className="text-black">Nenhuma disponível</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="block mb-1 text-white">Funis permitidos</Label>
            <div className="flex flex-wrap gap-2 mb-2">
              {assignedFunnelIds.map(id => {
                const option = allFunnels.find(f => f.id === id);
                if (!option) return null;
                return (
                  <Badge
                    key={id}
                    className="bg-white/40 border border-white/40 text-black flex items-center px-2 py-1 gap-1"
                  >
                    {option.name}
                    <X
                      onClick={() => handleRemoveFunnel(id)}
                      className="cursor-pointer ml-1 h-4 w-4"
                    />
                  </Badge>
                );
              })}
            </div>
            <Select onValueChange={handleSelectFunnel}>
              <SelectTrigger className="bg-white/20 border-white/30 text-white w-full">
                <SelectValue placeholder="Selecionar funil" />
              </SelectTrigger>
              <SelectContent className="glass-morphism bg-white/40 border-white/20 text-black z-50">
                {allFunnels
                  .filter(f => !assignedFunnelIds.includes(f.id))
                  .map(f => (
                    <SelectItem
                      key={f.id}
                      value={f.id}
                      className="text-black"
                    >
                      {f.name}
                    </SelectItem>
                  ))}
                {allFunnels.length === 0 && (
                  <SelectItem value="none" disabled className="text-black">Nenhum disponível</SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="text-gray-300 hover:text-gray-50">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={loading} className="bg-gradient-to-tr from-[#9b87f5] to-[#6E59A5] text-white shadow-md">
              {loading ? "Enviando..." : "Convidar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
