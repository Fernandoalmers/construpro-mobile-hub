
export const securityConfig = {
  rateLimit: {
    maxCartUpdates: 10,
    cartWindowMs: 60000, // 1 minute
    maxLoginAttempts: 5,
    loginWindowMs: 300000 // 5 minutes
  },
  validation: {
    maxCartQuantity: 1000,
    minCartQuantity: 1
  }
};
