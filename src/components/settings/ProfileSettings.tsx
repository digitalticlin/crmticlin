
import { Loader2 } from "lucide-react";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import AccountInfoSection from "./profile/AccountInfoSection";
import ProfileAvatarSection from "./profile/ProfileAvatarSection";
import PersonalInfoSection from "./profile/PersonalInfoSection";
import SecurityActionsSection from "./profile/SecurityActionsSection";
import ProfileActionsSection from "./profile/ProfileActionsSection";

const ProfileSettings = () => {
  const {
    loading,
    saving,
    email,
    username,
    fullName,
    companyName,
    companyDocument,
    documentId,
    whatsapp,
    avatarUrl,
    userRole,
    setFullName,
    setCompanyName,
    setCompanyDocument,
    setDocumentId,
    setWhatsapp,
    handleEmailChange,
    handleSaveChanges,
    handleChangePassword
  } = useProfileSettings();

  if (loading) {
    return (
      <div className="min-h-[500px] flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative mx-auto w-12 h-12">
            <div className="absolute inset-0 rounded-full border-2 border-[#D3D800]/30"></div>
            <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-[#D3D800] animate-spin"></div>
          </div>
          <p className="text-sm text-gray-700">Carregando perfil...</p>
        </div>
      </div>
    );
  }

  const handleCancel = () => {
    window.location.reload();
  };

  return (
    <div className="space-y-8">
      <AccountInfoSection userRole={userRole} />
      
      <ProfileAvatarSection 
        avatarUrl={avatarUrl} 
        fullName={fullName} 
      />

      <PersonalInfoSection
        email={email}
        username={username}
        fullName={fullName}
        companyName={companyName}
        companyDocument={companyDocument}
        documentId={documentId}
        whatsapp={whatsapp}
        handleEmailChange={handleEmailChange}
        setFullName={setFullName}
        setDocumentId={setDocumentId}
        setWhatsapp={setWhatsapp}
        setCompanyName={setCompanyName}
        setCompanyDocument={setCompanyDocument}
      />

      <SecurityActionsSection 
        email={email}
        onChangePassword={handleChangePassword}
      />

      <ProfileActionsSection
        saving={saving}
        onSave={handleSaveChanges}
        onCancel={handleCancel}
      />
    </div>
  );
};

export default ProfileSettings;
