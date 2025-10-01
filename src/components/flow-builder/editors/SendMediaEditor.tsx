import { useState } from 'react';
import { MessageText } from '@/types/flowBuilder';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Image, Video } from 'lucide-react';

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
  const [description, setDescription] = useState(initialData?.description || '');
  const [mediaType, setMediaType] = useState<'image' | 'video'>(initialData?.mediaType || 'image');
  const [mediaUrl, setMediaUrl] = useState(initialData?.mediaUrl || '');
  const [caption, setCaption] = useState(initialData?.caption || '');

  const handleSave = () => {
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
    return mediaUrl.trim().length > 0;
  };

  const isValidUrl = (url: string) => {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getMediaIcon = () => {
    return mediaType === 'image' ? <Image className="h-6 w-6 text-white" /> : <Video className="h-6 w-6 text-white" />;
  };

  const getGradient = () => {
    return mediaType === 'image'
      ? 'from-pink-500 to-rose-600'
      : 'from-purple-500 to-violet-600';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-white to-pink-50">
        <DialogHeader className="border-b pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl bg-gradient-to-br ${getGradient()} shadow-lg`}>
              {getMediaIcon()}
            </div>
            <div>
              <DialogTitle className="text-2xl font-bold text-gray-900">
                Enviar Mídia
              </DialogTitle>
              <p className="text-sm text-gray-500 mt-1">
                Compartilhe uma foto ou vídeo com o cliente
              </p>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-6">
          {/* Nome do passo */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <Label htmlFor="label" className="text-base font-semibold text-gray-700">
              📝 Como você quer chamar este passo?
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Mostrar produto, Enviar tutorial em vídeo..."
              className="text-base"
            />
            <p className="text-xs text-gray-500">
              💡 Nome interno para você se organizar
            </p>
          </div>

          {/* Descrição da etapa */}
          <div className="space-y-2 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
            <Label htmlFor="description" className="text-base font-semibold text-gray-700">
              📋 O que deve acontecer nesta etapa?
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Nesta etapa você irá enviar uma foto do produto para o cliente visualizar os detalhes."
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 A IA usará isso como contexto para executar melhor
            </p>
          </div>

          {/* Tipo de Mídia */}
          <div className="space-y-3 bg-gradient-to-r from-pink-50 to-purple-50 p-5 rounded-xl border-2 border-pink-200">
            <Label htmlFor="mediaType" className="text-base font-semibold text-gray-800">
              🎬 Tipo de Mídia
            </Label>
            <Select value={mediaType} onValueChange={(value: 'image' | 'video') => setMediaType(value)}>
              <SelectTrigger className="bg-white text-base">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">📷 Imagem (Foto)</SelectItem>
                <SelectItem value="video">🎥 Vídeo</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-pink-700">
              {mediaType === 'image' ? '📷 Enviará uma imagem' : '🎥 Enviará um vídeo'}
            </p>
          </div>

          {/* URL da Mídia */}
          <div className="space-y-2 bg-white p-4 rounded-xl border-2 border-purple-200 shadow-sm">
            <Label htmlFor="mediaUrl" className="text-base font-semibold text-gray-700">
              🔗 URL da {mediaType === 'image' ? 'Imagem' : 'Vídeo'}
            </Label>
            <Input
              id="mediaUrl"
              value={mediaUrl}
              onChange={(e) => setMediaUrl(e.target.value)}
              placeholder={mediaType === 'image'
                ? 'https://exemplo.com/imagem.jpg'
                : 'https://exemplo.com/video.mp4'}
              className="text-base font-mono"
              type="url"
            />
            {mediaUrl && !isValidUrl(mediaUrl) && (
              <p className="text-xs text-red-600 flex items-center gap-1">
                ⚠️ URL inválida. Use o formato completo: https://...
              </p>
            )}
            {mediaUrl && isValidUrl(mediaUrl) && (
              <p className="text-xs text-green-600 flex items-center gap-1">
                ✅ URL válida
              </p>
            )}
            <div className="bg-blue-50 p-3 rounded-lg mt-2">
              <p className="text-xs text-blue-800">
                💡 Formatos aceitos:
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {mediaType === 'image'
                  ? '• Imagens: JPG, PNG, GIF, WEBP'
                  : '• Vídeos: MP4, MOV, AVI, WEBM'}
              </p>
            </div>
          </div>

          {/* Legenda */}
          <div className="space-y-3 bg-white p-6 rounded-xl border-2 border-pink-200 shadow-sm">
            <Label htmlFor="caption" className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">💬</span>
              Legenda (opcional)
            </Label>
            <Textarea
              id="caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder={mediaType === 'image'
                ? 'Ex: Olha que lindo nosso novo produto! O que achou? 😍'
                : 'Ex: Preparei esse vídeo especial mostrando como funciona! Assista até o final 🎬'}
              rows={3}
              className="resize-none text-base"
            />
            <p className="text-xs text-gray-500">
              💡 Texto que acompanhará a {mediaType === 'image' ? 'imagem' : 'vídeo'}
            </p>
          </div>

          {/* Preview */}
          <div className="space-y-3 bg-gradient-to-br from-pink-50 to-purple-50 p-6 rounded-xl border-2 border-pink-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2">
              <span className="text-2xl">📱</span>
              Como o cliente vai ver
            </Label>
            <div className="bg-white p-4 rounded-2xl shadow-md border border-gray-200">
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getGradient()} flex items-center justify-center shadow-md flex-shrink-0`}>
                  <span className="text-white text-xl">🤖</span>
                </div>
                <div className="flex-1 space-y-2">
                  {/* Mídia Preview */}
                  <div className="bg-gray-100 rounded-xl overflow-hidden">
                    {mediaType === 'image' ? (
                      <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-pink-100 to-rose-100">
                        <div className="text-center p-6">
                          <Image className="h-16 w-16 text-pink-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600">
                            {mediaUrl ? 'Imagem será carregada aqui' : 'Adicione uma URL de imagem'}
                          </p>
                          {mediaUrl && isValidUrl(mediaUrl) && (
                            <p className="text-xs text-gray-500 mt-2 truncate max-w-xs mx-auto">
                              {mediaUrl}
                            </p>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="aspect-video flex items-center justify-center bg-gradient-to-br from-purple-100 to-violet-100">
                        <div className="text-center p-6">
                          <Video className="h-16 w-16 text-purple-400 mx-auto mb-3" />
                          <p className="text-sm text-gray-600">
                            {mediaUrl ? 'Vídeo será carregado aqui' : 'Adicione uma URL de vídeo'}
                          </p>
                          {mediaUrl && isValidUrl(mediaUrl) && (
                            <p className="text-xs text-gray-500 mt-2 truncate max-w-xs mx-auto">
                              {mediaUrl}
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                  {/* Legenda */}
                  {caption && (
                    <div className="bg-pink-50 p-3 rounded-xl">
                      <p className="text-sm text-gray-800 whitespace-pre-wrap">{caption}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Dicas */}
          <div className="bg-gradient-to-br from-yellow-50 to-amber-50 p-5 rounded-xl border-2 border-yellow-300">
            <Label className="text-base font-semibold text-gray-800 flex items-center gap-2 mb-3">
              <span className="text-2xl">💡</span>
              Dicas para enviar mídia
            </Label>
            <div className="space-y-2 text-sm text-gray-700">
              <p><strong>Imagens:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Use imagens de alta qualidade</li>
                <li>• Tamanho recomendado: até 5MB</li>
                <li>• Evite textos muito pequenos</li>
              </ul>
              <p className="mt-3"><strong>Vídeos:</strong></p>
              <ul className="ml-4 space-y-1">
                <li>• Mantenha vídeos curtos (até 3 minutos)</li>
                <li>• Tamanho recomendado: até 16MB</li>
                <li>• Adicione legenda para explicar o conteúdo</li>
              </ul>
            </div>
          </div>

          {/* JSON Preview */}
          <details className="text-xs bg-gray-50 p-4 rounded-lg border border-gray-200">
            <summary className="cursor-pointer text-gray-600 hover:text-gray-800 font-medium flex items-center gap-2">
              <span>🔧</span>
              <span>Ver estrutura técnica (JSON)</span>
            </summary>
            <pre className="mt-3 p-4 bg-white rounded-lg overflow-auto text-xs border border-gray-200 shadow-inner">
              {JSON.stringify(
                {
                  tipo: 'send_media',
                  descricao: description,
                  midia: {
                    tipo: mediaType,
                    url: mediaUrl,
                    legenda: caption || undefined
                  },
                  decisoes: [
                    {
                      condicao: 'Sempre',
                      proximoPasso: 'PRÓXIMO'
                    }
                  ]
                },
                null,
                2
              )}
            </pre>
          </details>
        </div>

        <DialogFooter className="border-t pt-4 gap-3">
          <Button variant="outline" onClick={onClose} className="flex-1">
            ❌ Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isValid() || !isValidUrl(mediaUrl)}
            className={`flex-1 bg-gradient-to-r ${getGradient()} hover:opacity-90 text-white font-semibold disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            ✅ Salvar Mídia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
