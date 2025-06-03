
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
        <FormItem className="space-y-3">
          <FormLabel className="text-white font-medium">Email</FormLabel>
          <FormControl>
            <div className="relative group">
              <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600" />
              <Input
                className="pl-11 h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300"
                type="email"
                placeholder="seu.email@exemplo.com"
                {...field}
                onChange={onEmailChange}
              />
            </div>
          </FormControl>
          <FormMessage className="text-red-200" />
        </FormItem>
      )}
    />
  );
};
