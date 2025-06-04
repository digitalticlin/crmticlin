
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Save, Bot } from "lucide-react";
import { AiConfigForm } from "./forms/AiConfigForm";

interface IntegrationsSettingsTabProps {
  config: {
    aiModel: string;
    aiBotLimit: string;
  };
  onConfigChange: (field: string, value: any) => void;
}

export function IntegrationsSettingsTab({ config, onConfigChange }: IntegrationsSettingsTabProps) {
  const integrationsForm = useForm({
    defaultValues: {
      aiModel: config.aiModel,
      aiBotLimit: config.aiBotLimit
    }
  });

  const handleSubmit = (data: any) => {
    console.log("AI config form submitted:", data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Bot className="h-5 w-5 mt-1" />
          <div>
            <CardTitle>Configurações de IA</CardTitle>
            <CardDescription>
              Configure as configurações dos agentes de IA
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Form {...integrationsForm}>
          <AiConfigForm form={integrationsForm} config={config} onConfigChange={onConfigChange} />
        </Form>
      </CardContent>
      <CardFooter>
        <Button 
          className="bg-[#d3d800] hover:bg-[#b8bc00] ml-auto"
          onClick={() => integrationsForm.handleSubmit(handleSubmit)()}
        >
          <Save className="h-4 w-4 mr-1" /> Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  );
}
