
import { Input } from "@/components/ui/input";

interface TimePickerInputProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export function TimePickerInput({ id, value, onChange }: TimePickerInputProps) {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  return (
    <Input
      id={id}
      type="time"
      value={value}
      onChange={handleChange}
      className="text-base"
    />
  );
}
