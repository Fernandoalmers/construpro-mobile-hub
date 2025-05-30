
// Centralized environment configuration to replace hardcoded values
export const config = {
  supabase: {
    url: import.meta.env.VITE_SUPABASE_URL || "https://orqnibkshlapwhjjmszh.supabase.co",
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9ycW5pYmtzaGxhcHdoamptc3poIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYyMjQxNDAsImV4cCI6MjA2MTgwMDE0MH0.JkNLF_MgpA4KamUZspxidu6wT4bCXEw8ej93xbp0JsI"
  },
  app: {
    name: "MaterShop",
    version: "1.0.0",
    environment: import.meta.env.MODE || "development"
  },
  security: {
    sessionTimeoutMs: 30 * 60 * 1000, // 30 minutes
    maxLoginAttempts: 5,
    rateLimit: {
      loginWindowMs: 15 * 60 * 1000, // 15 minutes
      cartWindowMs: 60 * 1000, // 1 minute
      maxCartUpdates: 10
    }
  }
} as const;

export type Config = typeof config;
