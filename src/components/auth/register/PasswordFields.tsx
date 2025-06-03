
import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { UseFormReturn } from "react-hook-form";
import { RegisterFormValues } from "./registerSchema";

interface PasswordFieldsProps {
  form: UseFormReturn<RegisterFormValues>;
}

export const PasswordFields = ({ form }: PasswordFieldsProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  return (
    <>
      <FormField
        control={form.control}
        name="password"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-white font-medium">Senha</FormLabel>
            <FormControl>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                <Input
                  className="pl-11 pr-12 h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...field}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-10 w-10 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showPassword ? "Esconder senha" : "Mostrar senha"}
                  </span>
                </Button>
              </div>
            </FormControl>
            <FormMessage className="text-red-200" />
          </FormItem>
        )}
      />
      
      <FormField
        control={form.control}
        name="confirmPassword"
        render={({ field }) => (
          <FormItem className="space-y-3">
            <FormLabel className="text-white font-medium">Confirmar senha</FormLabel>
            <FormControl>
              <div className="relative group">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400 transition-colors group-hover:text-gray-600" />
                <Input
                  className="pl-11 pr-12 h-12 rounded-xl bg-white border-gray-200 text-gray-900 placeholder:text-gray-400 focus:bg-white focus:border-gray-300 transition-all duration-300 hover:border-gray-300"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="••••••••"
                  {...field}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-1 top-1 h-10 w-10 text-gray-400 hover:text-gray-600 hover:bg-gray-50 rounded-lg transition-all duration-200"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                  <span className="sr-only">
                    {showConfirmPassword ? "Esconder senha" : "Mostrar senha"}
                  </span>
                </Button>
              </div>
            </FormControl>
            <FormMessage className="text-red-200" />
          </FormItem>
        )}
      />
    </>
  );
};
