
import { Contact } from "@/types/chat";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { User, Phone, Mail, MapPin, Building, FileText } from "lucide-react";

interface ContactInfoPanelProps {
  contact: Contact;
}

export const ContactInfoPanel = ({ contact }: ContactInfoPanelProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Informações do Contato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Nome:</span>
            <span>{contact.name}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Telefone:</span>
            <span>{contact.phone}</span>
          </div>
          
          {contact.email && (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Email:</span>
              <span>{contact.email}</span>
            </div>
          )}
          
          {contact.company && (
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Empresa:</span>
              <span>{contact.company}</span>
            </div>
          )}
          
          {contact.documentId && (
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">CPF/CNPJ:</span>
              <span>{contact.documentId}</span>
            </div>
          )}
          
          {contact.address && (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Endereço:</span>
              <span>{contact.address}</span>
            </div>
          )}
          
          {contact.tags && contact.tags.length > 0 && (
            <div className="space-y-2">
              <span className="font-medium">Tags:</span>
              <div className="flex flex-wrap gap-2">
                {contact.tags.map((tag, index) => (
                  <Badge key={index} variant="secondary">
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
