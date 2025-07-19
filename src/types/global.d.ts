declare global {
  interface Window {
    supabase: any;
    authTestExecuted?: boolean;
    supabaseInitialized?: boolean;
  }
}

export {}; 