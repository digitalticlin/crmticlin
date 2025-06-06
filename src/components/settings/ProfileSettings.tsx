
import { Loader2 } from "lucide-react";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import AccountInfoSection from "./profile/AccountInfoSection";
import ProfileAvatarSection from "./profile/ProfileAvatarSection";
import { PersonalInfoSection } from "./profile/PersonalInfoSection";
import SecurityActionsSection from "./profile/SecurityActionsSection";
import { useAuthSession } from "@/hooks/useAuthSession";
import { useUserRole } from "@/hooks/useUserRole";

const ProfileSettings = () => {
  const { profileData, loading } = useProfileSettings();
  const { email } = useAuthSession();
  const { role } = useUserRole(); // Use 'role' instead of 'userRole'

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

  const handleChangePassword = async () => {
    // Implementar mudança de senha se necessário
    console.log("Mudança de senha não implementada");
  };

  return (
    <div className="space-y-8">
      <AccountInfoSection userRole={role} />
      
      <ProfileAvatarSection 
        avatarUrl={profileData.avatar_url} 
        fullName={profileData.full_name} 
      />

      <PersonalInfoSection />

      <SecurityActionsSection 
        email={email}
        onChangePassword={handleChangePassword}
      />
    </div>
  );
};

export default ProfileSettings;
