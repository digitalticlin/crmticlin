
import { Phone } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "./registerSchema";

interface ContactInfoFieldsProps {
  form: UseFormReturn<RegisterFormValues>;
}

export const ContactInfoFields = ({ form }: ContactInfoFieldsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="documentId"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-white font-medium">CPF/CNPJ</FormLabel>
            <FormControl>
              <Input
                className="h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300"
                placeholder="Seu CPF ou CNPJ"
                {...field}
              />
            </FormControl>
            <FormMessage className="text-red-200" />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="whatsapp"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-white font-medium">WhatsApp</FormLabel>
            <FormControl>
              <div className="relative group">
                <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                <Input
                  className="pl-11 h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300"
                  placeholder="(00) 00000-0000"
                  {...field}
                />
              </div>
            </FormControl>
            <FormMessage className="text-red-200" />
          </FormItem>
        )}
      />
    </div>
  );
};
