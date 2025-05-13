
import { QrCode } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const PlaceholderInstanceCard = () => {
  return (
    <Card className="overflow-hidden glass-card border-0 border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
      <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
        <QrCode className="w-8 h-8 text-gray-400 mb-2" />
        <h4 className="font-medium">Adicional WhatsApp</h4>
        <p className="text-sm text-muted-foreground mb-3">
          Disponível em planos superiores
        </p>
        <Button variant="outline" disabled>Upgrade de Plano</Button>
      </CardContent>
    </Card>
  );
};

export default PlaceholderInstanceCard;
