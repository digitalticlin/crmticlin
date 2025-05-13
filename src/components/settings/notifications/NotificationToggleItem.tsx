
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NotificationToggleItemProps {
  title: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}

const NotificationToggleItem = ({
  title,
  description,
  checked,
  onCheckedChange
}: NotificationToggleItemProps) => {
  return (
    <div className="flex items-center justify-between">
      <div className="space-y-0.5">
        <Label>{title}</Label>
        <p className="text-sm text-muted-foreground">
          {description}
        </p>
      </div>
      <Switch 
        checked={checked} 
        onCheckedChange={onCheckedChange} 
      />
    </div>
  );
};

export default NotificationToggleItem;
