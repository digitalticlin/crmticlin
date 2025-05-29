
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue
} from "@/components/ui/select";
import { MultiSelectWhatsApp } from "./MultiSelectWhatsApp";
import { MultiSelectFunnels } from "./MultiSelectFunnels";

interface InviteMemberFormProps {
  onSubmit: (data: {
    full_name: string;
    email: string;
    role: string;
    assignedWhatsAppIds: string[];
    assignedFunnelIds: string[];
  }) => Promise<void>;
  loading: boolean;
  allWhatsApps: { id: string; instance_name: string }[];
  allFunnels: { id: string; name: string }[];
}

export function InviteMemberForm({
  onSubmit,
  loading,
  allWhatsApps,
  allFunnels,
}: InviteMemberFormProps) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("seller");
  const [assignedWhatsAppIds, setAssignedWhatsAppIds] = useState<string[]>([]);
  const [assignedFunnelIds, setAssignedFunnelIds] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email) return;
    
    await onSubmit({
      full_name: fullName,
      email,
      role,
      assignedWhatsAppIds,
      assignedFunnelIds,
    });
    
    // Reset form
    setFullName("");
    setEmail("");
    setRole("seller");
    setAssignedWhatsAppIds([]);
    setAssignedFunnelIds([]);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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

      <MultiSelectWhatsApp
        selectedIds={assignedWhatsAppIds}
        onSelectionChange={setAssignedWhatsAppIds}
        allWhatsApps={allWhatsApps}
      />

      <MultiSelectFunnels
        selectedIds={assignedFunnelIds}
        onSelectionChange={setAssignedFunnelIds}
        allFunnels={allFunnels}
      />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading} className="bg-gradient-to-tr from-[#9b87f5] to-[#6E59A5] text-white shadow-md">
          {loading ? "Enviando..." : "Convidar"}
        </Button>
      </div>
    </form>
  );
}
