
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Props {
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
export function TeamInviteForm({ onInvite, loading, allWhatsApps, allFunnels }: Props) {
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
  };

  return (
    <form className="space-y-3" onSubmit={handleSubmit}>
      <div>
        <Label>Nome completo</Label>
        <Input value={fullName} onChange={e => setFullName(e.target.value)} required />
      </div>
      <div>
        <Label>Email</Label>
        <Input value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div>
        <Label>Cargo/Função</Label>
        <select 
          value={role}
          onChange={e => setRole(e.target.value)}
          className="w-full border rounded p-2"
        >
          <option value="seller">Vendedor(a)</option>
          <option value="custom">Personalizado</option>
        </select>
      </div>
      <div>
        <Label>Instâncias WhatsApp permitidas</Label>
        <select
          multiple
          className="w-full border rounded p-2"
          value={assignedWhatsAppIds}
          onChange={e =>
            setAssignedWhatsAppIds(
              Array.from(e.target.selectedOptions, option => option.value)
            )
          }
        >
          {allWhatsApps.map(w => (
            <option value={w.id} key={w.id}>{w.instance_name}</option>
          ))}
        </select>
      </div>
      <div>
        <Label>Funis permitidos</Label>
        <select
          multiple
          className="w-full border rounded p-2"
          value={assignedFunnelIds}
          onChange={e =>
            setAssignedFunnelIds(
              Array.from(e.target.selectedOptions, option => option.value)
            )
          }
        >
          {allFunnels.map(f => (
            <option value={f.id} key={f.id}>{f.name}</option>
          ))}
        </select>
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Enviando convite..." : "Convidar membro"}
      </Button>
    </form>
  );
}
