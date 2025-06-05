
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, Phone, WifiOff } from "lucide-react";

interface VPSInstance {
  instanceId: string;
  status: string;
  phone?: string;
  profileName?: string;
  profilePictureUrl?: string;
  isOrphan: boolean;
  companyName?: string;
  userName?: string;
  lastSeen?: string;
  companyId?: string;
  userId?: string;
}

interface OrphanStatisticsProps {
  orphanInstances: VPSInstance[];
}

export const OrphanStatistics = ({ orphanInstances }: OrphanStatisticsProps) => {
  const orphansWithPhone = orphanInstances.filter(i => i.phone && i.phone.length > 0);
  const orphansWithoutPhone = orphanInstances.filter(i => !i.phone || i.phone.length === 0);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {orphanInstances.length}
              </p>
              <p className="text-sm text-gray-600">Total Órfãs</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Phone className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {orphansWithPhone.length}
              </p>
              <p className="text-sm text-gray-600">Com Telefone</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-gray-100 p-2 rounded-lg">
              <WifiOff className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-600">
                {orphansWithoutPhone.length}
              </p>
              <p className="text-sm text-gray-600">Sem Telefone</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
