import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";

interface EmptyStateProductsProps {
  onAddProduct: () => void;
}

export const EmptyStateProducts = ({ onAddProduct }: EmptyStateProductsProps) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4">
      <div className="bg-white/10 backdrop-blur-xl rounded-full p-6 mb-6">
        <Package className="h-16 w-16 text-gray-400" />
      </div>

      <h3 className="text-xl font-bold text-gray-900 mb-2">
        Nenhum item na Base de Conhecimento
      </h3>

      <p className="text-gray-600 text-center mb-6 max-w-md">
        Adicione produtos e serviços que este agente pode oferecer.
        Isso ajuda o agente a responder sobre disponibilidade, preços e características.
      </p>

      <Button
        onClick={onAddProduct}
        className="h-10 px-6 bg-ticlin hover:bg-ticlin/90 text-white font-medium rounded-lg"
      >
        <Plus className="h-4 w-4 mr-2" />
        Adicionar Primeiro Item
      </Button>
    </div>
  );
};
