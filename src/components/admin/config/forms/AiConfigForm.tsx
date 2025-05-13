
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Bot } from "lucide-react";

interface AiConfigFormProps {
  form: UseFormReturn<any>;
  config: {
    aiModel: string;
    aiBotLimit: string;
  };
  onConfigChange: (field: string, value: any) => void;
}

export function AiConfigForm({ form, config, onConfigChange }: AiConfigFormProps) {
  return (
    <>
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <Bot className="h-5 w-5 mr-2" /> Configurações de IA
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="aiModel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Modelo de IA</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="gpt-4o"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onConfigChange('aiModel', e.target.value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Modelo utilizado para agentes de IA
                </FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="aiBotLimit"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Limite de Agentes IA</FormLabel>
                <FormControl>
                  <Input 
                    type="number"
                    placeholder="100"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onConfigChange('aiBotLimit', e.target.value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Limite máximo de agentes IA simultâneos no sistema
                </FormDescription>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-between items-center p-4 border rounded-lg bg-yellow-50 border-yellow-200">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2" />
            <span className="text-yellow-700">Aviso</span>
          </div>
          <span className="text-sm text-yellow-700">Alto uso de recursos (85% do limite)</span>
        </div>
      </div>
    </>
  );
}
