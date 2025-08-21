
import { useState, useEffect } from "react";
import { ModernCard, ModernCardContent, ModernCardHeader, ModernCardTitle } from "@/components/ui/modern-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Search, Tag, Users, Filter } from "lucide-react";

interface ModernTagSelectorProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

// Mock data - substituir por dados reais
const MOCK_TAGS = [
  { id: "interessado", name: "Interessado", count: 156, color: "bg-blue-500" },
  { id: "cliente", name: "Cliente", count: 89, color: "bg-green-500" },
  { id: "prospect", name: "Prospect", count: 234, color: "bg-yellow-500" },
  { id: "frio", name: "Lead Frio", count: 67, color: "bg-gray-500" },
  { id: "quente", name: "Lead Quente", count: 45, color: "bg-red-500" },
  { id: "vip", name: "VIP", count: 23, color: "bg-purple-500" },
  { id: "perdido", name: "Perdido", count: 78, color: "bg-orange-500" }
];

export function ModernTagSelector({ selectedTags, onTagsChange }: ModernTagSelectorProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredTags, setFilteredTags] = useState(MOCK_TAGS);

  useEffect(() => {
    const filtered = MOCK_TAGS.filter(tag =>
      tag.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTags(filtered);
  }, [searchTerm]);

  const handleTagToggle = (tagId: string) => {
    const isSelected = selectedTags.includes(tagId);
    if (isSelected) {
      onTagsChange(selectedTags.filter(id => id !== tagId));
    } else {
      onTagsChange([...selectedTags, tagId]);
    }
  };

  const selectAll = () => {
    onTagsChange(filteredTags.map(tag => tag.id));
  };

  const clearAll = () => {
    onTagsChange([]);
  };

  const getTotalRecipients = () => {
    if (selectedTags.length === 0) {
      return MOCK_TAGS.reduce((sum, tag) => sum + tag.count, 0);
    }
    
    return MOCK_TAGS
      .filter(tag => selectedTags.includes(tag.id))
      .reduce((sum, tag) => sum + tag.count, 0);
  };

  return (
    <div className="space-y-6">
      {/* Header com informações */}
      <ModernCard className="bg-gradient-to-r from-indigo-50/80 to-blue-50/80 backdrop-blur-sm border-indigo-200/50">
        <ModernCardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-indigo-100 flex items-center justify-center">
                <Users className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900">Público-alvo</h3>
                <p className="text-sm text-indigo-700">
                  {selectedTags.length === 0 
                    ? "Todos os leads serão incluídos" 
                    : `${selectedTags.length} etiqueta(s) selecionada(s)`
                  }
                </p>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-2xl font-bold text-indigo-900">
                {getTotalRecipients().toLocaleString()}
              </div>
              <div className="text-sm text-indigo-700">destinatários</div>
            </div>
          </div>
        </ModernCardContent>
      </ModernCard>

      {/* Seletor de etiquetas */}
      <ModernCard>
        <ModernCardHeader>
          <ModernCardTitle className="flex items-center gap-2">
            <Tag className="w-5 h-5" />
            Filtrar por Etiquetas
          </ModernCardTitle>
        </ModernCardHeader>

        <ModernCardContent className="space-y-4">
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar etiquetas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-white/50 border-white/20"
            />
          </div>

          {/* Controles */}
          <div className="flex justify-between">
            <Button variant="ghost" size="sm" onClick={selectAll}>
              Selecionar todas
            </Button>
            <Button variant="ghost" size="sm" onClick={clearAll}>
              Limpar seleção
            </Button>
          </div>

          {/* Lista de etiquetas */}
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {filteredTags.map((tag) => (
              <div key={tag.id} className="flex items-center justify-between p-3 bg-white/30 backdrop-blur-sm border border-white/20 rounded-lg hover:bg-white/40 transition-colors">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={tag.id}
                    checked={selectedTags.includes(tag.id)}
                    onCheckedChange={() => handleTagToggle(tag.id)}
                  />
                  <Label htmlFor={tag.id} className="flex items-center gap-2 cursor-pointer">
                    <div className={`w-3 h-3 rounded-full ${tag.color}`}></div>
                    <span className="font-medium">{tag.name}</span>
                  </Label>
                </div>
                
                <Badge variant="secondary" className="bg-gray-100 text-gray-600">
                  {tag.count.toLocaleString()}
                </Badge>
              </div>
            ))}
          </div>

          {filteredTags.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Filter className="w-8 h-8 mx-auto mb-2 text-gray-400" />
              <p>Nenhuma etiqueta encontrada</p>
            </div>
          )}
        </ModernCardContent>
      </ModernCard>

      {/* Selecionadas */}
      {selectedTags.length > 0 && (
        <ModernCard className="bg-gradient-to-r from-green-50/80 to-emerald-50/80 backdrop-blur-sm border-green-200/50">
          <ModernCardContent className="p-4">
            <h4 className="font-medium text-green-800 mb-3">Etiquetas selecionadas:</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tagId) => {
                const tag = MOCK_TAGS.find(t => t.id === tagId);
                return tag ? (
                  <Badge key={tagId} className="bg-green-100 text-green-800 border-green-300">
                    <div className={`w-2 h-2 rounded-full ${tag.color} mr-1`}></div>
                    {tag.name} ({tag.count})
                  </Badge>
                ) : null;
              })}
            </div>
          </ModernCardContent>
        </ModernCard>
      )}
    </div>
  );
}
