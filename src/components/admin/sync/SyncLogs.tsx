
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface SyncLogsProps {
  logs: string[];
}

export const SyncLogs = ({ logs }: SyncLogsProps) => {
  if (logs.length === 0) return null;

  return (
    <Card className="bg-white/30 backdrop-blur-xl rounded-3xl border border-white/30 shadow-2xl">
      <CardHeader>
        <CardTitle className="text-sm">Logs de Execução</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-40 w-full">
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-xs font-mono bg-black/10 p-2 rounded">
                {log}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
