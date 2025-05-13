
import { CardFooter } from "@/components/ui/card";

interface UsersFooterProps {
  filteredCount: number;
  totalCount: number;
}

const UsersFooter = ({ filteredCount, totalCount }: UsersFooterProps) => {
  return (
    <CardFooter className="flex justify-between">
      <div className="text-sm text-muted-foreground">
        Mostrando {filteredCount} de {totalCount} usuários
      </div>
      <div className="text-sm text-muted-foreground">
        Última atualização: {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}
      </div>
    </CardFooter>
  );
};

export default UsersFooter;
