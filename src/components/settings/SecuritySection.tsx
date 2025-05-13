
import { Button } from "@/components/ui/button";

interface SecuritySectionProps {
  email: string;
  onChangePassword: () => Promise<void>;
}

const SecuritySection = ({ email, onChangePassword }: SecuritySectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Segurança da Conta</h3>
      <div className="space-y-2">
        <Button 
          variant="outline" 
          onClick={onChangePassword}
        >
          Alterar senha
        </Button>
        <p className="text-sm text-muted-foreground">
          Um email será enviado com instruções para alterar sua senha
        </p>
      </div>
    </div>
  );
};

export default SecuritySection;
