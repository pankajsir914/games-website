// Security Configuration Constants

export const SECURITY_CONFIG = {
  // Session Management
  SESSION_TIMEOUT_MINUTES: 30,
  MAX_SESSION_AGE_DAYS: 7,
  
  // Rate Limiting
  MAX_REQUESTS_PER_MINUTE: 100,
  MAX_LOGIN_ATTEMPTS: 5,
  LOGIN_ATTEMPT_WINDOW_MINUTES: 15,
  
  // Password Requirements
  MIN_PASSWORD_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL_CHAR: false,
  
  // Input Validation
  MAX_INPUT_LENGTH: 1000,
  MAX_EMAIL_LENGTH: 255,
  MAX_NAME_LENGTH: 100,
  
  // API Security
  ENABLE_CSRF_PROTECTION: true,
  CSRF_TOKEN_HEADER: 'x-csrf-token',
  
  // Audit Logging
  LOG_ALL_ADMIN_ACTIONS: true,
  LOG_FAILED_LOGINS: true,
  LOG_SUSPICIOUS_ACTIVITY: true,
  
  // Security Headers
  ENABLE_SECURITY_HEADERS: true,
  SECURITY_HEADERS: {
    'X-Frame-Options': 'DENY',
    'X-Content-Type-Options': 'nosniff',
    'X-XSS-Protection': '1; mode=block',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
    'Referrer-Policy': 'strict-origin-when-cross-origin'
  }
} as const;

// Validation Helpers
export const validatePassword = (password: string): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (password.length < SECURITY_CONFIG.MIN_PASSWORD_LENGTH) {
    errors.push(`Password must be at least ${SECURITY_CONFIG.MIN_PASSWORD_LENGTH} characters`);
  }
  
  if (SECURITY_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (SECURITY_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (SECURITY_CONFIG.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (SECURITY_CONFIG.REQUIRE_SPECIAL_CHAR && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
};

export const sanitizeInput = (input: string, maxLength?: number): string => {
  const max = maxLength || SECURITY_CONFIG.MAX_INPUT_LENGTH;
  
  // Trim and limit length
  let sanitized = input.trim().slice(0, max);
  
  // Remove HTML tags and scripts
  sanitized = sanitized.replace(/<[^>]*>/g, '');
  sanitized = sanitized.replace(/javascript:/gi, '');
  sanitized = sanitized.replace(/on\w+=/gi, '');
  
  return sanitized;
};

export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$/;
  return emailRegex.test(email) && email.length <= SECURITY_CONFIG.MAX_EMAIL_LENGTH;
};
