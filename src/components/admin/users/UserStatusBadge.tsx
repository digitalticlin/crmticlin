
import { Badge } from "@/components/ui/badge";

interface UserStatusBadgeProps {
  status: string;
}

const UserStatusBadge = ({ status }: UserStatusBadgeProps) => {
  switch(status) {
    case 'online':
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Online</Badge>;
    case 'offline':
      return <Badge variant="outline" className="bg-gray-50 text-gray-500 border-gray-200">Offline</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default UserStatusBadge;
