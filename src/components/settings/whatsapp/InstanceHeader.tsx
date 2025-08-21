
import { Phone, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { WhatsAppInstance } from "@/hooks/whatsapp/whatsappInstanceStore";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface InstanceHeaderProps {
  instance: WhatsAppInstance;
  onRefreshStatus?: () => Promise<void>;
  isStatusLoading?: boolean;
}

const InstanceHeader = ({ 
  instance, 
  onRefreshStatus,
  isStatusLoading = false
}: InstanceHeaderProps) => {
  return (
    <div className="flex justify-between items-center mb-3">
      <div>
        <h4 className="font-medium">WhatsApp</h4>
        <p className="text-sm text-muted-foreground">Instance: {instance.instanceName}</p>
        {instance.connected && instance.phoneNumber && (
          <div className="flex items-center mt-1 gap-1 text-green-600 dark:text-green-400">
            <Phone className="w-3 h-3" />
            <p className="text-xs font-medium">{instance.phoneNumber}</p>
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="outline" className={instance.connected ? 
          "bg-green-50 text-green-600 dark:bg-green-900/20 dark:text-green-400" : 
          "bg-gray-50 text-gray-600 dark:bg-gray-900/20 dark:text-gray-400"}>
          {instance.connected ? "Connected" : "Disconnected"}
        </Badge>
        
        {onRefreshStatus && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-6 w-6" 
                  onClick={onRefreshStatus}
                  disabled={isStatusLoading}
                >
                  <RefreshCcw 
                    className={`h-3 w-3 ${isStatusLoading ? 'animate-spin' : ''}`} 
                  />
                  <span className="sr-only">Refresh Status</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Refresh connection status</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    </div>
  );
};

export default InstanceHeader;
