
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Zap, RotateCcw, Download, Terminal, FileText } from "lucide-react";

export const AdminActionsCard = () => {
  return (
    <Card className="border-purple-200 bg-purple-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-600" />
          <CardTitle className="text-purple-800">Ações Administrativas</CardTitle>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button className="bg-blue-600 hover:bg-blue-700 justify-start">
              <Zap className="h-4 w-4 mr-2" />
              Deploy Manual
            </Button>
            
            <Button variant="outline" className="justify-start">
              <RotateCcw className="h-4 w-4 mr-2" />
              Reiniciar VPS
            </Button>
            
            <Button variant="outline" className="justify-start">
              <Download className="h-4 w-4 mr-2" />
              Criar Backup
            </Button>
            
            <Button variant="outline" className="justify-start">
              <Terminal className="h-4 w-4 mr-2" />
              Console SSH
            </Button>
          </div>
          
          <div className="pt-2 border-t">
            <Button variant="outline" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" />
              Ver Logs Completos
            </Button>
          </div>
          
          <div className="text-xs text-purple-700 bg-purple-100 p-2 rounded">
            <strong>💡 Dica:</strong> Use o deploy manual apenas se necessário. O sistema verifica automaticamente se os serviços já estão rodando.
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
