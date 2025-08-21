
import { useState } from "react";
import { ModernCard, ModernCardContent } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Upload, 
  Image, 
  Video, 
  Mic, 
  FileText, 
  X, 
  MessageSquare 
} from "lucide-react";
import { toast } from "sonner";

interface ModernMediaUploaderProps {
  onMediaSelect: (file: File | null, type: 'text' | 'image' | 'video' | 'audio' | 'document') => void;
  selectedFile?: File | null;
  mediaType: 'text' | 'image' | 'video' | 'audio' | 'document';
  message: string;
  onMessageChange: (message: string) => void;
}

export function ModernMediaUploader({ 
  onMediaSelect, 
  selectedFile, 
  mediaType,
  message,
  onMessageChange
}: ModernMediaUploaderProps) {
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 16MB.');
        return;
      }
      onMediaSelect(file, getFileType(file));
    }
  };

  const getFileType = (file: File): 'image' | 'video' | 'audio' | 'document' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.startsWith('audio/')) return 'audio';
    return 'document';
  };

  const getMediaIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-6 h-6" />;
      case 'video': return <Video className="w-6 h-6" />;
      case 'audio': return <Mic className="w-6 h-6" />;
      case 'document': return <FileText className="w-6 h-6" />;
      default: return <MessageSquare className="w-6 h-6" />;
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 16 * 1024 * 1024) {
        toast.error('Arquivo muito grande. Máximo 16MB.');
        return;
      }
      onMediaSelect(file, getFileType(file));
    }
  };

  const removeFile = () => {
    onMediaSelect(null, 'text');
  };

  return (
    <div className="space-y-6">
      {/* Text Message */}
      <ModernCard>
        <ModernCardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Mensagem de Texto
              </Label>
              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                Obrigatório
              </Badge>
            </div>
            
            <Textarea
              placeholder="Digite sua mensagem aqui..."
              value={message}
              onChange={(e) => onMessageChange(e.target.value)}
              className="min-h-[120px] bg-white/50 border-white/20 resize-none"
              maxLength={4096}
            />
            
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Mensagem principal que será enviada aos destinatários</span>
              <span>{message.length}/4096</span>
            </div>
          </div>
        </ModernCardContent>
      </ModernCard>

      {/* Media Upload */}
      <ModernCard>
        <ModernCardContent className="p-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                Mídia Adicional
              </Label>
              <Badge variant="outline" className="bg-gray-50 text-gray-600">
                Opcional
              </Badge>
            </div>

            {selectedFile ? (
              <div className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm border border-green-200/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getMediaIcon(mediaType)}
                    <div>
                      <p className="font-medium text-green-800">{selectedFile.name}</p>
                      <p className="text-sm text-green-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • {mediaType}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={`
                  border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
                  ${dragOver 
                    ? 'border-lime-400 bg-lime-50/50 backdrop-blur-sm' 
                    : 'border-white/30 hover:border-white/50 bg-white/10 hover:bg-white/20'
                  }
                `}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={(e) => { e.preventDefault(); setDragOver(false); }}
                onDrop={handleDrop}
                onClick={() => document.getElementById('media-upload')?.click()}
              >
                <div className="flex flex-col items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                    <Upload className="w-8 h-8 text-muted-foreground" />
                  </div>
                  
                  <div>
                    <p className="font-medium text-foreground mb-1">
                      Clique ou arraste um arquivo aqui
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Máximo 16MB • Imagens, vídeos, áudios e documentos
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {[
                      { icon: Image, label: 'Imagem' },
                      { icon: Video, label: 'Vídeo' },
                      { icon: Mic, label: 'Áudio' },
                      { icon: FileText, label: 'Documento' }
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex flex-col items-center gap-1">
                        <Icon className="w-5 h-5 text-muted-foreground" />
                        <span className="text-xs text-muted-foreground">{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <Input
                  id="media-upload"
                  type="file"
                  className="hidden"
                  onChange={handleFileSelect}
                  accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.txt"
                />
              </div>
            )}
          </div>
        </ModernCardContent>
      </ModernCard>
    </div>
  );
}
