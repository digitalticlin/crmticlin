
import { Building2, CheckCircle, AlertCircle } from "lucide-react";

interface CompanyInfoSectionProps {
  companyName: string;
  companyDocument: string;
  companyData: any;
  setCompanyName: (value: string) => void;
  setCompanyDocument: (value: string) => void;
}

const CompanyInfoSection = ({
  companyName,
  companyDocument,
  companyData,
  setCompanyName,
  setCompanyDocument
}: CompanyInfoSectionProps) => {
  const hasCompany = !!companyData;

  return (
    <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "300ms" }}>
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 bg-gradient-to-r from-purple-500/20 to-purple-400/10 rounded-2xl">
          <Building2 className="h-6 w-6 text-purple-400" />
        </div>
        <div className="flex-1">
          <h3 className="text-xl font-semibold text-gray-800">Informações da Empresa</h3>
          <div className="flex items-center space-x-2 mt-1">
            {hasCompany ? (
              <>
                <CheckCircle className="h-4 w-4 text-green-500" />
                <p className="text-sm text-green-600 font-medium">
                  Empresa configurada: {companyData.name}
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="h-4 w-4 text-orange-500" />
                <p className="text-sm text-orange-600 font-medium">
                  Preencha os dados para criar sua empresa
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {!hasCompany && (
        <div className="bg-blue-50/50 border border-blue-200 rounded-2xl p-4 mb-6">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-blue-800">Como funciona?</h4>
              <p className="text-sm text-blue-700 mt-1">
                Ao preencher o <strong>Nome da Empresa</strong> e salvar, uma empresa será automaticamente criada 
                e vinculada ao seu perfil. Todos os dados do sistema (WhatsApp, funis, leads) estarão ligados à sua empresa.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <span className="mr-2">🏢</span>
            Nome da Empresa {!hasCompany && <span className="text-red-500 ml-1">*</span>}
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder={hasCompany ? "Nome da empresa" : "Digite o nome da sua empresa"}
          />
          {!hasCompany && (
            <p className="text-xs text-gray-600">
              ⚠️ Será criada automaticamente ao salvar
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <span className="mr-2">📄</span>
            CNPJ/CPF da Empresa (opcional)
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
            value={companyDocument}
            onChange={(e) => setCompanyDocument(e.target.value)}
            placeholder="00.000.000/0000-00"
          />
        </div>
      </div>

      {hasCompany && (
        <div className="mt-4 p-4 bg-green-50/50 border border-green-200 rounded-2xl">
          <div className="flex items-center space-x-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Empresa ativa no sistema
              </p>
              <p className="text-xs text-green-700 mt-1">
                ID da empresa: {companyData.id}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CompanyInfoSection;
