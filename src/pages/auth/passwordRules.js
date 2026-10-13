/** Same rule the server enforces: at least 8 characters with a lower-case letter, an upper-case letter and a digit. */
export const PASSWORD_HINT = 'At least 8 characters, with an upper-case letter, a lower-case letter and a number.';

export function passwordProblem(password) {
  if (!password) return 'Password is required';
  if (password.length < 8) return 'Password must be at least 8 characters';
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password) || !/\d/.test(password)) {
    return 'Password needs an upper-case letter, a lower-case letter and a number';
  }
  return '';
}

/** Validates a "new password + confirm" pair; returns `{ password?, confirm? }` messages. */
export function validateNewPassword(password, confirm) {
  const errors = {};
  const problem = passwordProblem(password);
  if (problem) errors.password = problem;
  if (!confirm) errors.confirm = 'Please confirm your password';
  else if (password !== confirm) errors.confirm = 'Passwords do not match';
  return errors;
}

/** Field messages from a 422 response (`error.details`), keyed by field name. */
export function fieldErrorsFromResponse(err) {
  const out = {};
  (err?.response?.data?.error?.details || []).forEach((d) => {
    if (d.field && !out[d.field]) out[d.field] = d.message;
  });
  return out;
}
