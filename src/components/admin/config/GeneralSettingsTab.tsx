
import { useForm } from "react-hook-form";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { Save, Sliders } from "lucide-react";
import { GeneralSettingsForm } from "./forms/GeneralSettingsForm";

interface GeneralSettingsTabProps {
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

export function GeneralSettingsTab({ config, onConfigChange }: GeneralSettingsTabProps) {
  const generalForm = useForm({
    defaultValues: {
      systemName: config.systemName,
      maxInstances: config.maxInstances,
      maxUsers: config.maxUsers,
      logRetention: config.logRetention,
      debugMode: config.debugMode,
      maintenanceMode: config.maintenanceMode,
      termsText: config.termsText
    }
  });

  const handleSubmit = (data: any) => {
    console.log("Form submitted:", data);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start gap-4">
          <Sliders className="h-5 w-5 mt-1" />
          <div>
            <CardTitle>Configurações Gerais</CardTitle>
            <CardDescription>
              Configure os parâmetros básicos da plataforma
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Form {...generalForm}>
            <GeneralSettingsForm form={generalForm} config={config} onConfigChange={onConfigChange} />
          </Form>
        </div>
      </CardContent>
      <CardFooter>
        <Button 
          className="ml-auto bg-[#d3d800] hover:bg-[#b8bc00]"
          onClick={() => generalForm.handleSubmit(handleSubmit)()}
        >
          <Save className="h-4 w-4 mr-1" /> Salvar Configurações
        </Button>
      </CardFooter>
    </Card>
  );
}
