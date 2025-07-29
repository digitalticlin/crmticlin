
import React, { ChangeEvent } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "./registerSchema";

interface EmailFieldProps {
  form: UseFormReturn<RegisterFormValues>;
  onEmailChange: (e: ChangeEvent<HTMLInputElement>) => void;
}

export function EmailField({ form, onEmailChange }: EmailFieldProps) {
  return (
    <FormField
      control={form.control}
      name="email"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="text-sm font-semibold text-gray-800">
            Email
          </FormLabel>
          <FormControl>
            <Input
              type="email"
              placeholder="seu@email.com"
              className="h-12 rounded-xl border-white/20 bg-white/10 backdrop-blur-sm text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-ticlin-500 focus:border-ticlin-500 transition-all duration-300"
              {...field}
              onChange={onEmailChange}
            />
          </FormControl>
          <FormMessage className="text-red-600 text-sm" />
        </FormItem>
      )}
    />
  );
}
