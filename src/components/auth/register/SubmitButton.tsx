
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SubmitButtonProps {
  isLoading: boolean;
}

export const SubmitButton = ({ isLoading }: SubmitButtonProps) => {
  return (
    <Button 
      type="submit" 
      className="w-full"
      disabled={isLoading}
    >
      {isLoading ? "Processando..." : "Criar conta"}
      {!isLoading && <ArrowRight className="ml-2 h-4 w-4" />}
    </Button>
  );
};
