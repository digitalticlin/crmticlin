import { useState } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, Edit3, Check } from 'lucide-react';

interface SendMediaEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    messages: MessageText[];
    description?: string;
    mediaType?: 'image' | 'video';
    mediaUrl?: string;
    caption?: string;
  };
  onSave: (data: {
    label: string;
    messages: MessageText[];
    description: string;
    mediaType: 'image' | 'video';
    mediaUrl: string;
    caption: string;
  }) => void;
}

export function SendMediaEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: SendMediaEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Enviar Mídia');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [mediaType, setMediaType] = useState<'image' | 'video'>(initialData?.mediaType || 'image');
  const [mediaUrl, setMediaUrl] = useState(initialData?.mediaUrl || '');
  const [caption, setCaption] = useState(initialData?.caption || '');

  const handleSave = () => {
    setIsEditingLabel(false);

    const messages: MessageText[] = [
      {
        type: mediaType === 'image' ? 'image' : 'video',
        content: mediaUrl,
        delay: 0
      }
    ];

    onSave({
      label,
      description,
      messages,
      mediaType,
      mediaUrl,
      caption
    });

    onClose();
  };

  const isValid = () => {
    return mediaUrl.trim().length > 0 && isValidUrl(mediaUrl);
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 glass rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="overflow-y-auto max-h-[90vh] kanban-horizontal-scroll">
          {/* Header - Nome editável inline com ícone Image */}
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-600 shadow-lg shadow-pink-500/30">
                <Image className="h-6 w-6 text-white" />
              </div>

              {isEditingLabel ? (
                <div className="flex-1 flex items-center gap-2">
                  <Input
                    value={label}
                    onChange={(e) => setLabel(e.target.value)}
                    className="text-xl font-bold bg-white/30 border-white/40"
                    autoFocus
                    onBlur={() => setIsEditingLabel(false)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') setIsEditingLabel(false);
                    }}
                  />
                </div>
              ) : (
                <div className="flex-1 flex items-center gap-2">
                  <h2 className="text-xl font-bold text-gray-900">{label}</h2>
                  <button
                    onClick={() => setIsEditingLabel(true)}
                    className="p-1.5 hover:bg-white/30 rounded-lg transition-colors"
                  >
                    <Edit3 className="h-4 w-4 text-gray-500" />
                  </button>
                </div>
              )}
            </div>

            <p className="text-sm text-gray-600 mt-2 ml-[60px]">
              Compartilhe uma imagem ou vídeo
            </p>
          </div>

          {/* Conteúdo */}
          <div className="px-8 pb-8 space-y-6">
            {/* Descrição da etapa */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                O que deve acontecer nesta etapa?
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Enviar foto do produto para o cliente"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            {/* Tipo de Mídia */}
            <div className="space-y-2">
              <Label htmlFor="mediaType" className="text-sm font-medium text-gray-700">
                Tipo de Mídia
              </Label>
              <Select value={mediaType} onValueChange={(value: 'image' | 'video') => setMediaType(value)}>
                <SelectTrigger className="bg-white/30 border-white/40">
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">📷 Imagem</SelectItem>
                  <SelectItem value="video">🎥 Vídeo</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* URL da Mídia */}
            <div className="space-y-2">
              <Label htmlFor="mediaUrl" className="text-sm font-medium text-gray-700">
                URL da {mediaType === 'image' ? 'Imagem' : 'Vídeo'}
              </Label>
              <Input
                id="mediaUrl"
                value={mediaUrl}
                onChange={(e) => setMediaUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 font-mono text-sm"
                type="url"
              />
              {mediaUrl && !isValidUrl(mediaUrl) && (
                <p className="text-xs text-red-600">
                  ⚠️ URL inválida. Use o formato completo: https://...
                </p>
              )}
              {mediaUrl && isValidUrl(mediaUrl) && (
                <p className="text-xs text-green-600">
                  ✅ URL válida
                </p>
              )}
            </div>

            {/* Legenda */}
            <div className="space-y-2">
              <Label htmlFor="caption" className="text-sm font-medium text-gray-700">
                Legenda (opcional)
              </Label>
              <Textarea
                id="caption"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Ex: Olha que produto incrível! O que achou?"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
              <p className="text-xs text-gray-500">
                Texto que acompanha a mídia
              </p>
            </div>

            {/* Botões minimalistas */}
            <div className="flex justify-end gap-3 pt-6 border-t border-white/40">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white/30 hover:bg-white/40 border border-white/40 rounded-full text-sm font-medium text-gray-700 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                
                className="px-6 py-2.5 bg-gradient-to-br from-pink-500 to-rose-600 hover:from-pink-600 hover:to-rose-700 text-white rounded-full text-sm font-medium shadow-lg shadow-pink-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Salvar
              </button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
