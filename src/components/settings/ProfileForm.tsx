
import { Mail, User, FileText, Phone, Building } from "lucide-react";

interface ProfileFormProps {
  email: string;
  username: string;
  fullName: string;
  companyName: string;
  documentId: string;
  whatsapp: string;
  companyDocument: string;
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFullName: (value: string) => void;
  setDocumentId: (value: string) => void;
  setWhatsapp: (value: string) => void;
  setCompanyName: (value: string) => void;
  setCompanyDocument: (value: string) => void;
}

const ProfileForm = ({
  email,
  username,
  fullName,
  companyName,
  documentId,
  whatsapp,
  companyDocument,
  handleEmailChange,
  setFullName,
  setDocumentId,
  setWhatsapp,
  setCompanyName,
  setCompanyDocument
}: ProfileFormProps) => {
  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <Mail className="h-4 w-4 mr-2 text-blue-500" />
            Email
          </label>
          <input 
            type="email"
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
            value={email}
            onChange={handleEmailChange}
            placeholder="seu@email.com"
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <User className="h-4 w-4 mr-2 text-purple-500" />
            Nome de usuário
          </label>
          <input 
            className="w-full px-4 py-3 bg-gray-100 border border-gray-300 rounded-xl text-gray-500 cursor-not-allowed"
            value={username}
            disabled
            placeholder="Nome de usuário gerado automaticamente"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <User className="h-4 w-4 mr-2 text-green-500" />
            Nome completo
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder="Digite seu nome completo"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-orange-500" />
            CPF/CNPJ
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
            value={documentId}
            onChange={(e) => setDocumentId(e.target.value)}
            placeholder="000.000.000-00"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <Phone className="h-4 w-4 mr-2 text-green-600" />
            WhatsApp
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <Building className="h-4 w-4 mr-2 text-purple-600" />
            Nome da Empresa (opcional)
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Digite o nome da empresa"
          />
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-1">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <FileText className="h-4 w-4 mr-2 text-blue-600" />
            CNPJ da Empresa (opcional)
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
            value={companyDocument}
            onChange={(e) => setCompanyDocument(e.target.value)}
            placeholder="00.000.000/0000-00"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
