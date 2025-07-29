
import React, { useState } from "react";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "./registerSchema";

interface PasswordFieldsProps {
  form: UseFormReturn<RegisterFormValues>;
}

export function PasswordFields({ form }: PasswordFieldsProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <div className="space-y-4">
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-gray-800">
              Senha
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Digite sua senha"
                  className="h-12 rounded-xl border-white/20 bg-white/10 backdrop-blur-sm text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-ticlin-500 focus:border-ticlin-500 transition-all duration-300 pr-12"
                  {...field}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-white/20 text-gray-600 hover:text-gray-800 transition-all duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </FormControl>
            <FormMessage className="text-red-600 text-sm" />
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="text-sm font-semibold text-gray-800">
              Confirmar Senha
            </FormLabel>
            <FormControl>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirme sua senha"
                  className="h-12 rounded-xl border-white/20 bg-white/10 backdrop-blur-sm text-gray-800 placeholder:text-gray-500 focus:ring-2 focus:ring-ticlin-500 focus:border-ticlin-500 transition-all duration-300 pr-12"
                  {...field}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full hover:bg-white/20 text-gray-600 hover:text-gray-800 transition-all duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </FormControl>
            <FormMessage className="text-red-600 text-sm" />
          </FormItem>
        )}
      />
    </div>
  );
}
