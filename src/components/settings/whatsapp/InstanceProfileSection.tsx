
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CardTitle } from "@/components/ui/card";
import { Phone } from "lucide-react";
import { WhatsAppWebInstance } from "@/hooks/whatsapp/useWhatsAppWebInstances";
import { InstanceStatusBadge } from "./InstanceStatusBadge";

interface InstanceProfileSectionProps {
  instance: WhatsAppWebInstance;
}

export function InstanceProfileSection({ instance }: InstanceProfileSectionProps) {
  const formatPhone = (phone: string) => {
    if (!phone) return '';
    
    // Format Brazilian phone number
    if (phone.startsWith('55')) {
      const number = phone.slice(2);
      if (number.length === 11) {
        return `+55 ${number.slice(0, 2)} ${number.slice(2, 7)}-${number.slice(7)}`;
      }
    }
    
    return `+${phone}`;
  };

  const getProfileInitials = () => {
    if (instance.profile_name) {
      return instance.profile_name
        .split(' ')
        .map(word => word[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();
    }
    
    return 'WA';
  };

  const getInstanceDisplayName = () => {
    if (instance.profile_name) {
      return instance.profile_name;
    }
    return instance.instance_name;
  };

  return (
    <div className="flex items-center gap-3 flex-1">
      <Avatar className="h-12 w-12 border-2 border-white/30">
        {instance.profile_pic_url ? (
          <AvatarImage src={instance.profile_pic_url} alt={instance.profile_name || 'Profile'} />
        ) : null}
        <AvatarFallback className="bg-green-500/20 text-green-700 font-semibold text-sm">
          {getProfileInitials()}
        </AvatarFallback>
      </Avatar>
      
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1">
          <CardTitle className="text-lg font-semibold text-gray-800 truncate">
            {getInstanceDisplayName()}
          </CardTitle>
          <InstanceStatusBadge connectionStatus={instance.connection_status} />
        </div>
        
        {instance.phone && (
          <div className="flex items-center gap-1 text-sm text-gray-600">
            <Phone className="h-3 w-3" />
            {formatPhone(instance.phone)}
          </div>
        )}
      </div>
    </div>
  );
}
