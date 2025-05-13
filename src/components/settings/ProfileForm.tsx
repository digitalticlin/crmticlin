
import { Phone } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

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
  setWhatsapp
}: ProfileFormProps) => {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2">
        <Label htmlFor="name">Nome completo</Label>
        <Input 
          id="name" 
          value={fullName} 
          onChange={(e) => setFullName(e.target.value)} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input 
          id="email" 
          value={email} 
          onChange={handleEmailChange} 
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="username">Nome de usuário</Label>
        <Input 
          id="username" 
          value={username} 
          readOnly
        />
        <p className="text-xs text-muted-foreground">
          Gerado automaticamente com base no email
        </p>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="company">Empresa</Label>
        <Input 
          id="company" 
          value={companyName}
          readOnly
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="documentId">CPF/CNPJ</Label>
        <Input 
          id="documentId" 
          value={documentId}
          onChange={(e) => setDocumentId(e.target.value)}
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="whatsapp">WhatsApp</Label>
        <div className="relative">
          <Phone className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            id="whatsapp" 
            className="pl-8"
            value={whatsapp}
            onChange={(e) => setWhatsapp(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
