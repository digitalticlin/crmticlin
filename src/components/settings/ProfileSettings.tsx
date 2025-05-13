
import { Loader2 } from "lucide-react";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import ProfileAvatar from "./ProfileAvatar";
import ProfileForm from "./ProfileForm";
import SecuritySection from "./SecuritySection";
import ProfileActions from "./ProfileActions";

const ProfileSettings = () => {
  const {
    loading,
    saving,
    email,
    username,
    fullName,
    companyName,
    documentId,
    whatsapp,
    avatarUrl,
    setFullName,
    setCompanyName,
    setDocumentId,
    setWhatsapp,
    handleEmailChange,
    handleSaveChanges,
    handleChangePassword
  } = useProfileSettings();

  if (loading) {
    return (
      <Card className="glass-card border-0">
        <CardContent className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-ticlin" />
        </CardContent>
      </Card>
    );
  }

  const handleCancel = () => {
    // Recarregar os dados originais
    window.location.reload();
  };

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle>Perfil</CardTitle>
        <CardDescription>
          Gerencie suas informações de perfil e dados da conta
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <ProfileAvatar 
          avatarUrl={avatarUrl} 
          fullName={fullName} 
        />
        
        <Separator />
        
        <ProfileForm
          email={email}
          username={username}
          fullName={fullName}
          companyName={companyName}
          documentId={documentId}
          whatsapp={whatsapp}
          handleEmailChange={handleEmailChange}
          setFullName={setFullName}
          setDocumentId={setDocumentId}
          setWhatsapp={setWhatsapp}
          setCompanyName={setCompanyName}
        />
        
        <Separator />
        
        <SecuritySection 
          email={email}
          onChangePassword={handleChangePassword}
        />
        
        <ProfileActions 
          saving={saving}
          onSave={handleSaveChanges}
          onCancel={handleCancel}
        />
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
