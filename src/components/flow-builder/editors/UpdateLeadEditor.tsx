import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserCog, Edit3, Check, X, Plus } from 'lucide-react';

// Campos disponíveis para atualização (apenas se o cliente tiver enviado)
const UPDATABLE_FIELDS = [
  { value: 'name', label: '👤 Nome', category: 'Pessoal' },
  { value: 'email', label: '📧 Email', category: 'Pessoal' },
  { value: 'document_id', label: '🆔 CPF', category: 'Pessoal' },
  { value: 'notes', label: '📝 Observações', category: 'Pessoal' },
  { value: 'address', label: '🏠 Endereço Completo', category: 'Endereço' },
  { value: 'city', label: '🌆 Cidade', category: 'Endereço' },
  { value: 'state', label: '📍 Estado', category: 'Endereço' },
  { value: 'zip_code', label: '📮 CEP', category: 'Endereço' },
  { value: 'neighborhood', label: '🏘️ Bairro', category: 'Endereço' },
  { value: 'country', label: '🌍 País', category: 'Endereço' },
  { value: 'company', label: '🏢 Nome da Empresa', category: 'Empresa' },
  { value: 'company_segment', label: '🏭 Segmento da Empresa', category: 'Empresa' },
  { value: 'company_address', label: '🏢 Endereço da Empresa', category: 'Empresa' },
  { value: 'company_cidade', label: '🌆 Cidade da Empresa', category: 'Empresa' },
  { value: 'company_estado', label: '📍 Estado da Empresa', category: 'Empresa' },
  { value: 'company_cnpj', label: '🆔 CNPJ da Empresa', category: 'Empresa' },
];

interface FieldUpdate {
  fieldName: string;
  fieldValue: string;
}

interface UpdateLeadEditorProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: {
    label: string;
    description?: string;
    fieldUpdates?: FieldUpdate[];
  };
  onSave: (data: {
    label: string;
    description: string;
    fieldUpdates: FieldUpdate[];
  }) => void;
}

export function UpdateLeadEditor({
  isOpen,
  onClose,
  initialData,
  onSave
}: UpdateLeadEditorProps) {
  const [label, setLabel] = useState(initialData?.label || 'Atualizar Dados do Lead');
  const [isEditingLabel, setIsEditingLabel] = useState(false);
  const [description, setDescription] = useState(initialData?.description || '');
  const [fieldUpdates, setFieldUpdates] = useState<FieldUpdate[]>(
    initialData?.fieldUpdates?.length ? initialData.fieldUpdates : [{ fieldName: '', fieldValue: '' }]
  );

  const handleSave = () => {
    setIsEditingLabel(false);

    // Filtrar apenas campos preenchidos
    const validUpdates = fieldUpdates.filter(update => update.fieldName.trim().length > 0);

    onSave({
      label,
      description,
      fieldUpdates: validUpdates
    });

    onClose();
  };

  const addField = () => {
    setFieldUpdates([...fieldUpdates, { fieldName: '', fieldValue: '' }]);
  };

  const removeField = (index: number) => {
    if (fieldUpdates.length > 1) {
      setFieldUpdates(fieldUpdates.filter((_, i) => i !== index));
    }
  };

  const updateField = (index: number, field: 'fieldName' | 'fieldValue', value: string) => {
    const newUpdates = [...fieldUpdates];
    newUpdates[index][field] = value;
    setFieldUpdates(newUpdates);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0 gap-0 glass rounded-3xl shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] overflow-hidden">
        <div className="overflow-y-auto max-h-[90vh] kanban-horizontal-scroll">
          <div className="px-8 pt-8 pb-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 shadow-lg shadow-cyan-500/30">
                <UserCog className="h-6 w-6 text-white" />
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
              Atualizar informações do lead no CRM
            </p>
          </div>

          <div className="px-8 pb-8 space-y-6">
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium text-gray-700">
                O que deve acontecer nesta etapa?
              </Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ex: Atualizar status do lead para qualificado"
                rows={3}
                className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500 resize-none"
              />
            </div>

            {/* Campos para atualizar */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium text-gray-700">
                  Campos para atualizar
                </Label>
                <button
                  onClick={addField}
                  className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-cyan-600 bg-cyan-500/10 hover:bg-cyan-500/20 rounded-lg transition-colors"
                >
                  <Plus className="h-3 w-3" />
                  Adicionar campo
                </button>
              </div>

              {fieldUpdates.map((update, index) => (
                <div key={index} className="relative bg-white/20 border border-white/30 rounded-xl p-4 space-y-3">
                  {/* Botão remover */}
                  {fieldUpdates.length > 1 && (
                    <button
                      onClick={() => removeField(index)}
                      className="absolute top-3 right-3 p-1 text-red-600 hover:bg-red-500/10 rounded-lg transition-colors"
                      title="Remover campo"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}

                  {/* Seletor de campo */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Qual informação atualizar?
                    </Label>
                    <Select
                      value={update.fieldName}
                      onValueChange={(value) => updateField(index, 'fieldName', value)}
                    >
                      <SelectTrigger className="bg-white/30 border-white/40">
                        <SelectValue placeholder="Selecione o campo" />
                      </SelectTrigger>
                      <SelectContent className="max-h-[300px]">
                        {/* Campos Pessoais */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500">Dados Pessoais</div>
                        {UPDATABLE_FIELDS.filter(f => f.category === 'Pessoal').map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}

                        {/* Campos de Endereço */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t mt-2 pt-2">Endereço</div>
                        {UPDATABLE_FIELDS.filter(f => f.category === 'Endereço').map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}

                        {/* Campos de Empresa */}
                        <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 border-t mt-2 pt-2">Dados da Empresa</div>
                        {UPDATABLE_FIELDS.filter(f => f.category === 'Empresa').map(field => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Campo de valor */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium text-gray-700">
                      Como vai ser atualizado?
                    </Label>
                    <Input
                      value={update.fieldValue}
                      onChange={(e) => updateField(index, 'fieldValue', e.target.value)}
                      placeholder="⚠️ Será atualizado apenas se o cliente tiver enviado essa informação"
                      className="bg-white/30 border-white/40 focus:bg-white/50 placeholder:text-gray-500"
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t border-white/40">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-white/30 hover:bg-white/40 border border-white/40 rounded-full text-sm font-medium text-gray-700 transition-all duration-200"
              >
                Cancelar
              </button>
              <button
                onClick={handleSave}
                
                className="px-6 py-2.5 bg-gradient-to-br from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-full text-sm font-medium shadow-lg shadow-cyan-500/30 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
