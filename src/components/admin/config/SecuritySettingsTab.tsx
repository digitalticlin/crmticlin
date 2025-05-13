
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield } from "lucide-react";

export function SecuritySettingsTab() {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Shield className="h-5 w-5 mt-1" />
          <div>
            <CardTitle>Configurações de Segurança</CardTitle>
            <CardDescription>
              Configure os parâmetros de segurança da plataforma
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <p className="text-muted-foreground">
            Configurações de segurança serão implementadas aqui.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
