
import { User } from "lucide-react";
import ProfileForm from "../ProfileForm";

interface PersonalInfoSectionProps {
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

const PersonalInfoSection = ({
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
}: PersonalInfoSectionProps) => {
  return (
    <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-4 md:p-8 animate-fade-in" style={{ animationDelay: "200ms" }}>
      <div className="flex items-center space-x-3 md:space-x-4 mb-4 md:mb-6">
        <div className="p-2 md:p-3 bg-gradient-to-r from-blue-500/20 to-blue-400/10 rounded-2xl">
          <User className="h-5 w-5 md:h-6 md:w-6 text-blue-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base md:text-xl font-semibold text-gray-800 truncate">Informações Pessoais</h3>
          <p className="text-sm md:text-base text-gray-700 truncate">Gerencie seus dados pessoais e de contato</p>
        </div>
      </div>

      <ProfileForm
        email={email}
        username={username}
        fullName={fullName}
        companyName={companyName}
        documentId={documentId}
        whatsapp={whatsapp}
        companyDocument={companyDocument}
        handleEmailChange={handleEmailChange}
        setFullName={setFullName}
        setDocumentId={setDocumentId}
        setWhatsapp={setWhatsapp}
        setCompanyName={setCompanyName}
        setCompanyDocument={setCompanyDocument}
      />
    </div>
  );
};

export default PersonalInfoSection;
