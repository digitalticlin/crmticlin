
import { ComprehensiveVPSDiagnostic } from "@/components/admin/ComprehensiveVPSDiagnostic";

export default function ComprehensiveVPSDiagnosticPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      <div className="container mx-auto py-6 px-4">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Diagnóstico Completíssimo VPS</h1>
          <p className="text-gray-600 mt-2">
            Teste abrangente de todas as Edge Functions que conectam com a VPS para análise detalhada
          </p>
        </div>
        
        <ComprehensiveVPSDiagnostic />
      </div>
    </div>
  );
}
