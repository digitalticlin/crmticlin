
import { VPSDiagnosticRunner } from "@/components/admin/VPSDiagnosticRunner";

export default function VPSDiagnosticTest() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Diagnóstico Automático VPS</h1>
          <p className="text-gray-600 mt-2">
            Teste automático completo de todas as Edge Functions que conectam com a VPS
          </p>
        </div>
        
        <VPSDiagnosticRunner />
      </div>
    </div>
  );
}
