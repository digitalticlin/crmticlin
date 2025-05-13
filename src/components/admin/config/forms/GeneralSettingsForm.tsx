
import { UseFormReturn } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";

interface GeneralSettingsFormProps {
  form: UseFormReturn<any>;
  config: {
    systemName: string;
    maxInstances: string;
    maxUsers: string;
    logRetention: string;
    debugMode: boolean;
    maintenanceMode: boolean;
    termsText: string;
  };
  onConfigChange: (field: string, value: any) => void;
}

export function GeneralSettingsForm({ form, config, onConfigChange }: GeneralSettingsFormProps) {
  return (
    <div className="space-y-4">
      <div>
        <FormField
          control={form.control}
          name="systemName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome do Sistema</FormLabel>
              <FormControl>
                <Input 
                  placeholder="CRM Ticlin" 
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onConfigChange('systemName', e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Nome exibido em emails e notificações
              </FormDescription>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="maxInstances"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limite Máximo de Instâncias WhatsApp</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onConfigChange('maxInstances', e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Número máximo de instâncias WhatsApp permitidas no sistema
              </FormDescription>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="maxUsers"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Limite Máximo de Usuários</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onConfigChange('maxUsers', e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Número máximo de usuários permitidos no sistema
              </FormDescription>
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="logRetention"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Retenção de Logs (dias)</FormLabel>
              <FormControl>
                <Input 
                  type="number"
                  {...field}
                  onChange={(e) => {
                    field.onChange(e);
                    onConfigChange('logRetention', e.target.value);
                  }}
                />
              </FormControl>
              <FormDescription>
                Período de retenção dos logs do sistema (em dias)
              </FormDescription>
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="debugMode"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Modo de Depuração</FormLabel>
              <FormDescription>
                Ativa logs e informações detalhadas para debugging
              </FormDescription>
            </div>
            <FormControl>
              <Switch 
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  onConfigChange('debugMode', checked);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="maintenanceMode"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <FormLabel className="text-base">Modo de Manutenção</FormLabel>
              <FormDescription>
                Bloqueia o acesso de usuários não-administradores
              </FormDescription>
            </div>
            <FormControl>
              <Switch 
                checked={field.value}
                onCheckedChange={(checked) => {
                  field.onChange(checked);
                  onConfigChange('maintenanceMode', checked);
                }}
              />
            </FormControl>
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="termsText"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Termos de Uso e Política de Privacidade</FormLabel>
            <FormControl>
              <Textarea 
                {...field}
                className="min-h-[150px]"
                onChange={(e) => {
                  field.onChange(e);
                  onConfigChange('termsText', e.target.value);
                }}
              />
            </FormControl>
            <FormDescription>
              Texto exibido para os usuários durante o cadastro
            </FormDescription>
          </FormItem>
        )}
      />
    </div>
  );
}
