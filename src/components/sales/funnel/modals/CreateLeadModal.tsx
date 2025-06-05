
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { useLeadCreation, CreateLeadData } from "@/hooks/salesFunnel/useLeadCreation";
import { useTagDatabase } from "@/hooks/salesFunnel/useTagDatabase";
import { useCompanyData } from "@/hooks/useCompanyData";
import { formatPhoneDisplay, validatePhone } from "@/utils/phoneFormatter";
import { KanbanColumn } from "@/types/kanban";

const leadSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().min(1, "Telefone é obrigatório").refine(validatePhone, "Telefone inválido"),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  company: z.string().optional(),
  address: z.string().optional(),
  purchaseValue: z.number().optional(),
  kanbanStageId: z.string().min(1, "Etapa é obrigatória"),
  notes: z.string().optional()
});

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  stages: KanbanColumn[];
}

export const CreateLeadModal = ({ isOpen, onClose, stages }: CreateLeadModalProps) => {
  const { companyId } = useCompanyData();
  const { createLead, isLoading } = useLeadCreation();
  const { tags } = useTagDatabase(companyId);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const form = useForm<z.infer<typeof leadSchema>>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      company: "",
      address: "",
      purchaseValue: undefined,
      kanbanStageId: "",
      notes: ""
    }
  });

  const handleSubmit = async (data: z.infer<typeof leadSchema>) => {
    const leadData: CreateLeadData = {
      ...data,
      email: data.email || undefined,
      company: data.company || undefined,
      address: data.address || undefined,
      notes: data.notes || undefined,
      tags: selectedTags.length > 0 ? selectedTags : undefined
    };

    await createLead(leadData);
    onClose();
    form.reset();
    setSelectedTags([]);
  };

  const toggleTag = (tagId: string) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const removeTag = (tagId: string) => {
    setSelectedTags(prev => prev.filter(id => id !== tagId));
  };

  // Filtrar apenas etapas que não sejam "GANHO" ou "PERDIDO"
  const availableStages = stages.filter(stage => 
    stage.title !== "GANHO" && stage.title !== "PERDIDO"
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] bg-white/10 backdrop-blur-xl border border-white/20 max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-gray-800">
            Criar Novo Lead
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome completo" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        placeholder="(11) 99999-9999"
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value);
                          // Mostrar preview formatado
                          if (validatePhone(value)) {
                            console.log("Preview:", formatPhoneDisplay(value));
                          }
                        }}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input {...field} type="email" placeholder="email@exemplo.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="company"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Empresa</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Nome da empresa" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="address"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Endereço completo" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="purchaseValue"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor de Compra</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="kanbanStageId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Etapa Inicial *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma etapa" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {availableStages.map((stage) => (
                          <SelectItem key={stage.id} value={stage.id}>
                            <div className="flex items-center gap-2">
                              <div 
                                className="w-3 h-3 rounded-full"
                                style={{ backgroundColor: stage.color }}
                              />
                              {stage.title}
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Seleção de Tags */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Etiquetas</label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => {
                  const isSelected = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleTag(tag.id)}
                      className={`px-3 py-1 rounded-full text-sm transition-all ${
                        isSelected 
                          ? 'ring-2 ring-blue-500' 
                          : 'opacity-60 hover:opacity-100'
                      }`}
                      style={{ 
                        backgroundColor: tag.color, 
                        color: '#fff'
                      }}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
              
              {/* Tags Selecionadas */}
              {selectedTags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTags.map((tagId) => {
                    const tag = tags.find(t => t.id === tagId);
                    if (!tag) return null;
                    return (
                      <Badge 
                        key={tagId} 
                        style={{ backgroundColor: tag.color, color: '#fff' }}
                        className="flex items-center gap-1"
                      >
                        {tag.name}
                        <X 
                          className="w-3 h-3 cursor-pointer hover:bg-black/20 rounded"
                          onClick={() => removeTag(tagId)}
                        />
                      </Badge>
                    );
                  })}
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Observações sobre o lead" rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={isLoading}
                className="flex-1 bg-gradient-to-r from-ticlin to-ticlin-dark text-black"
              >
                {isLoading ? "Criando..." : "Criar Lead"}
              </Button>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
