
import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ChartCardProps {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
}

const ChartCard = ({ title, description, children, className = "" }: ChartCardProps) => {
  return (
    <Card className={`w-full bg-white/20 backdrop-blur-md border border-white/30 shadow-glass ${className}`}>
      <CardHeader className="pb-4 px-6 pt-6">
        <CardTitle className="text-lg font-bold text-gray-900">{title}</CardTitle>
        {description && (
          <CardDescription className="text-sm text-gray-600 mt-1">
            {description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent className="px-6 pb-6">
        {children}
      </CardContent>
    </Card>
  );
};

export default ChartCard;
