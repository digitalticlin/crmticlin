
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { ModernPageHeader } from '@/components/layout/ModernPageHeader';
import { PageLayout } from '@/components/layout/PageLayout';
import { useWhatsAppDatabase } from '@/hooks/whatsapp/useWhatsAppDatabase';
import { MediaDebugPanel } from '@/components/debug/MediaDebugPanel';
import { supabase } from '@/integrations/supabase/client';
import { 
  Image, 
  Video, 
  Music, 
  FileText, 
  Download, 
  Search,
  Activity,
  Database,
  Wifi,
  AlertCircle
} from 'lucide-react';

export default function MediaDebug() {
  const [mediaMessages, setMediaMessages] = useState<any[]>([]);
  const [selectedMedia, setSelectedMedia] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [filter, setFilter] = useState('all');
  
  const { instances, getActiveInstance } = useWhatsAppDatabase();
  const activeInstance = getActiveInstance();

  const loadMediaMessages = async () => {
    if (!activeInstance) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          media_cache (
            id,
            base64_data,
            original_url,
            cached_url,
            file_size,
            media_type,
            file_name
          )
        `)
        .eq('whatsapp_number_id', activeInstance.id)
        .not('media_type', 'eq', 'text')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Erro ao carregar mensagens de mídia:', error);
        return;
      }

      setMediaMessages(data || []);
    } catch (error) {
      console.error('Erro ao carregar mensagens:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMediaMessages();
  }, [activeInstance]);

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image':
        return <Image className="h-4 w-4" />;
      case 'video':
        return <Video className="h-4 w-4" />;
      case 'audio':
        return <Music className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const filteredMessages = mediaMessages.filter(msg => {
    const matchesSearch = msg.text?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         msg.media_cache?.file_name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filter === 'all' || msg.media_type === filter;
    return matchesSearch && matchesFilter;
  });

  const getInstanceStats = () => {
    if (!activeInstance) return { name: 'N/A', status: 'N/A', phone: 'N/A' };
    
    return {
      name: activeInstance.instance_name || 'N/A',
      status: activeInstance.connection_status || 'N/A',
      phone: activeInstance.phone || 'N/A'
    };
  };

  const stats = getInstanceStats();

  return (
    <PageLayout>
      <ModernPageHeader
        title="Debug de Mídia WhatsApp"
        description="Ferramenta para debug e análise de mídias do WhatsApp"
      />
      
      <div className="space-y-6">
        {/* Status da Instância */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Status da Instância
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Nome da Instância</Label>
                <p className="text-sm">{stats.name}</p>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Status</Label>
                <Badge variant={stats.status === 'connected' ? 'default' : 'destructive'}>
                  {stats.status}
                </Badge>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Telefone</Label>
                <p className="text-sm">{stats.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Lista de Mensagens */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                Mensagens com Mídia
              </CardTitle>
              <div className="flex gap-2">
                <Input
                  placeholder="Pesquisar mensagens..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={loadMediaMessages} disabled={isLoading}>
                  {isLoading ? <Wifi className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="image">Imagens</TabsTrigger>
                  <TabsTrigger value="video">Vídeos</TabsTrigger>
                  <TabsTrigger value="audio">Áudios</TabsTrigger>
                </TabsList>
                
                <TabsContent value={filter} className="mt-4">
                  <ScrollArea className="h-[400px]">
                    {filteredMessages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
                        <p>Nenhuma mensagem encontrada</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                              selectedMedia?.id === msg.id ? 'bg-muted' : 'hover:bg-muted/50'
                            }`}
                            onClick={() => setSelectedMedia(msg)}
                          >
                            <div className="flex items-center gap-3">
                              {getMediaIcon(msg.media_type)}
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate">
                                  {msg.media_cache?.file_name || 'Arquivo sem nome'}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {msg.media_type} • {new Date(msg.created_at).toLocaleString('pt-BR')}
                                </p>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {msg.media_cache?.file_size ? 
                                  `${(msg.media_cache.file_size / 1024).toFixed(1)}KB` : 
                                  'N/A'
                                }
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Painel de Debug */}
          <MediaDebugPanel mediaData={selectedMedia?.media_cache} />
        </div>
      </div>
    </PageLayout>
  );
}
