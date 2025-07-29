
import { z } from "zod";

export const registerSchema = z.object({
  fullName: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  email: z.string().email("Email inválido"),
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  documentId: z.string().min(11, "CPF deve ter 11 dígitos"),
  whatsapp: z.string().min(11, "WhatsApp deve ter pelo menos 11 dígitos"),
  password: z.string().min(6, "A senha deve ter pelo menos 6 caracteres"),
  confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

export type RegisterFormValues = z.infer<typeof registerSchema>;
