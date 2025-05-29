
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface TeamHeaderProps {
  onAddMember: () => void;
}

export const TeamHeader = ({ onAddMember }: TeamHeaderProps) => {
  return (
    <div className="flex justify-end mb-4">
      <Button
        className="bg-gradient-to-tr from-[#9b87f5] to-[#6E59A5] text-white font-bold shadow-lg"
        onClick={onAddMember}
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar
      </Button>
    </div>
  );
};
