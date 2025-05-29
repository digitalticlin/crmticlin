
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";
import { InviteMemberForm } from "./team/InviteMemberForm";

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
  const handleFormSubmit = async (data: {
    full_name: string;
    email: string;
    role: string;
    assignedWhatsAppIds: string[];
    assignedFunnelIds: string[];
  }) => {
    const success = await onInvite(data);
    if (success) {
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="glass-morphism max-w-md w-full border border-white/20 shadow-2xl p-0 bg-white/10 backdrop-blur-xl !rounded-2xl"
        style={{ boxShadow: "0 8px 32px 0 rgba(31,38,135,0.3)", border: "1.5px solid rgba(255,255,255,0.12)" }}
      >
        <div className="p-6 space-y-4">
          <DialogHeader>
            <DialogTitle className="flex gap-2 items-center text-white text-lg font-semibold">
              <UserPlus className="h-5 w-5" /> Convidar Novo Membro
            </DialogTitle>
            <DialogDescription className="text-sm text-white/70">
              Preencha os dados do novo colaborador
            </DialogDescription>
          </DialogHeader>
          
          <InviteMemberForm
            onSubmit={handleFormSubmit}
            loading={loading}
            allWhatsApps={allWhatsApps}
            allFunnels={allFunnels}
          />
          
          <div className="flex justify-start">
            <DialogClose asChild>
              <Button type="button" variant="ghost" className="text-gray-300 hover:text-gray-50">
                Cancelar
              </Button>
            </DialogClose>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
