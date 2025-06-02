
import { Card, CardContent } from "@/components/ui/card";
import { useVersionCheck } from "./hooks/useVersionCheck";
import { useDeployUpdate } from "./hooks/useDeployUpdate";
import { VersionDiagnosticHeader } from "./components/VersionDiagnosticHeader";
import { VersionInfoDisplay } from "./components/VersionInfoDisplay";
import { DeployResultsDisplay } from "./components/DeployResultsDisplay";
import { EmptyVersionState } from "./components/EmptyVersionState";

export const VPSVersionDiagnostic = () => {
  const { checking, versionInfo, checkVersion } = useVersionCheck();
  const { deploying, deployResults, deployUpdate } = useDeployUpdate(checkVersion);

  return (
    <Card>
      <VersionDiagnosticHeader
        checking={checking}
        deploying={deploying}
        onCheckVersion={checkVersion}
        onDeployUpdate={deployUpdate}
      />
      
      <CardContent>
        {!versionInfo && !deployResults && <EmptyVersionState />}

        {versionInfo && (
          <VersionInfoDisplay
            versionInfo={versionInfo}
            deploying={deploying}
            onDeployUpdate={deployUpdate}
          />
        )}

        {deployResults && <DeployResultsDisplay deployResults={deployResults} />}
      </CardContent>
    </Card>
  );
};
