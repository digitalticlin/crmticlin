
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

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
      
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Autenticação de dois fatores</Label>
          <p className="text-sm text-muted-foreground">
            Adicione uma camada extra de segurança à sua conta
          </p>
        </div>
        <Switch />
      </div>
    </div>
  );
};

export default SecuritySection;
