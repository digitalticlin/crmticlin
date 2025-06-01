
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, MessageSquare, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Template {
  id: string;
  title: string;
  content: string;
  category: string;
}

interface MessageTemplatesProps {
  onSelectTemplate: (content: string) => void;
}

export const MessageTemplates = ({ onSelectTemplate }: MessageTemplatesProps) => {
  const [templates, setTemplates] = useState<Template[]>([
    {
      id: '1',
      title: 'Saudação',
      content: 'Olá! Obrigado por entrar em contato. Como posso ajudá-lo hoje?',
      category: 'Atendimento'
    },
    {
      id: '2',
      title: 'Horário de Funcionamento',
      content: 'Nosso horário de atendimento é de segunda a sexta, das 8h às 18h.',
      category: 'Informações'
    },
    {
      id: '3',
      title: 'Agradecimento',
      content: 'Muito obrigado pelo seu contato! Foi um prazer atendê-lo.',
      category: 'Despedida'
    },
    {
      id: '4',
      title: 'Aguarde',
      content: 'Por favor, aguarde um momento enquanto verifico essas informações para você.',
      category: 'Atendimento'
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [newTemplate, setNewTemplate] = useState({ title: '', content: '', category: '' });
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const filteredTemplates = templates.filter(template =>
    template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const categories = Array.from(new Set(templates.map(t => t.category)));

  const addTemplate = () => {
    if (newTemplate.title && newTemplate.content) {
      const template: Template = {
        id: Date.now().toString(),
        ...newTemplate,
        category: newTemplate.category || 'Geral'
      };
      setTemplates([...templates, template]);
      setNewTemplate({ title: '', content: '', category: '' });
      setIsCreateModalOpen(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <MessageSquare className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Mensagens Rápidas</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 flex-1 min-h-0">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar mensagens..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </DialogTrigger>
              
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Nova Mensagem Rápida</DialogTitle>
                </DialogHeader>
                
                <div className="space-y-4">
                  <Input
                    placeholder="Título da mensagem"
                    value={newTemplate.title}
                    onChange={(e) => setNewTemplate({...newTemplate, title: e.target.value})}
                  />
                  
                  <Input
                    placeholder="Categoria"
                    value={newTemplate.category}
                    onChange={(e) => setNewTemplate({...newTemplate, category: e.target.value})}
                  />
                  
                  <Textarea
                    placeholder="Conteúdo da mensagem"
                    value={newTemplate.content}
                    onChange={(e) => setNewTemplate({...newTemplate, content: e.target.value})}
                    rows={4}
                  />
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button onClick={addTemplate}>
                      Criar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <ScrollArea className="flex-1">
            <div className="space-y-2">
              {categories.map(category => {
                const categoryTemplates = filteredTemplates.filter(t => t.category === category);
                if (categoryTemplates.length === 0) return null;
                
                return (
                  <div key={category} className="space-y-2">
                    <Badge variant="secondary" className="mb-2">
                      {category}
                    </Badge>
                    
                    {categoryTemplates.map(template => (
                      <div
                        key={template.id}
                        className="p-3 border rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        onClick={() => onSelectTemplate(template.content)}
                      >
                        <h4 className="font-medium text-sm">{template.title}</h4>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                          {template.content}
                        </p>
                      </div>
                    ))}
                  </div>
                );
              })}
              
              {filteredTemplates.length === 0 && (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma mensagem encontrada
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
};
