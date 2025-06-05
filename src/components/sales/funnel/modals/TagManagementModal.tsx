
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Plus, Save, X } from "lucide-react";
import { useTagDatabase } from "@/hooks/salesFunnel/useTagDatabase";
import { useCompanyData } from "@/hooks/useCompanyData";
import { toast } from "sonner";

const tagSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(50, "Nome muito longo"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve ser um código hexadecimal válido")
});

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const TagManagementModal = ({ isOpen, onClose }: TagManagementModalProps) => {
  const { companyId } = useCompanyData();
  const { tags, createTag, updateTag, deleteTag, isLoading } = useTagDatabase(companyId);
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<z.infer<typeof tagSchema>>({
    resolver: zodResolver(tagSchema),
    defaultValues: {
      name: "",
      color: "#3b82f6"
    }
  });

  const handleCreateTag = async (data: z.infer<typeof tagSchema>) => {
    try {
      await createTag(data);
      form.reset();
      setIsCreating(false);
      toast.success("Tag criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar tag");
    }
  };

  const handleUpdateTag = async (tagId: string, data: z.infer<typeof tagSchema>) => {
    try {
      await updateTag(tagId, data);
      setEditingTag(null);
      toast.success("Tag atualizada com sucesso!");
    } catch (error) {
      toast.error("Erro ao atualizar tag");
    }
  };

  const handleDeleteTag = async (tagId: string) => {
    if (confirm("Tem certeza que deseja excluir esta tag?")) {
      try {
        await deleteTag(tagId);
        toast.success("Tag excluída com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir tag");
      }
    }
  };

  const startEditing = (tag: any) => {
    setEditingTag(tag.id);
    form.setValue("name", tag.name);
    form.setValue("color", tag.color);
  };

  const cancelEditing = () => {
    setEditingTag(null);
    form.reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white/10 backdrop-blur-xl border border-white/20">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Gerenciar Etiquetas
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Lista de Tags */}
          <div className="max-h-60 overflow-y-auto space-y-2">
            {tags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20">
                {editingTag === tag.id ? (
                  <Form {...form}>
                    <form 
                      onSubmit={form.handleSubmit((data) => handleUpdateTag(tag.id, data))}
                      className="flex items-center gap-2 flex-1"
                    >
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem className="flex-1">
                            <FormControl>
                              <Input {...field} className="h-8" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="color"
                        render={({ field }) => (
                          <FormItem>
                            <FormControl>
                              <input
                                type="color"
                                {...field}
                                className="w-8 h-8 rounded border border-white/20"
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <Button type="submit" size="sm" variant="ghost">
                        <Save className="w-4 h-4" />
                      </Button>
                      <Button type="button" size="sm" variant="ghost" onClick={cancelEditing}>
                        <X className="w-4 h-4" />
                      </Button>
                    </form>
                  </Form>
                ) : (
                  <>
                    <div className="flex items-center gap-2">
                      <Badge style={{ backgroundColor: tag.color, color: "#fff" }}>
                        {tag.name}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(tag)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDeleteTag(tag.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Criar Nova Tag */}
          {isCreating ? (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleCreateTag)} className="space-y-3">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome da Tag</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Digite o nome da tag" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="color"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Cor</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            {...field}
                            className="w-12 h-10 rounded border border-white/20"
                          />
                          <Input {...field} placeholder="#3b82f6" className="flex-1" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button type="submit" disabled={isLoading}>
                    <Save className="w-4 h-4 mr-2" />
                    Salvar
                  </Button>
                  <Button type="button" variant="outline" onClick={() => {
                    setIsCreating(false);
                    form.reset();
                  }}>
                    Cancelar
                  </Button>
                </div>
              </form>
            </Form>
          ) : (
            <Button
              onClick={() => setIsCreating(true)}
              className="w-full bg-gradient-to-r from-ticlin to-ticlin-dark text-black"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nova Etiqueta
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
