
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Edit2, Plus, Save, X, GripVertical, MoveUp, MoveDown } from "lucide-react";
import { useSalesFunnelContext } from "../SalesFunnelProvider";
import { Funnel } from "@/types/funnel";
import { toast } from "sonner";

const stageSchema = z.object({
  title: z.string().min(1, "Título é obrigatório").max(50, "Título muito longo"),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, "Cor deve ser um código hexadecimal válido")
});

interface FunnelConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FunnelConfigModal = ({ isOpen, onClose }: FunnelConfigModalProps) => {
  const {
    funnels,
    selectedFunnel,
    setSelectedFunnel,
    createFunnel,
    columns,
    addColumn,
    updateColumn,
    deleteColumn
  } = useSalesFunnelContext();
  
  const [editingStage, setEditingStage] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const form = useForm<z.infer<typeof stageSchema>>({
    resolver: zodResolver(stageSchema),
    defaultValues: {
      title: "",
      color: "#3b82f6"
    }
  });

  const handleCreateStage = async (data: z.infer<typeof stageSchema>) => {
    try {
      await addColumn(data.title, data.color);
      form.reset();
      setIsCreating(false);
      toast.success("Etapa criada com sucesso!");
    } catch (error) {
      toast.error("Erro ao criar etapa");
    }
  };

  const handleUpdateStage = async (stageId: string, data: z.infer<typeof stageSchema>) => {
    try {
      const stage = columns.find(col => col.id === stageId);
      if (stage) {
        await updateColumn({
          ...stage,
          title: data.title,
          color: data.color
        });
        setEditingStage(null);
        toast.success("Etapa atualizada com sucesso!");
      }
    } catch (error) {
      toast.error("Erro ao atualizar etapa");
    }
  };

  const handleDeleteStage = async (stageId: string) => {
    const stage = columns.find(col => col.id === stageId);
    if (!stage) return;

    if (stage.isFixed) {
      toast.error("Etapas fixas não podem ser excluídas");
      return;
    }

    if (stage.leads.length > 0) {
      toast.error("Não é possível excluir etapa com leads. Mova os leads primeiro.");
      return;
    }

    if (confirm("Tem certeza que deseja excluir esta etapa?")) {
      try {
        await deleteColumn(stageId);
        toast.success("Etapa excluída com sucesso!");
      } catch (error) {
        toast.error("Erro ao excluir etapa");
      }
    }
  };

  const startEditing = (stage: any) => {
    setEditingStage(stage.id);
    form.setValue("title", stage.title);
    form.setValue("color", stage.color || "#3b82f6");
  };

  const cancelEditing = () => {
    setEditingStage(null);
    form.reset();
  };

  const handleFunnelChange = (funnelId: string) => {
    const funnel = funnels.find(f => f.id === funnelId);
    if (funnel) {
      setSelectedFunnel(funnel);
    }
  };

  // Ordenar colunas por posição lógica (entrada primeiro, ganho/perdido por último)
  const sortedColumns = [...columns].sort((a, b) => {
    if (a.title === "ENTRADA DE LEAD") return -1;
    if (b.title === "ENTRADA DE LEAD") return 1;
    if (a.title === "GANHO") return 1;
    if (b.title === "GANHO") return -1;
    if (a.title === "PERDIDO") return 1;
    if (b.title === "PERDIDO") return -1;
    return 0;
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] bg-white/10 backdrop-blur-xl border border-white/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Configurar Funil
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Seleção de Funil */}
          <div>
            <label className="text-sm font-medium mb-2 block">Funil Atual</label>
            <Select value={selectedFunnel?.id} onValueChange={handleFunnelChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um funil" />
              </SelectTrigger>
              <SelectContent>
                {funnels.map((funnel) => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    {funnel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border-t border-white/20 pt-4">
            <h3 className="text-lg font-semibold mb-3">Etapas do Funil</h3>
            
            {/* Lista de Etapas */}
            <div className="max-h-80 overflow-y-auto space-y-2">
              {sortedColumns.map((column) => (
                <div key={column.id} className="flex items-center justify-between p-3 bg-white/10 rounded-lg border border-white/20">
                  {editingStage === column.id ? (
                    <Form {...form}>
                      <form 
                        onSubmit={form.handleSubmit((data) => handleUpdateStage(column.id, data))}
                        className="flex items-center gap-2 flex-1"
                      >
                        <FormField
                          control={form.control}
                          name="title"
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
                      <div className="flex items-center gap-3">
                        <GripVertical className="w-4 h-4 text-gray-400" />
                        <div 
                          className="w-4 h-4 rounded-full border border-white/20"
                          style={{ backgroundColor: column.color }}
                        />
                        <span className="font-medium">{column.title}</span>
                        {column.isFixed && (
                          <Badge variant="secondary" className="text-xs">
                            Fixo
                          </Badge>
                        )}
                        <span className="text-sm text-gray-500">
                          ({column.leads.length} leads)
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        {!column.isFixed && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(column)}
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteStage(column.id)}
                              className="text-red-500 hover:text-red-700"
                              disabled={column.leads.length > 0}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Criar Nova Etapa */}
            {isCreating ? (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(handleCreateStage)} className="space-y-3 mt-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Etapa</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Digite o nome da etapa" />
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
                    <Button type="submit">
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
                className="w-full mt-4 bg-gradient-to-r from-ticlin to-ticlin-dark text-black"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nova Etapa
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
