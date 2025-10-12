import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { PageHeader } from "@/components/layout/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, ArrowLeft, Package, Briefcase, Search } from "lucide-react";
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
  const [searchQuery, setSearchQuery] = useState("");

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
        .from('ai_agent_knowledge')
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
        .from('ai_agent_knowledge')
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

  // Filtrar produtos baseado no tipo e busca
  const filteredProducts = products.filter(product => {
    // Filtro por tipo
    if (filterType !== 'all' && product.type !== filterType) return false;

    // Filtro por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      return (
        product.name?.toLowerCase().includes(query) ||
        product.description?.toLowerCase().includes(query) ||
        product.category?.toLowerCase().includes(query) ||
        product.price?.toString().includes(query)
      );
    }

    return true;
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
            onClick={() => navigate(`/ai-agents/edit/${agentId}?step=3`)}
            className="h-10 w-10 rounded-lg hover:bg-white/40 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-gray-900" />
          </Button>
        }
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 relative z-10">
        {/* Busca e Filtros */}
        {products.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            {/* Campo de Busca */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input
                type="text"
                placeholder="Buscar por nome, categoria, preço..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 bg-white/40 backdrop-blur-sm border border-white/50 rounded-lg focus:bg-white/60 transition-all"
              />
            </div>

            {/* Tabs de Filtro */}
            <Tabs value={filterType} onValueChange={(value: any) => setFilterType(value)}>
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

            {/* Botão Adicionar */}
            <Button
              onClick={() => {
                setEditingProduct(null);
                setIsModalOpen(true);
              }}
              variant="ghost"
              className="h-10 px-4 bg-white/40 hover:bg-white/60 backdrop-blur-xl border border-white/50 rounded-lg text-gray-900 font-medium transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </div>
        )}

        {/* Lista de Produtos */}
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
          <div className="space-y-3">
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
