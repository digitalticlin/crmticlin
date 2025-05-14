
// Export all database functions from the database folder
export * from './database/whatsappDatabaseTypes';
export * from './database/saveInstanceToDatabase';
export * from './database/updateInstanceStatus';
export * from './database/updateQrCode';
// We don't need to export updateConnectionAttempt from here as it's already exported in useWhatsAppDatabase.ts
