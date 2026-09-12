export function validateSignup(values, weekly = false) {
  const errors = {};
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = 'Enter a valid email address.';
  if (weekly && !values.name?.trim()) errors.name = 'Enter your full name.';
  return errors;
}
