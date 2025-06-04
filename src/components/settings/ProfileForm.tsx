
import { Phone, Mail, User, Hash } from "lucide-react";

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
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800 flex items-center space-x-2">
          <User className="h-4 w-4 text-blue-400" />
          <span>Nome completo</span>
        </label>
        <input 
          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 transition-all duration-200"
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
          placeholder="Seu nome completo"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800 flex items-center space-x-2">
          <Mail className="h-4 w-4 text-green-400" />
          <span>Email</span>
        </label>
        <input 
          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-green-400/50 focus:border-green-400/50 transition-all duration-200"
          value={email} 
          onChange={handleEmailChange} 
          placeholder="seu@email.com"
        />
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800 flex items-center space-x-2">
          <Hash className="h-4 w-4 text-purple-400" />
          <span>Nome de usuário</span>
        </label>
        <input 
          className="w-full px-4 py-3 bg-white/10 border border-white/40 rounded-xl text-gray-600 cursor-not-allowed"
          value={username} 
          readOnly
          placeholder="username"
        />
        <p className="text-xs text-gray-600">
          Gerado automaticamente com base no email
        </p>
      </div>
      
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-800 flex items-center space-x-2">
          <Phone className="h-4 w-4 text-[#D3D800]" />
          <span>WhatsApp</span>
        </label>
        <input 
          className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-xl text-gray-800 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-[#D3D800]/50 focus:border-[#D3D800]/50 transition-all duration-200"
          value={whatsapp}
          onChange={(e) => setWhatsapp(e.target.value)}
          placeholder="(11) 99999-9999"
        />
      </div>
    </div>
  );
};

export default ProfileForm;
