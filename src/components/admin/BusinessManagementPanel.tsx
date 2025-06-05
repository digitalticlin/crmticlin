
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Building2, 
  Users, 
  Search, 
  Plus, 
  MoreHorizontal,
  Mail,
  Phone,
  Calendar,
  CheckCircle,
  Clock
} from "lucide-react";
import CompaniesPanel from "@/components/admin/CompaniesPanel";
import UsersPanel from "@/components/admin/UsersPanel";

export const BusinessManagementPanel = () => {
  const [searchTerm, setSearchTerm] = useState('');

  const businessStats = [
    {
      title: "Empresas Ativas",
      value: "42",
      change: "+3 este mês",
      icon: Building2,
      color: "text-blue-600",
      bgColor: "bg-blue-50"
    },
    {
      title: "Usuários Totais", 
      value: "156",
      change: "+12 esta semana",
      icon: Users,
      color: "text-green-600",
      bgColor: "bg-green-50"
    },
    {
      title: "Contas Premium",
      value: "28",
      change: "66% do total",
      icon: CheckCircle,
      color: "text-purple-600", 
      bgColor: "bg-purple-50"
    },
    {
      title: "Pendências",
      value: "5",
      change: "Requer atenção",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gestão de Negócios</h1>
          <p className="text-gray-600 mt-1">
            Administração de empresas, usuários e relacionamentos comerciais
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="gap-2">
            <Plus className="w-4 h-4" />
            Nova Empresa
          </Button>
          <Button className="gap-2">
            <Plus className="w-4 h-4" />
            Novo Usuário
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {businessStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title}>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg ${stat.bgColor} flex items-center justify-center`}>
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                    <p className="text-sm text-gray-600">{stat.title}</p>
                    <p className="text-xs text-gray-500 mt-1">{stat.change}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Gerenciamento
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Buscar empresas ou usuários..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-80"
                />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="companies" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="companies" className="gap-2">
                <Building2 className="w-4 h-4" />
                Empresas
              </TabsTrigger>
              <TabsTrigger value="users" className="gap-2">
                <Users className="w-4 h-4" />
                Usuários
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="companies" className="space-y-4">
              <CompaniesPanel />
            </TabsContent>
            
            <TabsContent value="users" className="space-y-4">
              <UsersPanel />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
