
/**
 * Utility functions for user management
 */

/**
 * Generates a username from an email address
 * @param email The email address
 * @returns The generated username
 */
export const generateUsername = (email: string): string => {
  if (!email || !email.includes("@")) {
    return email || "";
  }
  
  return email.split("@")[0];
};

/**
 * Validates if an email is properly formatted
 * @param email The email to validate
 * @returns True if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Formats a phone number for display
 * @param phone The phone number
 * @returns Formatted phone number
 */
export const formatPhoneNumber = (phone: string): string => {
  // Remove non-numeric characters
  const numbers = phone.replace(/\D/g, '');
  
  // Format Brazilian phone numbers
  if (numbers.length === 11) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 7)}-${numbers.substring(7)}`;
  } else if (numbers.length === 10) {
    return `(${numbers.substring(0, 2)}) ${numbers.substring(2, 6)}-${numbers.substring(6)}`;
  }
  
  return phone;
};
