
import { CardDescription, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface UsersPanelHeaderProps {
  title: string;
  description: string;
}

const UsersPanelHeader = ({ title, description }: UsersPanelHeaderProps) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      <div>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </div>
      <div className="flex gap-2">
        <Button variant="outline">
          <Download className="h-4 w-4 mr-1" /> Exportar Lista
        </Button>
      </div>
    </div>
  );
};

export default UsersPanelHeader;
