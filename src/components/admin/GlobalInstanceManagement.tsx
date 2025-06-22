
import { GlobalInstanceSync } from "./GlobalInstanceSync";
import { VPSSSHCommands } from "./ssh/VPSSSHCommands";

export const GlobalInstanceManagement = () => {
  return (
    <div className="space-y-6">
      {/* Sincronização Principal */}
      <GlobalInstanceSync />
      
      {/* Comandos SSH para Verificação Manual */}
      <VPSSSHCommands />
    </div>
  );
};
