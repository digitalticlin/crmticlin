
import { Card, CardContent } from "@/components/ui/card";
import { 
  Wifi, 
  WifiOff, 
  Users, 
  CheckCircle,
  AlertTriangle
} from "lucide-react";

interface WhatsAppStatsGridProps {
  connectedInstances: any[];
  disconnectedInstances: any[];
  totalInstances: number;
  healthScore: number;
  isHealthy: boolean;
}

export const WhatsAppStatsGrid = ({
  connectedInstances,
  disconnectedInstances,
  totalInstances,
  healthScore,
  isHealthy
}: WhatsAppStatsGridProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-green-100 p-2 rounded-lg">
              <Wifi className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">
                {connectedInstances.length}
              </p>
              <p className="text-sm text-gray-600">Conectadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-red-100 p-2 rounded-lg">
              <WifiOff className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">
                {disconnectedInstances.length}
              </p>
              <p className="text-sm text-gray-600">Desconectadas</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">
                {totalInstances}
              </p>
              <p className="text-sm text-gray-600">Total</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isHealthy ? 'bg-green-100' : 'bg-yellow-100'}`}>
              {isHealthy ? (
                <CheckCircle className="h-5 w-5 text-green-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              )}
            </div>
            <div>
              <p className={`text-2xl font-bold ${isHealthy ? 'text-green-600' : 'text-yellow-600'}`}>
                {healthScore}%
              </p>
              <p className="text-sm text-gray-600">Saúde</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
