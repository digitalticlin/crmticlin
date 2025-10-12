import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Plus, ArrowLeft, Package, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ProductCard } from "@/components/ai-agents/products/ProductCard";
import { ProductFormModal } from "@/components/ai-agents/products/ProductFormModal";
import { EmptyStateProducts } from "@/components/ai-agents/products/EmptyStateProducts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

export default function ProductsManager() {
  const { agentId } = useParams<{ agentId: string }>();
  const navigate = useNavigate();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [agentName, setAgentName] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'product' | 'service'>('all');

  useEffect(() => {
    if (agentId) {
      loadAgentName();
      loadProducts();
    }
  }, [agentId]);

  const loadAgentName = async () => {
    if (!agentId) return;

    const { data } = await supabase
      .from('ai_agents')
      .select('name')
      .eq('id', agentId)
      .single();

    if (data) setAgentName(data.name);
  };

  const loadProducts = async () => {
    if (!agentId) return;

    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('ai_agent_products')
        .select('*')
        .eq('agent_id', agentId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Erro ao carregar produtos:', error);
      toast.error("Erro ao carregar produtos");
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Deseja realmente excluir este produto?')) return;

    try {
      const { error } = await supabase
        .from('ai_agent_products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      toast.success('Produto excluído!');
      loadProducts();
    } catch (error: any) {
      console.error('Erro ao excluir produto:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSuccess = () => {
    loadProducts();
    handleModalClose();
  };

  // Filtrar produtos baseado no tipo selecionado
  const filteredProducts = products.filter(product => {
    if (filterType === 'all') return true;
    return product.type === filterType;
  });

  // Contar produtos e serviços
  const productsCount = products.filter(p => p.type === 'product').length;
  const servicesCount = products.filter(p => p.type === 'service').length;

  return (
    <div className="relative">
      <PageHeader
        title={`Base de Conhecimento - ${agentName}`}
        description="Ensine ao agente sobre seus produtos e serviços"
        backButton={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(`/ai-agents/edit/${agentId}?step=2`)}
            className="h-10 w-10 rounded-lg hover:bg-white/40 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-gray-900" />
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        {/* Header com Botão e Filtros */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 relative z-20">
          <Button
            onClick={() => {
              setEditingProduct(null);
              setIsModalOpen(true);
            }}
            className="h-11 px-6 bg-ticlin hover:bg-ticlin/90 text-white font-semibold rounded-lg transition-all shadow-lg relative z-30 cursor-pointer"
          >
            <Plus className="h-5 w-5 mr-2" />
            Adicionar à Base de Conhecimento
          </Button>

          {/* Tabs de Filtro - Só aparecem quando há produtos */}
          {products.length > 0 && (
            <Tabs value={filterType} onValueChange={(value: any) => setFilterType(value)} className="relative z-30">
              <TabsList className="bg-white/20 backdrop-blur-xl border border-white/30">
                <TabsTrigger value="all" className="data-[state=active]:bg-white/40 cursor-pointer">
                  Todos ({products.length})
                </TabsTrigger>
                <TabsTrigger value="product" className="data-[state=active]:bg-ticlin/40 cursor-pointer">
                  <Package className="h-3 w-3 mr-1" />
                  Produtos ({productsCount})
                </TabsTrigger>
                <TabsTrigger value="service" className="data-[state=active]:bg-blue-500/40 cursor-pointer">
                  <Briefcase className="h-3 w-3 mr-1" />
                  Serviços ({servicesCount})
                </TabsTrigger>
              </TabsList>
            </Tabs>
          )}
        </div>

        {/* Grid de Produtos */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-gray-600">Carregando produtos...</p>
          </div>
        ) : products.length === 0 ? (
          <EmptyStateProducts onAddProduct={() => {
            setEditingProduct(null);
            setIsModalOpen(true);
          }} />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">
              Nenhum {filterType === 'product' ? 'produto' : 'serviço'} encontrado
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                onEdit={() => handleEdit(product)}
                onDelete={() => handleDelete(product.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal de Criação/Edição */}
      <ProductFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        product={editingProduct}
        agentId={agentId!}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
