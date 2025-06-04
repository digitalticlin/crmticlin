
import { Button } from "@/components/ui/button";
import { Shield, Key } from "lucide-react";

interface SecuritySectionProps {
  email: string;
  onChangePassword: () => Promise<void>;
}

const SecuritySection = ({ email, onChangePassword }: SecuritySectionProps) => {
  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <button
          onClick={onChangePassword}
          className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-red-500/20 to-red-400/10 hover:from-red-500/30 hover:to-red-400/20 border border-red-400/30 text-red-400 rounded-xl transition-all duration-200 hover:scale-105 flex items-center justify-center space-x-3"
        >
          <Key className="h-4 w-4" />
          <span className="font-medium">Alterar Senha</span>
        </button>
        
        <p className="text-sm text-gray-700 flex items-start space-x-2">
          <Shield className="h-4 w-4 text-gray-600 mt-0.5 flex-shrink-0" />
          <span>Um email será enviado com instruções para alterar sua senha de forma segura</span>
        </p>
      </div>
    </div>
  );
};

export default SecuritySection;
