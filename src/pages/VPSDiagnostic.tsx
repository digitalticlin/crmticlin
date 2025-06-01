
import { VPSDiagnosticTest } from "@/components/admin/VPSDiagnosticTest";

const VPSDiagnostic = () => {
  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Diagnóstico VPS</h1>
        <p className="text-muted-foreground">
          Ferramenta de diagnóstico completo da VPS WhatsApp Web.js
        </p>
      </div>
      
      <VPSDiagnosticTest />
    </div>
  );
};

export default VPSDiagnostic;
