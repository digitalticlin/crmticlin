
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { useAutoDeploy } from "./hooks/useAutoDeploy";
import { DeployStatusHeader } from "./components/DeployStatusHeader";
import { DeploymentProgress } from "./components/DeploymentProgress";
import { SSHInstructions } from "./components/SSHInstructions";
import { DiagnosticsPanel } from "./components/DiagnosticsPanel";
import { DeployActions } from "./components/DeployActions";

export const AutoDeployButton = () => {
  const {
    isDeploying,
    deployStatus,
    deployResult,
    diagnostics,
    servicesOnline,
    checkServicesStatus,
    handleManualDeploy
  } = useAutoDeploy();

  const getStatusColor = () => {
    switch (deployStatus) {
      case 'checking':
        return 'border-blue-200 bg-blue-50';
      case 'deploying':
        return 'border-blue-200 bg-blue-50';
      case 'success':
        return 'border-green-200 bg-green-50';
      case 'error':
        return 'border-red-200 bg-red-50';
      default:
        return 'border-gray-200 bg-gray-50';
    }
  };

  return (
    <Card className={getStatusColor()}>
      <CardHeader>
        <DeployStatusHeader deployStatus={deployStatus} servicesOnline={servicesOnline} />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <DeploymentProgress 
            deployStatus={deployStatus} 
            isDeploying={isDeploying} 
            servicesOnline={servicesOnline} 
          />

          <SSHInstructions deployResult={deployResult} />

          <DiagnosticsPanel diagnostics={diagnostics} />

          <DeployActions
            deployStatus={deployStatus}
            isDeploying={isDeploying}
            onCheckServices={checkServicesStatus}
            onManualDeploy={handleManualDeploy}
          />
        </div>
      </CardContent>
    </Card>
  );
};
