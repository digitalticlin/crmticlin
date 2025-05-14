
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock } from "lucide-react";

interface WaitingForConnectionCardProps {
  instanceName: string;
  onDelete: () => void;
}

const WaitingForConnectionCard = ({
  instanceName,
  onDelete,
}: WaitingForConnectionCardProps) => (
  <Card className="overflow-hidden flex flex-col items-center justify-center p-6 bg-transparent border-2 border-dashed border-yellow-300">
    <CardContent className="flex flex-col items-center text-center space-y-2 pb-2">
      <Clock className="h-10 w-10 text-yellow-500 mb-2" />
      <h3 className="font-medium">Aguardando conexão</h3>
      <div className="text-sm text-muted-foreground max-w-xs">
        O número <span className="font-mono">{instanceName}</span> está aguardando conexão.<br/>
        Use o WhatsApp do celular e finalize o pareamento pelo menu de aparelhos conectados.
      </div>
      <Badge variant="outline" className="mt-2 bg-yellow-50 text-yellow-700 border-yellow-300">Status: aguardando conexão</Badge>
    </CardContent>
    <CardFooter className="flex justify-center">
      <Button variant="destructive" size="sm" onClick={onDelete}>
        Excluir Instância
      </Button>
    </CardFooter>
  </Card>
);

export default WaitingForConnectionCard;
