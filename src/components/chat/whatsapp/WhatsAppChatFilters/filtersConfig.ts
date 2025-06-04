
import { MessageCircle, Circle, Tags, TrendingUp } from "lucide-react";

export const mainFilters = [
  { 
    key: "all", 
    label: "Todas conversas", 
    icon: MessageCircle,
    hasSubmenu: false 
  },
  { 
    key: "unread", 
    label: "Não lidas", 
    icon: Circle,
    hasSubmenu: false 
  },
  { 
    key: "tags", 
    label: "Etiquetas", 
    icon: Tags,
    hasSubmenu: true 
  },
  { 
    key: "funnel", 
    label: "Etapa do funil", 
    icon: TrendingUp,
    hasSubmenu: true 
  }
];
