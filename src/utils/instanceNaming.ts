
/**
 * Utility functions for WhatsApp instance naming
 */

/**
 * Extracts username from email (part before @)
 */
export const extractUsernameFromEmail = (email: string): string => {
  if (!email || !email.includes('@')) {
    return 'whatsapp';
  }
  return email.split('@')[0].toLowerCase();
};

/**
 * Generates sequential instance name based on username and existing instances
 */
export const generateSequentialInstanceName = (username: string, existingNames: string[]): string => {
  const baseUsername = username.toLowerCase();
  
  // Check if base name is available
  if (!existingNames.includes(baseUsername)) {
    return baseUsername;
  }
  
  // Find existing numbered instances
  const existingNumbers = existingNames
    .filter(name => name.startsWith(baseUsername))
    .map(name => {
      // Extract number from names like "digitalticlin1", "digitalticlin2"
      const match = name.match(new RegExp(`^${baseUsername}(\\d+)$`));
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter(num => num > 0)
    .sort((a, b) => a - b);
  
  // Find next available number
  let nextNumber = 1;
  for (const num of existingNumbers) {
    if (num === nextNumber) {
      nextNumber++;
    } else {
      break;
    }
  }
  
  return `${baseUsername}${nextNumber}`;
};
