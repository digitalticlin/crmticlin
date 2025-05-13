
export interface ConfigProps {
  config: {
    systemName: string;
    apiUrl: string;
    maxInstances: string;
    maxUsers: string;
    debugMode: boolean;
    maintenanceMode: boolean;
    logRetention: string;
    webhookUrl: string;
    aiModel: string;
    aiBotLimit: string;
    termsText: string;
    apiMaxRetries?: string;
    apiTimeout?: string;
    apiAuthHeader?: string;
    useHttps?: boolean;
    apiCaching?: boolean;
    cacheStrategy?: string;
    maxQueriesPerMinute?: string;
    [key: string]: any;
  };
  onConfigChange: (field: string, value: any) => void;
}
