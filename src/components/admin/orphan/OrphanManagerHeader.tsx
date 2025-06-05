
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface OrphanManagerHeaderProps {
  onRefresh: () => void;
  isLoading: boolean;
}

export const OrphanManagerHeader = ({ onRefresh, isLoading }: OrphanManagerHeaderProps) => {
  return (
    <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <CardTitle className="text-xl text-gray-800">
                Gerenciador de Instâncias Órfãs
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Instâncias ativas na VPS mas não vinculadas no Supabase
              </p>
            </div>
          </div>
          <Button 
            onClick={onRefresh}
            disabled={isLoading}
            variant="outline"
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            Escanear
          </Button>
        </div>
      </CardHeader>
    </Card>
  );
};
