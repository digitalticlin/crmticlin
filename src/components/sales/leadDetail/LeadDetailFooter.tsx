
import { Button } from "@/components/ui/button";
import { SheetFooter } from "@/components/ui/sheet";
import { Save } from "lucide-react";

interface LeadDetailFooterProps {
  onClose: () => void;
}

export const LeadDetailFooter = ({ onClose }: LeadDetailFooterProps) => {
  return (
    <SheetFooter className="mt-6">
      <Button variant="outline" onClick={onClose}>
        Fechar
      </Button>
      <Button className="bg-ticlin hover:bg-ticlin/90 text-black">
        <Save className="h-4 w-4 mr-2" />
        Salvar Contato
      </Button>
    </SheetFooter>
  );
};
