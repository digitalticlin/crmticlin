
/**
 * Utility functions related to user data
 */

/**
 * Extracts username from an email address
 * @param email The email address to extract from
 * @returns The username part of the email
 */
export const generateUsername = (email: string): string => {
  return email.split("@")[0];
};
