import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useReactFlow } from 'reactflow';
import { Save, X } from 'lucide-react';

interface NodeEditDialogProps {
  isOpen: boolean;
  onClose: () => void;
  nodeId: string;
  currentLabel: string;
  currentDescription: string;
  designStyle: 'glass' | 'neu';
}

export const NodeEditDialog = ({
  isOpen,
  onClose,
  nodeId,
  currentLabel,
  currentDescription,
  designStyle,
}: NodeEditDialogProps) => {
  const [label, setLabel] = useState(currentLabel);
  const [description, setDescription] = useState(currentDescription);
  const { setNodes } = useReactFlow();

  useEffect(() => {
    setLabel(currentLabel);
    setDescription(currentDescription);
  }, [currentLabel, currentDescription, isOpen]);

  const handleSave = () => {
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: {
              ...node.data,
              label,
              description,
            },
          };
        }
        return node;
      })
    );
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className={`
          ${designStyle === 'glass' ? 'glass border-white/20' : 'neu border-border'}
          max-w-md transition-smooth
        `}
      >
        <DialogHeader>
          <DialogTitle className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Editar Bloco
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Personalize o título e a descrição do seu bloco
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="label" className="text-sm font-medium">
              Título
            </Label>
            <Input
              id="label"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Ex: Iniciar conversa"
              className={`
                ${designStyle === 'glass' ? 'glass-dark' : 'neu-inset'}
                transition-smooth
              `}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Descrição
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva o que este bloco faz..."
              rows={4}
              className={`
                ${designStyle === 'glass' ? 'glass-dark' : 'neu-inset'}
                transition-smooth resize-none
              `}
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="ghost"
            onClick={onClose}
            className={`
              ${designStyle === 'glass' ? 'glass-dark hover:bg-white/20' : 'neu-hover'}
              transition-smooth
            `}
          >
            <X className="w-4 h-4 mr-2" />
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            className="gradient-primary text-white transition-smooth hover:opacity-90"
          >
            <Save className="w-4 h-4 mr-2" />
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
