
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MessageSquare } from "lucide-react";
import { useCompanyData } from "@/hooks/useCompanyData";

export default function WhatsAppTestCard() {
  const { companyId } = useCompanyData();

  return (
    <Card className="glass-card border-0">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">WhatsApp Test</CardTitle>
        <MessageSquare className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">3</div>
        <p className="text-xs text-muted-foreground">
          Instâncias ativas
        </p>
        <div className="mt-2">
          <Badge variant="outline" className="text-xs">
            {companyId ? 'Conectado' : 'Desconectado'}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}
