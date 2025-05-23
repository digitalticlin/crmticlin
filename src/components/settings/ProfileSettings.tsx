
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
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

const ProfileSettings = () => {
  const isMobile = useIsMobile();
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
    window.location.reload();
  };

  return (
    <Card className="glass-card border-0">
      <CardHeader className={cn("pb-4", isMobile && "px-4 pt-4")}>
        <CardTitle className={isMobile ? "text-lg" : "text-xl"}>Perfil</CardTitle>
        <CardDescription className={isMobile ? "text-sm" : ""}>
          Gerencie suas informações de perfil e dados da conta
        </CardDescription>
      </CardHeader>
      <CardContent className={cn("space-y-6", isMobile && "px-4 pb-4")}>
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
        
        <div className={cn(
          "flex space-x-2",
          isMobile ? "flex-col space-x-0 space-y-2" : "justify-end"
        )}>
          <ProfileActions 
            saving={saving}
            onSave={handleSaveChanges}
            onCancel={handleCancel}
          />
        </div>
      </CardContent>
    </Card>
  );
};

export default ProfileSettings;
