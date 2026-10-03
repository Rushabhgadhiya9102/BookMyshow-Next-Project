// ======================================================== //
// ============ BookMyShow Validation Constants & Helpers = //
// ======================================================== //

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email.trim());
};

export const isValidPassword = (password: string): boolean => {
  return typeof password === 'string' && password.length >= 6;
};

export const sanitizeString = (input: string): string => {
  return input.trim();
};
