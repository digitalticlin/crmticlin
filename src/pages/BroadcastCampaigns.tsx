
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CreateCampaignForm } from '@/components/broadcast/CreateCampaignForm';
import { CampaignsList } from '@/components/broadcast/CampaignsList';
import { CampaignStats } from '@/components/broadcast/CampaignStats';
import { Radio, PlusCircle, BarChart3 } from 'lucide-react';

const BroadcastCampaigns = () => {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
            <Radio className="h-8 w-8 text-primary" />
            Disparos em Massa
          </h1>
          <p className="text-gray-600 mt-1">
            Crie e gerencie campanhas de mensagens para seus leads
          </p>
        </div>
      </div>

      <Tabs defaultValue="campaigns" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Radio className="h-4 w-4" />
            Campanhas
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <PlusCircle className="h-4 w-4" />
            Nova Campanha
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Estatísticas
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-4">
          <CampaignsList />
        </TabsContent>

        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Criar Nova Campanha</CardTitle>
              <CardDescription>
                Configure sua campanha de disparos em massa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CreateCampaignForm />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stats" className="space-y-4">
          <CampaignStats />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default BroadcastCampaigns;
