
import React from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "./registerSchema";

interface FullNameFieldProps {
  form: UseFormReturn<RegisterFormValues>;
}

export function FullNameField({ form }: FullNameFieldProps) {
  return (
    <FormField
      control={form.control}
      name="fullName"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-semibold text-gray-800">
            Nome Completo
          </FormLabel>
          <FormControl>
            <Input
              type="text"
              placeholder="Digite seu nome completo"
              className="h-12 rounded-xl border-white/20 bg-white/10 backdrop-blur-sm text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-ticlin-500 focus:border-ticlin-500 transition-all duration-300"
              {...field}
            />
          </FormControl>
          <FormMessage className="text-red-600 text-sm" />
        </FormItem>
      )}
    />
  );
}
