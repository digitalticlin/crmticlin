
import React, { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { BroadcastService } from '@/services/broadcast/broadcastService';
import { Users, Filter, Target, Tag } from 'lucide-react';

interface TargetAudienceSelectorProps {
  onTargetChange: (target: any) => void;
}

export const TargetAudienceSelector: React.FC<TargetAudienceSelectorProps> = ({ onTargetChange }) => {
  const [targetType, setTargetType] = useState<'all' | 'funnel' | 'stage' | 'tags' | 'custom'>('all');
  const [funnels, setFunnels] = useState<any[]>([]);
  const [stages, setStages] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedFunnel, setSelectedFunnel] = useState('');
  const [selectedStage, setSelectedStage] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [phoneNumbers, setPhoneNumbers] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedFunnel) {
      loadStages(selectedFunnel);
    }
  }, [selectedFunnel]);

  useEffect(() => {
    // Emit change whenever target changes
    let config = {};
    
    switch (targetType) {
      case 'funnel':
        config = { funnel_id: selectedFunnel };
        break;
      case 'stage':
        config = { stage_id: selectedStage };
        break;
      case 'tags':
        config = { tag_ids: selectedTags };
        break;
      case 'custom':
        config = { phone_numbers: phoneNumbers.split('\n').filter(p => p.trim()) };
        break;
    }
    
    onTargetChange({ type: targetType, config });
  }, [targetType, selectedFunnel, selectedStage, selectedTags, phoneNumbers, onTargetChange]);

  const loadData = async () => {
    try {
      const [funnelsData, tagsData] = await Promise.all([
        BroadcastService.getFunnels(),
        BroadcastService.getTags()
      ]);
      setFunnels(funnelsData);
      setTags(tagsData);
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    }
  };

  const loadStages = async (funnelId: string) => {
    try {
      const stagesData = await BroadcastService.getStagesByFunnel(funnelId);
      setStages(stagesData);
      setSelectedStage(''); // Reset stage selection
    } catch (error) {
      console.error('Erro ao carregar etapas:', error);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="target_type">Selecionar Público</Label>
        <Select 
          value={targetType}
          onValueChange={(value: any) => {
            setTargetType(value);
            // Reset selections when changing type
            setSelectedFunnel('');
            setSelectedStage('');
            setSelectedTags([]);
            setPhoneNumbers('');
          }}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Todos os Leads
              </div>
            </SelectItem>
            <SelectItem value="funnel">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Por Funil
              </div>
            </SelectItem>
            <SelectItem value="stage">
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Por Etapa
              </div>
            </SelectItem>
            <SelectItem value="tags">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4" />
                Por Tags
              </div>
            </SelectItem>
            <SelectItem value="custom">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4" />
                Lista Personalizada
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {targetType === 'funnel' && (
        <div>
          <Label htmlFor="funnel">Selecionar Funil</Label>
          <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
            <SelectTrigger>
              <SelectValue placeholder="Escolha um funil..." />
            </SelectTrigger>
            <SelectContent>
              {funnels.map(funnel => (
                <SelectItem key={funnel.id} value={funnel.id}>
                  {funnel.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {targetType === 'stage' && (
        <>
          <div>
            <Label htmlFor="funnel_for_stage">Funil</Label>
            <Select value={selectedFunnel} onValueChange={setSelectedFunnel}>
              <SelectTrigger>
                <SelectValue placeholder="Primeiro escolha o funil..." />
              </SelectTrigger>
              <SelectContent>
                {funnels.map(funnel => (
                  <SelectItem key={funnel.id} value={funnel.id}>
                    {funnel.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {selectedFunnel && (
            <div>
              <Label htmlFor="stage">Etapa</Label>
              <Select value={selectedStage} onValueChange={setSelectedStage}>
                <SelectTrigger>
                  <SelectValue placeholder="Escolha uma etapa..." />
                </SelectTrigger>
                <SelectContent>
                  {stages.map(stage => (
                    <SelectItem key={stage.id} value={stage.id}>
                      {stage.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </>
      )}

      {targetType === 'tags' && (
        <div>
          <Label>Selecionar Tags</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {tags.map(tag => (
              <label key={tag.id} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedTags.includes(tag.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedTags([...selectedTags, tag.id]);
                    } else {
                      setSelectedTags(selectedTags.filter(id => id !== tag.id));
                    }
                  }}
                />
                <span 
                  className="px-2 py-1 rounded text-xs text-white"
                  style={{ backgroundColor: tag.color }}
                >
                  {tag.name}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {targetType === 'custom' && (
        <div>
          <Label htmlFor="phone_numbers">Números de Telefone (um por linha)</Label>
          <Textarea
            id="phone_numbers"
            value={phoneNumbers}
            onChange={(e) => setPhoneNumbers(e.target.value)}
            placeholder="5511999999999&#10;5511888888888&#10;..."
            rows={6}
          />
          <p className="text-sm text-gray-500 mt-1">
            Digite um número por linha, incluindo código do país (55)
          </p>
        </div>
      )}
    </div>
  );
};
