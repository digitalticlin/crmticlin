
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { Contact } from "@/types/chat";

interface ContactDetailsProps {
  contact: Contact;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  notes: string;
  onNotesChange: (notes: string) => void;
  onUpdateNotes: () => void;
}

export const ContactDetails = ({
  contact,
  isOpen,
  onOpenChange,
  notes,
  onNotesChange,
  onUpdateNotes,
}: ContactDetailsProps) => {
  return (
    <Drawer open={isOpen} onOpenChange={onOpenChange}>
      <DrawerContent>
        <div className="max-w-md mx-auto">
          <DrawerHeader className="text-center">
            <div className="flex justify-center mb-4">
              <Avatar className="h-16 w-16">
                <AvatarFallback className="text-xl">
                  {contact.name.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
                <AvatarImage src={contact.avatar} alt={contact.name} />
              </Avatar>
            </div>
            <DrawerTitle className="text-2xl">{contact.name}</DrawerTitle>
            <DrawerDescription>{contact.phone}</DrawerDescription>
          </DrawerHeader>
          
          <Tabs defaultValue="info" className="p-4">
            <TabsList className="w-full">
              <TabsTrigger value="info" className="flex-1">Informações</TabsTrigger>
              <TabsTrigger value="notes" className="flex-1">Observações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="info" className="mt-4 space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-1">Telefone</h4>
                <p className="text-muted-foreground">{contact.phone}</p>
              </div>
              
              {contact.email && (
                <div>
                  <h4 className="text-sm font-medium mb-1">E-mail</h4>
                  <p className="text-muted-foreground">{contact.email}</p>
                </div>
              )}
              
              {contact.address && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Endereço</h4>
                  <p className="text-muted-foreground">{contact.address}</p>
                </div>
              )}
              
              {contact.tags && contact.tags.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-1">Etiquetas</h4>
                  <div className="flex flex-wrap gap-1">
                    {contact.tags.map((tag, index) => (
                      <Badge key={index} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="notes" className="mt-4">
              <Textarea 
                placeholder="Adicione observações sobre este contato..."
                className="min-h-[200px]"
                value={notes}
                onChange={(e) => onNotesChange(e.target.value)}
              />
              <Button 
                className="w-full mt-4 bg-ticlin hover:bg-ticlin/90 text-black"
                onClick={onUpdateNotes}
              >
                Salvar Observações
              </Button>
            </TabsContent>
          </Tabs>
          
          <DrawerFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fechar
            </Button>
          </DrawerFooter>
        </div>
      </DrawerContent>
    </Drawer>
  );
};
