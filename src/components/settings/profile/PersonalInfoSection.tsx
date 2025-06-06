
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useProfileSettings } from "@/hooks/useProfileSettings";
import { Loader2 } from "lucide-react";

export const PersonalInfoSection = () => {
  const { profileData, loading, updateProfileData, saveProfile } = useProfileSettings();

  const handleSave = async () => {
    await saveProfile();
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Informações Pessoais</CardTitle>
          <CardDescription>Gerencie suas informações pessoais</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações Pessoais</CardTitle>
        <CardDescription>Gerencie suas informações pessoais</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fullName">Nome Completo</Label>
            <Input
              id="fullName"
              value={profileData.full_name}
              onChange={(e) => updateProfileData("full_name", e.target.value)}
              placeholder="Seu nome completo"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="document">CPF/CNPJ</Label>
            <Input
              id="document"
              value={profileData.document_id}
              onChange={(e) => updateProfileData("document_id", e.target.value)}
              placeholder="000.000.000-00"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="whatsapp">WhatsApp</Label>
            <Input
              id="whatsapp"
              value={profileData.whatsapp}
              onChange={(e) => updateProfileData("whatsapp", e.target.value)}
              placeholder="(11) 99999-9999"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="position">Cargo</Label>
            <Input
              id="position"
              value={profileData.position}
              onChange={(e) => updateProfileData("position", e.target.value)}
              placeholder="Seu cargo na empresa"
            />
          </div>
        </div>

        <div className="space-y-4 border-t pt-4">
          <h4 className="font-medium">Informações da Empresa</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                value={profileData.company_name}
                onChange={(e) => updateProfileData("company_name", e.target.value)}
                placeholder="Nome da sua empresa"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyDocument">CNPJ da Empresa</Label>
              <Input
                id="companyDocument"
                value={profileData.company_document}
                onChange={(e) => updateProfileData("company_document", e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={handleSave}>
            Salvar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
