
/**
 * Utility functions for WhatsApp instance naming
 */

/**
 * Extracts username from email (part before @)
 */
export const extractUsernameFromEmail = (email: string): string => {
  return email.split('@')[0];
};

/**
 * Generates sequential instance name based on username and existing instances
 */
export const generateSequentialInstanceName = (username: string, existingNames: string[]): string => {
  const baseUsername = username.toLowerCase();
  const existingNumbers = existingNames
    .filter(name => name.startsWith(baseUsername))
    .map(name => {
      const match = name.match(new RegExp(`^${baseUsername}(\\d+)$`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => num > 0);
  
  const nextNumber = existingNumbers.length > 0 ? Math.max(...existingNumbers) + 1 : 1;
  return `${baseUsername}${nextNumber}`;
};
