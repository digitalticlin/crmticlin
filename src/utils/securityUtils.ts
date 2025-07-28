
// Utilitários de segurança para validação e sanitização
export const SecurityUtils = {
  /**
   * Sanitiza strings removendo caracteres perigosos
   */
  sanitizeString: (input: string): string => {
    if (!input) return '';
    return input.trim().replace(/[<>\"']/g, '');
  },

  /**
   * Valida se um email tem formato válido
   */
  isValidEmail: (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  },

  /**
   * Valida força da senha
   */
  validatePasswordStrength: (password: string): {
    isValid: boolean;
    errors: string[];
  } => {
    const errors: string[] = [];

    if (password.length < 8) {
      errors.push('Senha deve ter pelo menos 8 caracteres');
    }

    if (!/[a-z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra minúscula');
    }

    if (!/[A-Z]/.test(password)) {
      errors.push('Senha deve conter pelo menos uma letra maiúscula');
    }

    if (!/\d/.test(password)) {
      errors.push('Senha deve conter pelo menos um número');
    }

    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Senha deve conter pelo menos um caractere especial');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  },

  /**
   * Sanitiza número de telefone
   */
  sanitizePhone: (phone: string): string => {
    if (!phone) return '';
    return phone.replace(/[^\d+()-\s]/g, '');
  },

  /**
   * Sanitiza documento (CPF/CNPJ)
   */
  sanitizeDocument: (document: string): string => {
    if (!document) return '';
    return document.replace(/[^\d.-]/g, '');
  },

  /**
   * Valida se uma string contém apenas caracteres seguros
   */
  isSafeString: (input: string): boolean => {
    // Rejeita strings com caracteres potencialmente perigosos
    const dangerousChars = /<script|javascript:|data:|vbscript:|onload|onerror/i;
    return !dangerousChars.test(input);
  },

  /**
   * Gera um hash simples para verificar integridade
   */
  generateHash: (input: string): string => {
    let hash = 0;
    if (input.length === 0) return hash.toString();
    
    for (let i = 0; i < input.length; i++) {
      const char = input.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return hash.toString();
  },

  /**
   * Valida se um usuário tem permissão para uma ação
   */
  hasPermission: (userRole: string, requiredRole: string): boolean => {
    const roleHierarchy: Record<string, number> = {
      'operational': 1,
      'manager': 2,
      'admin': 3
    };

    const userLevel = roleHierarchy[userRole] || 0;
    const requiredLevel = roleHierarchy[requiredRole] || 0;

    return userLevel >= requiredLevel;
  }
};
