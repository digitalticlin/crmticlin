
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

interface ProfileAvatarProps {
  avatarUrl: string | null;
  fullName: string;
}

const ProfileAvatar = ({ avatarUrl, fullName }: ProfileAvatarProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <Avatar className="h-20 w-20">
        {avatarUrl ? (
          <AvatarImage src={avatarUrl} alt={fullName} />
        ) : (
          <AvatarFallback className="bg-ticlin/20 text-black text-2xl">
            {fullName ? fullName.charAt(0).toUpperCase() : "U"}
          </AvatarFallback>
        )}
      </Avatar>
      <div className="space-x-2">
        <Button variant="outline" size="sm">
          Alterar foto
        </Button>
        <Button variant="outline" size="sm" className="text-red-600">
          Remover
        </Button>
      </div>
    </div>
  );
};

export default ProfileAvatar;
