import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Package, Pencil, Trash2, Briefcase } from "lucide-react";
import { formatCurrency } from "@/utils/currencyUtils";

interface ProductCardProps {
  product: {
    id: string;
    type: 'product' | 'service';
    name: string;
    description?: string;
    category?: string;
    price: number;
    currency: string;
    image_url?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export const ProductCard = ({ product, onEdit, onDelete }: ProductCardProps) => {
  return (
    <Card className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl hover:bg-white/15 hover:shadow-xl transition-all duration-300">
      <CardContent className="p-4">
        {/* Imagem do Produto */}
        <div className="aspect-square bg-white/20 rounded-xl mb-3 overflow-hidden relative">
          {product.image_url ? (
            <img
              src={product.image_url}
              alt={product.name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              {product.type === 'product' ? (
                <Package className="h-16 w-16 text-gray-400" />
              ) : (
                <Briefcase className="h-16 w-16 text-gray-400" />
              )}
            </div>
          )}
          {/* Badge de Tipo */}
          <div className="absolute top-2 left-2">
            <Badge
              className={
                product.type === 'product'
                  ? 'bg-ticlin/90 text-white border-0'
                  : 'bg-blue-500/90 text-white border-0'
              }
            >
              {product.type === 'product' ? (
                <>
                  <Package className="h-3 w-3 mr-1" />
                  Produto
                </>
              ) : (
                <>
                  <Briefcase className="h-3 w-3 mr-1" />
                  Serviço
                </>
              )}
            </Badge>
          </div>
        </div>

        {/* Nome do Produto */}
        <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">
          {product.name}
        </h3>

        {/* Descrição */}
        {product.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2 h-8">
            {product.description}
          </p>
        )}

        {/* Categoria */}
        {product.category && (
          <Badge variant="secondary" className="text-[10px] mb-2 font-medium">
            {product.category}
          </Badge>
        )}

        {/* Preço */}
        <div className="text-lg font-bold text-ticlin mb-3">
          {formatCurrency(product.price, product.currency)}
        </div>

        {/* Ações */}
        <div className="flex gap-2 pt-2 border-t border-white/20">
          <Button
            variant="ghost"
            size="sm"
            onClick={onEdit}
            className="flex-1 h-8 hover:bg-white/30 rounded-lg text-xs"
          >
            <Pencil className="h-3 w-3 mr-1" />
            Editar
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="flex-1 h-8 hover:bg-red-500/20 rounded-lg text-xs text-red-600"
          >
            <Trash2 className="h-3 w-3 mr-1" />
            Excluir
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
