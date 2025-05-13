
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Database } from "lucide-react";

interface EvolutionApiFormProps {
  form: UseFormReturn<any>;
  config: {
    apiUrl: string;
    webhookUrl: string;
  };
  onConfigChange: (field: string, value: any) => void;
}

export function EvolutionApiForm({ form, config, onConfigChange }: EvolutionApiFormProps) {
  return (
    <>
      <h3 className="text-lg font-medium mb-4 flex items-center">
        <Database className="h-5 w-5 mr-2" /> Integração Evolution API
      </h3>
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="apiUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL da API</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://api.evolution.com"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onConfigChange('apiUrl', e.target.value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  Endereço da Evolution API para comunicação
                </FormDescription>
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="webhookUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>URL do Webhook</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="https://ticlin.com.br/api/webhook/evolution"
                    {...field}
                    onChange={(e) => {
                      field.onChange(e);
                      onConfigChange('webhookUrl', e.target.value);
                    }}
                  />
                </FormControl>
                <FormDescription>
                  URL para recebimento de eventos da Evolution API
                </FormDescription>
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-between items-center p-4 border rounded-lg">
          <div className="flex items-center">
            <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
            <span>Status da Integração</span>
          </div>
          <span className="text-sm text-green-600">Conectado e Operacional</span>
        </div>
      </div>
    </>
  );
}
