
import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MediaConversionManager } from "@/components/admin/MediaConversionManager";
import { Database, Settings, Users, BarChart3 } from "lucide-react";

export default function Admin() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <Settings className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">Administração</h1>
          <p className="text-gray-600">Gerencie sistema e configurações</p>
        </div>
      </div>

      <Tabs defaultValue="media" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="media" className="flex items-center gap-2">
            <Database className="w-4 h-4" />
            Mídia
          </TabsTrigger>
          <TabsTrigger value="users" className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="analytics" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Analytics
          </TabsTrigger>
          <TabsTrigger value="system" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Sistema
          </TabsTrigger>
        </TabsList>

        <TabsContent value="media" className="mt-6">
          <MediaConversionManager />
        </TabsContent>

        <TabsContent value="users" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciamento de Usuários</CardTitle>
              <CardDescription>
                Gerencie usuários e permissões do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Analytics e Relatórios</CardTitle>
              <CardDescription>
                Visualize métricas e relatórios do sistema
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Configurações do Sistema</CardTitle>
              <CardDescription>
                Configurações gerais e avançadas
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-500">Funcionalidade em desenvolvimento...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
