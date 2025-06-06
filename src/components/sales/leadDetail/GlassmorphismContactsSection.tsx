
import { Phone, Mail, MessageCircle, MapPin } from "lucide-react";
import { LeadContact } from "@/hooks/clients/types";

interface GlassmorphismContactsSectionProps {
  contacts?: LeadContact[];
  phone?: string;
  email?: string;
  address?: string;
}

export const GlassmorphismContactsSection = ({
  contacts = [],
  phone,
  email,
  address
}: GlassmorphismContactsSectionProps) => {
  // Se não há contatos estruturados, usar dados legacy
  const displayContacts = contacts.length > 0 ? contacts : [
    ...(phone ? [{ contact_type: 'phone' as const, contact_value: phone, is_primary: true }] : []),
    ...(email ? [{ contact_type: 'email' as const, contact_value: email, is_primary: false }] : [])
  ];

  const getContactIcon = (type: string) => {
    switch (type) {
      case 'phone': return <Phone className="h-4 w-4 text-lime-400" />;
      case 'email': return <Mail className="h-4 w-4 text-lime-400" />;
      case 'whatsapp': return <MessageCircle className="h-4 w-4 text-lime-400" />;
      default: return <Phone className="h-4 w-4 text-lime-400" />;
    }
  };

  const getContactLabel = (type: string) => {
    switch (type) {
      case 'phone': return 'Telefone';
      case 'email': return 'Email';
      case 'whatsapp': return 'WhatsApp';
      default: return 'Contato';
    }
  };

  return (
    <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-6 border border-lime-400/30 shadow-xl shadow-lime-400/10">
      <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
        <div className="w-2 h-2 bg-lime-400 rounded-full shadow-lg shadow-lime-400/50"></div>
        Informações de Contato
      </h3>
      
      <div className="space-y-4">
        {displayContacts.map((contact, index) => (
          <div key={index} className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            {getContactIcon(contact.contact_type)}
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-lime-300">
                  {getContactLabel(contact.contact_type)}
                </span>
                {contact.is_primary && (
                  <span className="px-2 py-1 bg-lime-400/20 text-lime-300 text-xs rounded-full border border-lime-400/30">
                    Principal
                  </span>
                )}
              </div>
              <span className="text-white font-medium">{contact.contact_value}</span>
            </div>
          </div>
        ))}
        
        {address && (
          <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <MapPin className="h-4 w-4 text-lime-400" />
            <div className="flex-1">
              <span className="text-sm font-medium text-lime-300 block">Endereço</span>
              <span className="text-white font-medium">{address}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
