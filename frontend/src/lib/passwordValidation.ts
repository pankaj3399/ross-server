/**
 * Password validation utilities for strong password policy
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
  score: number; // 0-100
}

export interface PasswordRequirements {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbidCommonPasswords: boolean;
  forbidUserInfo: boolean;
  maxConsecutiveChars: number;
}

// Common weak passwords to check against
const COMMON_PASSWORDS = [
  "password",
  "123456",
  "123456789",
  "qwerty",
  "abc123",
  "password123",
  "admin",
  "letmein",
  "welcome",
  "monkey",
  "1234567890",
  "password1",
  "qwerty123",
  "dragon",
  "master",
  "hello",
  "freedom",
  "whatever",
  "qazwsx",
  "trustno1",
  "jordan",
  "harley",
  "password12",
  "welcome123",
  "login",
  "passw0rd",
  "starwars",
  "iloveyou",
  "sunshine",
  "princess",
  "football",
  "charlie",
  "aa123456",
  "donald",
  "password1234",
  "qwertyuiop",
];

// Only allow safe special characters (no quotes, semicolons, or SQL injection characters)
export const ALLOWED_SPECIAL_CHARS = "!@#$%^&*";
const SPECIAL_CHARS = ALLOWED_SPECIAL_CHARS;

export const DEFAULT_PASSWORD_REQUIREMENTS: PasswordRequirements = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  forbidCommonPasswords: true,
  forbidUserInfo: true,
  maxConsecutiveChars: 3,
};

/**
 * Validate password against requirements
 */
export function validatePassword(
  password: string,
  userInfo?: { email?: string; name?: string },
  requirements: PasswordRequirements = DEFAULT_PASSWORD_REQUIREMENTS,
): PasswordValidationResult {
  const errors: string[] = [];
  let score = 0;

  // Length validation
  if (password.length < requirements.minLength) {
    errors.push(
      `Password must be at least ${requirements.minLength} characters long`,
    );
  } else {
    score += 20;
  }

  if (password.length > requirements.maxLength) {
    errors.push(
      `Password must be no more than ${requirements.maxLength} characters long`,
    );
  }

  // Character type validation
  if (requirements.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter");
  } else if (requirements.requireUppercase) {
    score += 15;
  }

  if (requirements.requireLowercase && !/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter");
  } else if (requirements.requireLowercase) {
    score += 15;
  }

  if (requirements.requireNumbers && !/\d/.test(password)) {
    errors.push("Password must contain at least one number");
  } else if (requirements.requireNumbers) {
    score += 15;
  }

  if (
    requirements.requireSpecialChars &&
    !new RegExp(
      `[${SPECIAL_CHARS.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}]`,
    ).test(password)
  ) {
    errors.push(
      `Password must contain at least one special character (${SPECIAL_CHARS})`,
    );
  } else if (requirements.requireSpecialChars) {
    score += 15;
  }

  // Consecutive character validation
  if (requirements.maxConsecutiveChars > 0) {
    const consecutiveRegex = new RegExp(
      `(.)\\1{${requirements.maxConsecutiveChars},}`,
      "i",
    );
    if (consecutiveRegex.test(password)) {
      errors.push(
        `Password cannot contain more than ${requirements.maxConsecutiveChars} consecutive identical characters`,
      );
    } else {
      score += 10;
    }
  }

  // Common password check
  if (requirements.forbidCommonPasswords) {
    const lowerPassword = password.toLowerCase();
    if (COMMON_PASSWORDS.includes(lowerPassword)) {
      errors.push("Password is too common and easily guessable");
    } else {
      score += 10;
    }
  }

  // User info check
  if (requirements.forbidUserInfo && userInfo) {
    const lowerPassword = password.toLowerCase();
    const lowerEmail = userInfo.email?.toLowerCase() || "";
    const lowerName = userInfo.name?.toLowerCase() || "";

    if (lowerEmail && lowerPassword.includes(lowerEmail.split("@")[0])) {
      errors.push("Password cannot contain your email username");
    } else if (lowerName && lowerPassword.includes(lowerName.toLowerCase())) {
      errors.push("Password cannot contain your name");
    } else {
      score += 10;
    }
  }

  // Additional complexity scoring
  const uniqueChars = new Set(password).size;
  if (uniqueChars >= 8) score += 5;

  // Length bonus
  if (password.length >= 12) score += 5;
  if (password.length >= 16) score += 5;

  return {
    isValid: errors.length === 0,
    errors,
    score: Math.min(score, 100),
  };
}

/**
 * Get password strength description
 */
export function getPasswordStrength(score: number): string {
  if (score < 30) return "Very Weak";
  if (score < 50) return "Weak";
  if (score < 70) return "Fair";
  if (score < 85) return "Good";
  return "Strong";
}

/**
 * Get password strength color
 */
export function getPasswordStrengthColor(score: number): string {
  if (score < 30) return "text-red-500";
  if (score < 50) return "text-orange-500";
  if (score < 70) return "text-yellow-500";
  if (score < 85) return "text-blue-500";
  return "text-green-500";
}

/**
 * Get password strength background color
 */
export function getPasswordStrengthBgColor(score: number): string {
  if (score < 30) return "bg-red-500";
  if (score < 50) return "bg-orange-500";
  if (score < 70) return "bg-yellow-500";
  if (score < 85) return "bg-blue-500";
  return "bg-green-500";
}
