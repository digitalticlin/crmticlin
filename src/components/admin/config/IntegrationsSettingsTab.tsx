
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Save, ServerCog } from "lucide-react";
import { EvolutionApiForm } from "./forms/EvolutionApiForm";
import { AiConfigForm } from "./forms/AiConfigForm";

interface IntegrationsSettingsTabProps {
  config: {
    apiUrl: string;
    webhookUrl: string;
    aiModel: string;
    aiBotLimit: string;
  };
  onConfigChange: (field: string, value: any) => void;
}

export function IntegrationsSettingsTab({ config, onConfigChange }: IntegrationsSettingsTabProps) {
  const integrationsForm = useForm({
    defaultValues: {
      apiUrl: config.apiUrl,
      webhookUrl: config.webhookUrl,
      aiModel: config.aiModel,
      aiBotLimit: config.aiBotLimit
    }
  });

  const handleSubmit = (data: any) => {
    console.log("Integrations form submitted:", data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <ServerCog className="h-5 w-5 mt-1" />
          <div>
            <CardTitle>Integrações</CardTitle>
            <CardDescription>
              Configure as integrações com serviços externos
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...integrationsForm}>
          <div className="border-b pb-6">
            <EvolutionApiForm form={integrationsForm} config={config} onConfigChange={onConfigChange} />
          </div>
          
          <div>
            <AiConfigForm form={integrationsForm} config={config} onConfigChange={onConfigChange} />
          </div>
        </Form>
      </CardContent>
      <CardFooter>
        <Button variant="outline" className="mr-auto">
          Testar Conexões
        </Button>
        <Button 
          className="bg-[#d3d800] hover:bg-[#b8bc00]"
          onClick={() => integrationsForm.handleSubmit(handleSubmit)()}
        >
          <Save className="h-4 w-4 mr-1" /> Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  );
}
