
import { Mail } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { ChangeEvent } from "react";
import { RegisterFormValues } from "./registerSchema";

interface EmailFieldProps {
  form: UseFormReturn<RegisterFormValues>;
  onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export const EmailField = ({ form, onEmailChange }: EmailFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Email</FormLabel>
          <FormControl>
            <div className="relative">
              <Mail className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                type="email"
                placeholder="seu.email@exemplo.com"
                {...field}
                onChange={onEmailChange}
              />
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
