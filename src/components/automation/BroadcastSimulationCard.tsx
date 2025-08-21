
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Play, Clock, Users, MessageCircle, FileText, Image, Video, Mic } from 'lucide-react';
import { toast } from 'sonner';

interface BroadcastSimulationCardProps {
  id: string;
  name: string;
  message: string;
  mediaType?: 'text' | 'image' | 'video' | 'audio' | 'document';
  fragments: number;
  targetCount: number;
  instanceName?: string;
}

export const BroadcastSimulationCard: React.FC<BroadcastSimulationCardProps> = ({
  id,
  name,
  message,
  mediaType = 'text',
  fragments,
  targetCount,
  instanceName
}) => {
  const handleSimulate = () => {
    toast.success(`Simulação iniciada para "${name}"`, {
      description: `${targetCount} destinatários simulados com ${fragments} fragmento(s)`
    });
  };

  const getMediaIcon = () => {
    switch (mediaType) {
      case 'image':
        return <Image className="w-4 h-4" />;
      case 'video':
        return <Video className="w-4 h-4" />;
      case 'audio':
        return <Mic className="w-4 h-4" />;
      case 'document':
        return <FileText className="w-4 h-4" />;
      default:
        return <MessageCircle className="w-4 h-4" />;
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-medium">{name}</CardTitle>
          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
            Simulação
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Message Preview */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            {getMediaIcon()}
            <span className="text-sm font-medium capitalize">{mediaType}</span>
            {fragments > 1 && (
              <Badge variant="secondary" className="text-xs">
                {fragments} partes
              </Badge>
            )}
          </div>
          <p className="text-sm text-gray-700 line-clamp-2">{message}</p>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">{targetCount} destinatários</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-gray-500" />
            <span className="text-sm text-gray-600">Imediato</span>
          </div>
        </div>

        {instanceName && (
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>{instanceName}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-2">
          <Button onClick={handleSimulate} size="sm" className="flex-1">
            <Play className="w-4 h-4 mr-2" />
            Simular Disparo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
