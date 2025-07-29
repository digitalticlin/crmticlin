
import React from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "./registerSchema";

interface ContactInfoFieldsProps {
  form: UseFormReturn<RegisterFormValues>;
}

export function ContactInfoFields({ form }: ContactInfoFieldsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormField
        control={form.control}
        name="documentId"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-gray-800">
              CPF
            </FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="000.000.000-00"
                className="h-12 rounded-xl border-white/20 bg-white/10 backdrop-blur-sm text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-ticlin-500 focus:border-ticlin-500 transition-all duration-300"
                {...field}
              />
            </FormControl>
            <FormMessage className="text-red-600 text-sm" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="whatsapp"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-gray-800">
              WhatsApp
            </FormLabel>
            <FormControl>
              <Input
                type="text"
                placeholder="(11) 99999-9999"
                className="h-12 rounded-xl border-white/20 bg-white/10 backdrop-blur-sm text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-ticlin-500 focus:border-ticlin-500 transition-all duration-300"
                {...field}
              />
            </FormControl>
            <FormMessage className="text-red-600 text-sm" />
          </FormItem>
        )}
      />
    </div>
  );
}
