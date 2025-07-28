
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Play, Pause, Download, Eye, FileText, Image, Video, Music } from 'lucide-react';

interface MediaDebugPanelProps {
  mediaData: any;
}

export const MediaDebugPanel: React.FC<MediaDebugPanelProps> = ({ mediaData }) => {
  const [isPlaying, setIsPlaying] = useState(false);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleDownload = () => {
    if (mediaData?.cached_url) {
      const link = document.createElement('a');
      link.href = mediaData.cached_url;
      link.download = mediaData.file_name || 'media';
      link.click();
    }
  };

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

  if (!mediaData) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-muted-foreground text-center">Nenhuma mídia selecionada</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {getMediaIcon(mediaData.media_type)}
          Debug de Mídia
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="preview">Preview</TabsTrigger>
            <TabsTrigger value="raw">Dados Raw</TabsTrigger>
          </TabsList>
          
          <TabsContent value="info" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium mb-2">Tipo</h4>
                <Badge variant="outline">{mediaData.media_type}</Badge>
              </div>
              <div>
                <h4 className="font-medium mb-2">Tamanho</h4>
                <p className="text-sm text-muted-foreground">
                  {mediaData.file_size ? `${(mediaData.file_size / 1024).toFixed(2)} KB` : 'N/A'}
                </p>
              </div>
              <div>
                <h4 className="font-medium mb-2">Nome do Arquivo</h4>
                <p className="text-sm text-muted-foreground">{mediaData.file_name || 'N/A'}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">URL Original</h4>
                <p className="text-sm text-muted-foreground truncate">
                  {mediaData.original_url || 'N/A'}
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              {mediaData.media_type === 'audio' && (
                <Button onClick={handlePlayPause} variant="outline" size="sm">
                  {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                </Button>
              )}
              <Button onClick={handleDownload} variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Download
              </Button>
            </div>
          </TabsContent>
          
          <TabsContent value="preview" className="space-y-4">
            <div className="border rounded-lg p-4 bg-muted/10">
              {mediaData.media_type === 'image' && mediaData.cached_url ? (
                <img 
                  src={mediaData.cached_url} 
                  alt="Preview" 
                  className="max-w-full max-h-64 object-contain mx-auto"
                />
              ) : mediaData.media_type === 'video' && mediaData.cached_url ? (
                <video 
                  src={mediaData.cached_url} 
                  controls 
                  className="max-w-full max-h-64 mx-auto"
                />
              ) : mediaData.media_type === 'audio' && mediaData.cached_url ? (
                <audio 
                  src={mediaData.cached_url} 
                  controls 
                  className="w-full"
                />
              ) : (
                <div className="text-center text-muted-foreground">
                  <Eye className="h-12 w-12 mx-auto mb-2" />
                  <p>Preview não disponível para este tipo de mídia</p>
                </div>
              )}
            </div>
          </TabsContent>
          
          <TabsContent value="raw" className="space-y-4">
            <div className="bg-muted/10 rounded-lg p-4">
              <pre className="text-xs overflow-auto">
                {JSON.stringify(mediaData, null, 2)}
              </pre>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
