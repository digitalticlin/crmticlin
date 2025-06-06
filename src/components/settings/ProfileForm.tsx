
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

interface ProfileFormProps {
  email: string;
  username: string;
  fullName: string;
  companyName: string;
  documentId: string;
  whatsapp: string;
  handleEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  setFullName: (value: string) => void;
  setDocumentId: (value: string) => void;
  setWhatsapp: (value: string) => void;
  setCompanyName: (value: string) => void;
}

const ProfileForm = ({
  email,
  username,
  fullName,
  companyName,
  documentId,
  whatsapp,
  handleEmailChange,
  setFullName,
  setDocumentId,
  setWhatsapp,
  setCompanyName
}: ProfileFormProps) => {
  const isMobile = useIsMobile();

  return (
    <div className="space-y-6">
      {/* Informações Pessoais */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <span className="mr-2">👤</span>
            Nome completo
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
            placeholder="Seu nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <span className="mr-2">📧</span>
            Email
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
            value={email}
            onChange={handleEmailChange}
            disabled
            placeholder="seu@email.com"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <span className="mr-2">#</span>
            Nome de usuário
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
            value={username}
            disabled
            placeholder="digitalticlin"
          />
          <p className="text-xs text-gray-600">
            Gerado automaticamente com base no email
          </p>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-800 flex items-center">
            <span className="mr-2">📱</span>
            WhatsApp
          </label>
          <input 
            className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
            placeholder="(11) 99999-9999"
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
