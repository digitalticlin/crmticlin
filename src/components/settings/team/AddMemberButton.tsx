
import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface AddMemberButtonProps {
  onClick: () => void;
}

export const AddMemberButton = ({ onClick }: AddMemberButtonProps) => {
  return (
    <div className="flex justify-center mt-6">
      <Button
        onClick={onClick}
        className="bg-gradient-to-r from-blue-500/20 to-blue-400/10 hover:from-blue-500/30 hover:to-blue-400/20 
          backdrop-blur-xl border border-white/30 shadow-glass-lg text-blue-700 hover:text-blue-800
          px-8 py-6 text-lg font-medium rounded-2xl transition-all duration-300 hover:scale-105 hover:-translate-y-1"
        variant="ghost"
      >
        <UserPlus className="h-5 w-5 mr-2" />
        Adicionar Membro
      </Button>
    </div>
  );
};
