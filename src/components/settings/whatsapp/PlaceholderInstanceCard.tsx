
import { Card, CardContent } from "@/components/ui/card";
import { PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PlaceholderInstanceCardProps {
  isSuperAdmin?: boolean; // Indica se o usuário é SuperAdmin e não tem restrições de plano
}

const PlaceholderInstanceCard = ({ isSuperAdmin = false }: PlaceholderInstanceCardProps) => {
  return (
    <Card className="overflow-hidden glass-card border-0 flex flex-col items-center justify-center p-6 border-dashed border-2 border-gray-200 dark:border-gray-700 bg-transparent">
      <CardContent className="p-0 flex flex-col items-center text-center space-y-2">
        <div className="mb-2">
          <PlusCircle className="h-12 w-12 text-muted-foreground" />
        </div>
        
        <h3 className="font-medium">Adicionar número</h3>
        
        {!isSuperAdmin ? (
          <p className="text-sm text-muted-foreground">
            Disponível em planos superiores. Atualize seu plano para adicionar mais números de WhatsApp.
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Como SuperAdmin, você pode adicionar quantos números quiser.
          </p>
        )}
        
        <Button 
          variant="outline"
          size="sm"
          className="mt-2"
          disabled={!isSuperAdmin}
        >
          {isSuperAdmin ? "Adicionar WhatsApp" : "Atualizar plano"}
        </Button>
      </CardContent>
    </Card>
  );
};

export default PlaceholderInstanceCard;
