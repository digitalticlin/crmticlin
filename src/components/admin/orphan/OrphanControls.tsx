
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, Download, Trash2 } from "lucide-react";

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

interface OrphanControlsProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onSyncOrphans: () => void;
  onCleanupOrphans: () => void;
  isProcessing: boolean;
  orphanInstances: VPSInstance[];
}

export const OrphanControls = ({
  searchTerm,
  onSearchChange,
  onSyncOrphans,
  onCleanupOrphans,
  isProcessing,
  orphanInstances
}: OrphanControlsProps) => {
  const orphansWithPhone = orphanInstances.filter(i => i.phone && i.phone.length > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Controles de Gerenciamento</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Label htmlFor="search">Buscar instâncias órfãs</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="search"
                placeholder="ID da instância, telefone, nome do perfil..."
                value={searchTerm}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <Button
              onClick={onSyncOrphans}
              disabled={isProcessing || orphansWithPhone.length === 0}
              className="gap-2"
            >
              <Download className="h-4 w-4" />
              Sincronizar com Telefone ({orphansWithPhone.length})
            </Button>
            
            <Button
              variant="destructive"
              onClick={onCleanupOrphans}
              disabled={isProcessing || orphanInstances.length === 0}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              Limpar Órfãs ({orphanInstances.length})
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
