
import { useState, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Users, Tag, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { BroadcastService } from "@/services/broadcast/broadcastService";

interface AudienceSelectorProps {
  data: any;
  onChange: (updates: any) => void;
  onValidChange: (valid: boolean) => void;
}

export const AudienceSelector = ({ data, onChange, onValidChange }: AudienceSelectorProps) => {
  const [tags, setTags] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [preview, setPreview] = useState({ leads: [], totalCount: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTags();
  }, []);

  useEffect(() => {
    const selectedTags = data.target?.config?.tag_ids || [];
    const isValid = selectedTags.length > 0;
    onValidChange(isValid);

    if (isValid) {
      updatePreview();
    }
  }, [data.target, onValidChange]);

  const loadTags = async () => {
    try {
      const tagsData = await BroadcastService.getTags();
      setTags(tagsData);
    } catch (error) {
      console.error('Error loading tags:', error);
    } finally {
      setLoading(false);
    }
  };

  const updatePreview = async () => {
    try {
      const previewData = await BroadcastService.getLeadsPreview(data.target);
      setPreview(previewData);
    } catch (error) {
      console.error('Error loading preview:', error);
      setPreview({ leads: [], totalCount: 0 });
    }
  };

  const handleTagToggle = (tagId: string, checked: boolean) => {
    const currentTagIds = data.target?.config?.tag_ids || [];
    const newTagIds = checked 
      ? [...currentTagIds, tagId]
      : currentTagIds.filter((id: string) => id !== tagId);

    onChange({
      target: {
        type: 'tags',
        config: {
          tag_ids: newTagIds
        }
      }
    });
  };

  const selectedTagIds = data.target?.config?.tag_ids || [];
  const filteredTags = tags.filter(tag => 
    tag.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-12 bg-muted rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Search Tags */}
      <div className="space-y-2">
        <Label>Buscar Etiquetas</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar etiquetas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Tags Selection */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Selecionar Etiquetas ({selectedTagIds.length} selecionadas)
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent>
          {filteredTags.length === 0 ? (
            <div className="text-center py-8">
              <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">Nenhuma etiqueta encontrada</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Tente ajustar sua busca' : 'Crie etiquetas primeiro para filtrar seus leads'}
              </p>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2">
              {filteredTags.map((tag) => (
                <div
                  key={tag.id}
                  className="flex items-center space-x-3 p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                >
                  <Checkbox
                    id={`tag-${tag.id}`}
                    checked={selectedTagIds.includes(tag.id)}
                    onCheckedChange={(checked) => handleTagToggle(tag.id, checked as boolean)}
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <Label
                        htmlFor={`tag-${tag.id}`}
                        className="font-medium cursor-pointer"
                      >
                        {tag.name}
                      </Label>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ModernCardContent>
      </ModernCard>

      {/* Selected Tags Preview */}
      {selectedTagIds.length > 0 && (
        <ModernCard>
          <ModernCardHeader>
            <ModernCardTitle>Etiquetas Selecionadas</ModernCardTitle>
          </ModernCardHeader>
          <ModernCardContent>
            <div className="flex flex-wrap gap-2">
              {selectedTagIds.map((tagId: string) => {
                const tag = tags.find(t => t.id === tagId);
                if (!tag) return null;
                
                return (
                  <Badge
                    key={tagId}
                    variant="secondary"
                    className="gap-2"
                    style={{ backgroundColor: `${tag.color}20`, color: tag.color }}
                  >
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: tag.color }}
                    />
                    {tag.name}
                  </Badge>
                );
              })}
            </div>
          </ModernCardContent>
        </ModernCard>
      )}

      {/* Audience Preview */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Preview do Público-Alvo
          </ModernCardTitle>
        </ModernCardHeader>
        <ModernCardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="text-lg px-4 py-2">
                {preview.totalCount} leads
              </Badge>
              <span className="text-muted-foreground">
                serão incluídos nesta campanha
              </span>
            </div>

            {preview.leads.length > 0 && (
              <div className="space-y-2">
                <Label className="text-sm">Exemplo de destinatários:</Label>
                <div className="bg-muted/50 p-4 rounded-lg max-h-40 overflow-y-auto">
                  {preview.leads.slice(0, 10).map((lead: any) => (
                    <div key={lead.id} className="flex justify-between py-2 border-b border-muted last:border-0">
                      <span className="font-medium">{lead.name || 'Sem nome'}</span>
                      <span className="text-muted-foreground">{lead.phone}</span>
                    </div>
                  ))}
                  {preview.totalCount > 10 && (
                    <div className="text-sm text-muted-foreground pt-2 text-center">
                      ... e mais {preview.totalCount - 10} leads
                    </div>
                  )}
                </div>
              </div>
            )}

            {preview.totalCount === 0 && selectedTagIds.length > 0 && (
              <div className="text-center py-4 text-muted-foreground">
                <Filter className="h-8 w-8 mx-auto mb-2" />
                <p>Nenhum lead encontrado com as etiquetas selecionadas</p>
              </div>
            )}
          </div>
        </ModernCardContent>
      </ModernCard>
    </div>
  );
};
