
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TestLogsDisplayProps {
  logs: string[];
}

export const TestLogsDisplay = ({ logs }: TestLogsDisplayProps) => {
  if (logs.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm">Logs de Execução (CORREÇÃO ROBUSTA)</CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-40 w-full">
          <div className="space-y-1">
            {logs.map((log, index) => (
              <div key={index} className="text-xs font-mono bg-black/5 p-2 rounded">
                {log}
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
