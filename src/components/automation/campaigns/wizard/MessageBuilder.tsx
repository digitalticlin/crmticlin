
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { MessageSquare, Image, Video, Mic, File, Plus, X, Split } from "lucide-react";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";

interface MessageBuilderProps {
  data: any;
  onChange: (updates: any) => void;
  onValidChange: (valid: boolean) => void;
}

const MEDIA_TYPES = [
  { value: 'text', label: 'Texto', icon: MessageSquare },
  { value: 'image', label: 'Imagem', icon: Image },
  { value: 'video', label: 'Vídeo', icon: Video },
  { value: 'audio', label: 'Áudio', icon: Mic },
  { value: 'document', label: 'Documento', icon: File },
];

export const MessageBuilder = ({ data, onChange, onValidChange }: MessageBuilderProps) => {
  const [useFragments, setUseFragments] = useState(false);
  const [fragments, setFragments] = useState<string[]>([data.message_text || '']);

  useEffect(() => {
    const isValid = data.name.trim() !== '' && 
                   (useFragments ? fragments.some(f => f.trim() !== '') : data.message_text.trim() !== '');
    onValidChange(isValid);
  }, [data.name, data.message_text, fragments, useFragments, onValidChange]);

  const handleNameChange = (name: string) => {
    onChange({ name });
  };

  const handleMessageChange = (message_text: string) => {
    onChange({ message_text });
  };

  const handleMediaTypeChange = (media_type: string) => {
    onChange({ media_type, media_url: '' });
  };

  const handleMediaUrlChange = (media_url: string) => {
    onChange({ media_url });
  };

  const handleFragmentToggle = (enabled: boolean) => {
    setUseFragments(enabled);
    if (enabled) {
      // Convert single message to fragments
      const initialFragments = data.message_text ? [data.message_text] : [''];
      setFragments(initialFragments);
      onChange({ message_fragments: initialFragments, message_text: '' });
    } else {
      // Convert fragments back to single message
      const singleMessage = fragments.join(' ');
      onChange({ message_fragments: [], message_text: singleMessage });
      setFragments(['']);
    }
  };

  const addFragment = () => {
    if (fragments.length < 5) {
      const newFragments = [...fragments, ''];
      setFragments(newFragments);
      onChange({ message_fragments: newFragments });
    }
  };

  const removeFragment = (index: number) => {
    if (fragments.length > 1) {
      const newFragments = fragments.filter((_, i) => i !== index);
      setFragments(newFragments);
      onChange({ message_fragments: newFragments });
    }
  };

  const updateFragment = (index: number, value: string) => {
    const newFragments = [...fragments];
    newFragments[index] = value;
    setFragments(newFragments);
    onChange({ message_fragments: newFragments });
  };

  const selectedMediaType = MEDIA_TYPES.find(type => type.value === data.media_type);

  return (
    <div className="space-y-6">
      {/* Campaign Name */}
      <div className="space-y-2">
        <Label htmlFor="campaign-name">Nome da Campanha *</Label>
        <Input
          id="campaign-name"
          placeholder="Ex: Promoção Black Friday 2024"
          value={data.name}
          onChange={(e) => handleNameChange(e.target.value)}
        />
      </div>

      {/* Media Type Selection */}
      <div className="space-y-3">
        <Label>Tipo de Mensagem</Label>
        <div className="grid grid-cols-5 gap-2">
          {MEDIA_TYPES.map((type) => (
            <Button
              key={type.value}
              variant={data.media_type === type.value ? "default" : "outline"}
              className="flex-col gap-2 h-20"
              onClick={() => handleMediaTypeChange(type.value)}
            >
              <type.icon className="h-5 w-5" />
              <span className="text-xs">{type.label}</span>
            </Button>
          ))}
        </div>
      </div>

      {/* Media URL for non-text types */}
      {data.media_type !== 'text' && (
        <div className="space-y-2">
          <Label htmlFor="media-url">
            URL da {selectedMediaType?.label} *
          </Label>
          <Input
            id="media-url"
            placeholder={`URL da ${selectedMediaType?.label?.toLowerCase()}`}
            value={data.media_url}
            onChange={(e) => handleMediaUrlChange(e.target.value)}
          />
          <p className="text-sm text-muted-foreground">
            Insira a URL pública do arquivo ou faça upload para um serviço de hospedagem
          </p>
        </div>
      )}

      {/* Message Fragmentation Toggle */}
      <ModernCard>
        <ModernCardHeader>
          <div className="flex items-center justify-between">
            <ModernCardTitle className="flex items-center gap-2">
              <Split className="h-5 w-5" />
              Fragmentar Mensagem
            </ModernCardTitle>
            <Switch
              checked={useFragments}
              onCheckedChange={handleFragmentToggle}
            />
          </div>
        </ModernCardHeader>
        <ModernCardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Divida sua mensagem em até 5 partes para envio sequencial. 
            Útil para mensagens longas ou para criar uma sequência narrativa.
          </p>

          {useFragments ? (
            <div className="space-y-4">
              {fragments.map((fragment, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label>Fragmento {index + 1}</Label>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline">{fragment.length}/500</Badge>
                      {fragments.length > 1 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFragment(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <Textarea
                    placeholder={`Digite o ${index + 1}º fragmento da mensagem...`}
                    value={fragment}
                    onChange={(e) => updateFragment(index, e.target.value)}
                    maxLength={500}
                    rows={3}
                  />
                </div>
              ))}

              {fragments.length < 5 && (
                <Button
                  variant="outline"
                  onClick={addFragment}
                  className="w-full gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Adicionar Fragmento ({fragments.length}/5)
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="message-text">Texto da Mensagem *</Label>
                <Badge variant="outline">{data.message_text.length}/1000</Badge>
              </div>
              <Textarea
                id="message-text"
                placeholder="Digite sua mensagem aqui..."
                value={data.message_text}
                onChange={(e) => handleMessageChange(e.target.value)}
                rows={6}
                maxLength={1000}
              />
            </div>
          )}
        </ModernCardContent>
      </ModernCard>

      {/* Preview */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle>Preview da Mensagem</ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            {data.media_type !== 'text' && data.media_url && (
              <div className="mb-2 text-sm text-green-700">
                📎 {selectedMediaType?.label}: {data.media_url}
              </div>
            )}
            
            {useFragments ? (
              <div className="space-y-2">
                {fragments.filter(f => f.trim()).map((fragment, index) => (
                  <div key={index} className="text-sm">
                    <Badge variant="secondary" className="mb-1">Msg {index + 1}</Badge>
                    <p>{fragment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm">{data.message_text || 'Sua mensagem aparecerá aqui...'}</p>
            )}
          </div>
        </ModernCardContent>
      </ModernCard>
    </div>
  );
};
