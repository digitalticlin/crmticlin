
import { User } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "./registerSchema";

interface UsernameFieldProps {
  form: UseFormReturn<RegisterFormValues>;
}

export const UsernameField = ({ form }: UsernameFieldProps) => {
  return (
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Nome de usuário</FormLabel>
          <FormControl>
            <div className="relative">
              <User className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                className="pl-8"
                readOnly
                {...field}
              />
            </div>
          </FormControl>
          <p className="text-xs text-muted-foreground">
            Gerado automaticamente com base no email
          </p>
          <FormMessage />
        </FormItem>
      )}
    />
  );
};
