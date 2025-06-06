
import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Loader2, ServerCrash, Server } from "lucide-react";
import { WhatsAppWebService } from "@/services/whatsapp/whatsappWebService";

interface VPSHealthData {
  success: boolean;
  server?: string;
  version?: string;
  port?: number;
  status?: string;
  dockerRunning?: boolean;
  pm2Running?: boolean;
}

export const VPSHealthDiagnostic = () => {
  const [loading, setLoading] = useState(false);
  const [healthData, setHealthData] = useState<VPSHealthData>({ success: false });
  
  const checkServerHealth = async () => {
    setLoading(true);
    try {
      const response = await WhatsAppWebService.checkServerHealth();
      
      if (response.success) {
        setHealthData({
          success: true,
          status: response.data.status,
          server: response.data.server,
          version: response.data.version,
          port: response.data.port,
          dockerRunning: response.data.dockerRunning,
          pm2Running: response.data.pm2Running
        });
      } else {
        setHealthData({
          success: false,
          status: "error",
          server: "unknown"
        });
      }
    } catch (error: any) {
      setHealthData({
        success: false,
        status: "error"
      });
      console.error("Erro ao verificar saúde do servidor:", error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    // Auto check on mount
    checkServerHealth();
  }, []);
  
  const getStatusColor = () => {
    if (loading) return "text-blue-500";
    if (!healthData.success) return "text-red-500";
    return healthData.status === "healthy" || healthData.status === "online" 
      ? "text-green-500" 
      : "text-yellow-500";
  };
  
  const getStatusMessage = () => {
    if (loading) return "Verificando...";
    if (!healthData.success) return "Erro de conexão";
    
    if (healthData.status === "healthy" || healthData.status === "online") {
      return "Servidor online";
    } else {
      return "Servidor com problemas";
    }
  };
  
  return (
    <Card className="shadow-sm">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-medium">Status do Servidor</CardTitle>
          <Button 
            onClick={checkServerHealth} 
            variant="outline" 
            size="sm" 
            disabled={loading}
            className="h-8"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Verificar"}
          </Button>
        </div>
        <CardDescription>Diagnóstico de saúde do servidor WhatsApp</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            {loading ? (
              <Loader2 className={`h-5 w-5 mr-2 animate-spin ${getStatusColor()}`} />
            ) : healthData.success ? (
              <Server className={`h-5 w-5 mr-2 ${getStatusColor()}`} />
            ) : (
              <ServerCrash className={`h-5 w-5 mr-2 ${getStatusColor()}`} />
            )}
            <span className={`font-medium ${getStatusColor()}`}>
              {getStatusMessage()}
            </span>
          </div>
          <span className="text-sm text-muted-foreground">
            {healthData.server || "N/A"}
          </span>
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-gray-50 p-2 rounded text-sm">
            <span className="text-muted-foreground">Versão:</span>
            <span className="ml-2 font-medium">{healthData.version || "N/A"}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded text-sm">
            <span className="text-muted-foreground">Porta:</span>
            <span className="ml-2 font-medium">{healthData.port || "N/A"}</span>
          </div>
          <div className="bg-gray-50 p-2 rounded text-sm">
            <span className="text-muted-foreground">Docker:</span>
            <span className={`ml-2 font-medium ${healthData.dockerRunning ? "text-green-600" : "text-red-600"}`}>
              {healthData.dockerRunning ? "Ativo" : "Inativo"}
            </span>
          </div>
          <div className="bg-gray-50 p-2 rounded text-sm">
            <span className="text-muted-foreground">PM2:</span>
            <span className={`ml-2 font-medium ${healthData.pm2Running ? "text-green-600" : "text-red-600"}`}>
              {healthData.pm2Running ? "Ativo" : "Inativo"}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
