
import React from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "./registerSchema";

interface UsernameFieldProps {
  form: UseFormReturn<RegisterFormValues>;
}

export function UsernameField({ form }: UsernameFieldProps) {
  return (
    <FormField
      control={form.control}
      name="username"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-semibold text-gray-800">
            Nome de Usuário
          </FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="Username será gerado automaticamente"
              className="h-12 rounded-xl border-white/20 bg-white/10 backdrop-blur-sm text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-ticlin-500 focus:border-ticlin-500 transition-all duration-300"
              {...field}
              readOnly
            />
          </FormControl>
          <FormMessage className="text-red-600 text-sm" />
        </FormItem>
      )}
    />
  );
}
