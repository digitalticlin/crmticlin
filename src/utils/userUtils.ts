
/**
 * Utility functions for user management
 */

/**
 * Generates a username from an email address
 * @param email - The email address
 * @returns The generated username
 */
export function generateUsername(email: string): string {
  if (!email) return '';
  
  // Extract the part before @ symbol
  const username = email.includes('@') ? email.split('@')[0] : email;
  
  // Remove special characters and convert to lowercase
  return username.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
}

/**
 * Formats a phone number for display
 * @param phone - The phone number
 * @returns The formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters
  const cleaned = phone.replace(/\D/g, '');
  
  // Format Brazilian phone number
  if (cleaned.length === 11) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 7)}-${cleaned.slice(7)}`;
  } else if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 2)}) ${cleaned.slice(2, 6)}-${cleaned.slice(6)}`;
  }
  
  return phone;
}

/**
 * Validates a CPF (Brazilian document)
 * @param cpf - The CPF to validate
 * @returns Whether the CPF is valid
 */
export function validateCPF(cpf: string): boolean {
  if (!cpf) return false;
  
  // Remove all non-numeric characters
  const cleaned = cpf.replace(/\D/g, '');
  
  // Check if it has 11 digits
  if (cleaned.length !== 11) return false;
  
  // Check if all digits are the same
  if (/^(\d)\1{10}$/.test(cleaned)) return false;
  
  // Validate CPF algorithm
  let sum = 0;
  let remainder;
  
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (11 - i);
  }
  
  remainder = (sum * 10) % 11;
  
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(9, 10))) return false;
  
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleaned.substring(i - 1, i)) * (12 - i);
  }
  
  remainder = (sum * 10) % 11;
  
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleaned.substring(10, 11))) return false;
  
  return true;
}
