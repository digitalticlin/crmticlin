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
    price: number | null;
    currency: string | null;
    price_type?: 'fixed' | 'on_request';
    image_url?: string;
  };
  onEdit: () => void;
  onDelete: () => void;
}

export const ProductCard = ({ product, onEdit, onDelete }: ProductCardProps) => {
  return (
    <Card className="group bg-white/10 backdrop-blur-xl border border-white/20 rounded-xl hover:bg-white/15 hover:shadow-lg transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Imagem do Produto - menor e à esquerda */}
          <div className="w-20 h-20 bg-white/20 rounded-lg overflow-hidden flex-shrink-0 relative">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
              />
            ) : (
              <div className="flex items-center justify-center h-full">
                {product.type === 'product' ? (
                  <Package className="h-8 w-8 text-gray-400" />
                ) : (
                  <Briefcase className="h-8 w-8 text-gray-400" />
                )}
              </div>
            )}
          </div>

          {/* Conteúdo principal - centralizado */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 mb-1">
              {/* Badge de Tipo */}
              <Badge className="bg-white/30 backdrop-blur-sm border border-white/40 text-gray-900 text-[10px]">
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

              {/* Categoria */}
              {product.category && (
                <Badge className="bg-white/30 backdrop-blur-sm border border-white/40 text-gray-900 text-[10px] font-medium">
                  {product.category}
                </Badge>
              )}
            </div>

            {/* Nome do Produto */}
            <h3 className="font-bold text-gray-900 text-base mb-1 line-clamp-1">
              {product.name}
            </h3>

            {/* Descrição */}
            {product.description && (
              <p className="text-xs text-gray-600 line-clamp-1">
                {product.description}
              </p>
            )}
          </div>

          {/* Preço e Ações - direita */}
          <div className="flex flex-col items-end gap-2">
            {/* Preço */}
            <div className="text-lg font-bold text-gray-900 whitespace-nowrap">
              {product.price !== null && product.currency ? (
                formatCurrency(product.price, product.currency)
              ) : (
                <span className="text-sm font-medium text-blue-700">Sob consulta</span>
              )}
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onEdit}
                className="h-8 px-3 hover:bg-white/30 rounded-lg text-xs"
              >
                <Pencil className="h-3 w-3 mr-1" />
                Editar
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onDelete}
                className="h-8 px-3 hover:bg-red-500/20 rounded-lg text-xs text-red-600"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
