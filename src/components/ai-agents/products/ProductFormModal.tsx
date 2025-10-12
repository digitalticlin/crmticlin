import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { ImagePlus, X, Loader2, Package, Briefcase } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { CURRENCIES } from "@/utils/currencyUtils";
import { cn } from "@/lib/utils";

interface ProductFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: any;
  agentId: string;
  onSuccess: (newProduct?: any) => void;
}

export const ProductFormModal = ({
  isOpen,
  onClose,
  product,
  agentId,
  onSuccess
}: ProductFormModalProps) => {
  const [formData, setFormData] = useState({
    type: 'product' as 'product' | 'service',
    name: '',
    description: '',
    category: '',
    price: '',
    currency: 'BRL',
    image_url: ''
  });
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        type: product.type || 'product',
        name: product.name || '',
        description: product.description || '',
        category: product.category || '',
        price: product.price?.toString() || '',
        currency: product.currency || 'BRL',
        image_url: product.image_url || ''
      });
    } else {
      setFormData({
        type: 'product',
        name: '',
        description: '',
        category: '',
        price: '',
        currency: 'BRL',
        image_url: ''
      });
    }
  }, [product, isOpen]);

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${agentId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('agent-knowledge')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('agent-knowledge')
        .getPublicUrl(fileName);

      setFormData(prev => ({ ...prev, image_url: publicUrl }));
      toast.success('Imagem enviada com sucesso!');
    } catch (error: any) {
      console.error('Erro ao fazer upload:', error);
      toast.error('Erro ao enviar imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    // Validação de campos obrigatórios
    if (!formData.name.trim() || !formData.price) {
      toast.error('Nome e preço são obrigatórios');
      return;
    }

    // Validação de imagem obrigatória para produtos
    if (formData.type === 'product' && !formData.image_url) {
      toast.error('Produtos precisam de imagem. Escolha "Serviço" se não quiser adicionar foto.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não autenticado');

      const productData = {
        agent_id: agentId,
        type: formData.type,
        name: formData.name.trim(),
        description: formData.description.trim() || null,
        category: formData.category.trim() || null,
        price: parseFloat(formData.price),
        currency: formData.currency,
        image_url: formData.image_url || null,
        created_by_user_id: user.id,
        updated_at: new Date().toISOString()
      };

      if (product) {
        // UPDATE
        const { error } = await supabase
          .from('ai_agent_knowledge')
          .update(productData)
          .eq('id', product.id);

        if (error) throw error;
        toast.success('Item atualizado com sucesso!');
      } else {
        // INSERT
        const { error } = await supabase
          .from('ai_agent_knowledge')
          .insert(productData);

        if (error) throw error;
        toast.success('Item adicionado à Base de Conhecimento!');
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast.error(error.message || 'Erro ao salvar item');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-white/10 backdrop-blur-xl border-white/20">
        <DialogHeader>
          <DialogTitle>
            {product ? `Editar ${formData.type === 'product' ? 'Produto' : 'Serviço'}` : 'Adicionar à Base de Conhecimento'}
          </DialogTitle>
          <DialogDescription>
            Preencha as informações do produto ou serviço para adicionar à base de conhecimento do agente.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Toggle Produto/Serviço */}
          <div>
            <Label>Tipo</Label>
            <div className="flex gap-2 mt-2">
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "flex-1 h-12 transition-all",
                  formData.type === 'product'
                    ? "bg-white/40 border-white/60 text-gray-900 font-semibold"
                    : "bg-white/10 border-white/30 text-gray-600 hover:bg-white/20"
                )}
                onClick={() => setFormData(prev => ({ ...prev, type: 'product' }))}
              >
                <Package className="h-4 w-4 mr-2" />
                Produto
              </Button>
              <Button
                type="button"
                variant="outline"
                className={cn(
                  "flex-1 h-12 transition-all",
                  formData.type === 'service'
                    ? "bg-white/40 border-white/60 text-gray-900 font-semibold"
                    : "bg-white/10 border-white/30 text-gray-600 hover:bg-white/20"
                )}
                onClick={() => setFormData(prev => ({ ...prev, type: 'service' }))}
              >
                <Briefcase className="h-4 w-4 mr-2" />
                Serviço
              </Button>
            </div>
            {formData.type === 'product' && (
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ Produtos precisam de imagem obrigatória
              </p>
            )}
            {formData.type === 'service' && (
              <p className="text-xs text-gray-500 mt-2">
                ℹ️ Serviços podem ter imagem opcional
              </p>
            )}
          </div>

          {/* Upload de Imagem */}
          <div>
            <Label>Imagem do Produto</Label>
            <div className="border-2 border-dashed border-white/30 rounded-xl p-4 mt-2 bg-white/10">
              {formData.image_url ? (
                <div className="relative">
                  <img
                    src={formData.image_url}
                    alt="Preview"
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute top-2 right-2"
                    onClick={() => setFormData(prev => ({ ...prev, image_url: '' }))}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="text-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleImageUpload(file);
                    }}
                    className="hidden"
                    id="image-upload"
                    disabled={uploading}
                  />
                  <label
                    htmlFor="image-upload"
                    className="cursor-pointer flex flex-col items-center"
                  >
                    {uploading ? (
                      <>
                        <Loader2 className="h-12 w-12 text-gray-400 animate-spin mb-2" />
                        <p className="text-sm text-gray-600">Enviando...</p>
                      </>
                    ) : (
                      <>
                        <ImagePlus className="h-12 w-12 text-gray-400 mb-2" />
                        <p className="text-sm text-gray-600">
                          Clique para adicionar imagem
                        </p>
                      </>
                    )}
                  </label>
                </div>
              )}
            </div>
          </div>

          {/* Nome */}
          <div>
            <Label htmlFor="name">Nome do {formData.type === 'product' ? 'Produto' : 'Serviço'} *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder={formData.type === 'product' ? 'Ex: iPhone 15 Pro' : 'Ex: Consultoria Jurídica'}
              className="mt-2"
            />
          </div>

          {/* Descrição */}
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder={
                formData.type === 'product'
                  ? 'Descreva o produto: características, especificações...'
                  : 'Descreva o serviço: o que está incluído, duração...'
              }
              className="min-h-[100px] mt-2"
            />
          </div>

          {/* Categoria */}
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Input
              id="category"
              value={formData.category}
              onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              placeholder={
                formData.type === 'product'
                  ? 'Ex: Eletrônicos, Roupas, Alimentos...'
                  : 'Ex: Consultoria, Manutenção, Assinatura...'
              }
              className="mt-2"
            />
          </div>

          {/* Preço e Moeda */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Preço *</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                placeholder="0.00"
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="currency">Moeda *</Label>
              <Select
                value={formData.currency}
                onValueChange={(value) => setFormData(prev => ({ ...prev, currency: value }))}
              >
                <SelectTrigger id="currency" className="mt-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CURRENCIES.map((curr) => (
                    <SelectItem key={curr.value} value={curr.value}>
                      {curr.label} ({curr.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={onClose} disabled={saving}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!formData.name.trim() || !formData.price || saving}
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              'Salvar'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
