
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { ModernCampaignCreator } from "./ModernCampaignCreator";
import { useState } from "react";

interface CampaignCreateModalProps {
  onSuccess?: () => void;
}

export function CampaignCreateModal({ onSuccess }: CampaignCreateModalProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    setIsOpen(false);
    onSuccess?.();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-lime-500 to-green-500 hover:from-lime-600 hover:to-green-600 text-white">
          <Plus className="w-4 h-4 mr-2" />
          Nova Campanha
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Criar Nova Campanha</DialogTitle>
        </DialogHeader>
        <ModernCampaignCreator onSuccess={handleSuccess} />
      </DialogContent>
    </Dialog>
  );
}
