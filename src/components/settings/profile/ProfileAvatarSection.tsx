
import { Camera } from "lucide-react";
import ProfileAvatar from "../ProfileAvatar";

interface ProfileAvatarSectionProps {
  avatarUrl: string | null;
  fullName: string;
}

const ProfileAvatarSection = ({ avatarUrl, fullName }: ProfileAvatarSectionProps) => {
  return (
    <div className="bg-white/35 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl p-8 animate-fade-in" style={{ animationDelay: "100ms" }}>
      <div className="flex items-center space-x-4 mb-6">
        <div className="p-3 bg-gradient-to-r from-[#D3D800]/20 to-[#D3D800]/10 rounded-2xl">
          <Camera className="h-6 w-6 text-[#D3D800]" />
        </div>
        <div>
          <h3 className="text-xl font-semibold text-gray-800">Foto do Perfil</h3>
          <p className="text-gray-700">Personalize sua foto de perfil</p>
        </div>
      </div>
      
      <ProfileAvatar 
        avatarUrl={avatarUrl} 
        fullName={fullName} 
      />
    </div>
  );
};

export default ProfileAvatarSection;
