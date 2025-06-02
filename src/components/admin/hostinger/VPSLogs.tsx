
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText, RefreshCw, Download } from "lucide-react";

interface VPSLogsProps {
  logs: string;
  loadLogs: (lines?: number) => Promise<void>;
}

export const VPSLogs = ({ logs, loadLogs }: VPSLogsProps) => {
  const handleDownloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vps-logs-${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Logs da VPS
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => loadLogs(100)}
              className="gap-1"
            >
              <RefreshCw className="h-4 w-4" />
              Atualizar
            </Button>
            {logs && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadLogs}
                className="gap-1"
              >
                <Download className="h-4 w-4" />
                Download
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {!logs ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">
              Nenhum log carregado
            </p>
            <Button onClick={() => loadLogs(100)} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Carregar Logs
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">
                Últimas 100 linhas
              </span>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadLogs(50)}
                >
                  50 linhas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadLogs(200)}
                >
                  200 linhas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => loadLogs(500)}
                >
                  500 linhas
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-96 w-full rounded border">
              <pre className="p-4 text-xs font-mono bg-gray-900 text-green-400 whitespace-pre-wrap">
                {logs || 'Carregando logs...'}
              </pre>
            </ScrollArea>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
