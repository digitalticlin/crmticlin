
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Server } from "lucide-react";

interface HostingerVPS {
  id: string;
  name: string;
  status: string;
  ip: string;
  location: string;
}

interface VPSSelectorProps {
  vpsList: HostingerVPS[];
  selectedVPS: HostingerVPS | null;
  setSelectedVPS: (vps: HostingerVPS) => void;
  onRefresh: () => void;
  loading: boolean;
}

export const VPSSelector = ({ 
  vpsList, 
  selectedVPS, 
  setSelectedVPS, 
  onRefresh, 
  loading 
}: VPSSelectorProps) => {
  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'running' || statusLower === 'active') {
      return <Badge className="bg-green-100 text-green-800">Online</Badge>;
    }
    return <Badge variant="outline" className="text-gray-600">Offline</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            <CardTitle>Selecionar VPS</CardTitle>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={loading}
            className="gap-1"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {vpsList.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-muted-foreground">Nenhuma VPS encontrada</p>
          </div>
        ) : (
          <div className="space-y-4">
            <Select
              value={selectedVPS?.id || ""}
              onValueChange={(value) => {
                const vps = vpsList.find(v => v.id === value);
                if (vps) setSelectedVPS(vps);
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma VPS" />
              </SelectTrigger>
              <SelectContent>
                {vpsList.map((vps) => (
                  <SelectItem key={vps.id} value={vps.id}>
                    <div className="flex items-center justify-between w-full">
                      <span>{vps.name}</span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {vps.ip}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedVPS && (
              <div className="p-3 bg-blue-50 rounded-lg border">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">{selectedVPS.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      IP: {selectedVPS.ip} | {selectedVPS.location}
                    </p>
                  </div>
                  {getStatusBadge(selectedVPS.status)}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};
