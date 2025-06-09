
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Building, MapPin, Phone, Mail } from "lucide-react";
import { toast } from "sonner";

const CompanySettings = () => {
  const [companyData, setCompanyData] = useState({
    name: "Minha Empresa",
    document: "12.345.678/0001-90",
    email: "contato@minhaempresa.com",
    phone: "(11) 99999-9999",
    address: "Rua das Empresas, 123",
    city: "São Paulo",
    state: "SP",
    zipCode: "01234-567",
    description: "Descrição da empresa..."
  });

  const handleSave = async () => {
    try {
      // Aqui seria a chamada para salvar no Supabase
      toast.success("Dados da empresa salvos com sucesso!");
    } catch (error) {
      console.error("Erro ao salvar dados da empresa:", error);
      toast.error("Não foi possível salvar os dados da empresa");
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCompanyData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card className="glass-card border-0">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Informações da Empresa
        </CardTitle>
        <CardDescription>
          Configure os dados da sua empresa
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Informações Básicas */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Dados Básicos</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                value={companyData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="Nome da empresa"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyDocument">CNPJ</Label>
              <Input
                id="companyDocument"
                value={companyData.document}
                onChange={(e) => handleInputChange('document', e.target.value)}
                placeholder="00.000.000/0000-00"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="companyDescription">Descrição</Label>
            <Textarea
              id="companyDescription"
              value={companyData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Descreva sua empresa..."
              rows={3}
            />
          </div>
        </div>

        <Separator />

        {/* Contato */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Phone className="h-4 w-4" />
            Contato
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="companyEmail">E-mail</Label>
              <Input
                id="companyEmail"
                type="email"
                value={companyData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="contato@empresa.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="companyPhone">Telefone</Label>
              <Input
                id="companyPhone"
                value={companyData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                placeholder="(11) 99999-9999"
              />
            </div>
          </div>
        </div>

        <Separator />

        {/* Endereço */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Endereço
          </h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyAddress">Endereço</Label>
              <Input
                id="companyAddress"
                value={companyData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Rua, Avenida, etc."
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="companyCity">Cidade</Label>
                <Input
                  id="companyCity"
                  value={companyData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="São Paulo"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyState">Estado</Label>
                <Input
                  id="companyState"
                  value={companyData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="SP"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="companyZipCode">CEP</Label>
                <Input
                  id="companyZipCode"
                  value={companyData.zipCode}
                  onChange={(e) => handleInputChange('zipCode', e.target.value)}
                  placeholder="00000-000"
                />
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <Button variant="outline">Cancelar</Button>
          <Button 
            className="bg-ticlin hover:bg-ticlin/90 text-black"
            onClick={handleSave}
          >
            Salvar Alterações
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanySettings;
