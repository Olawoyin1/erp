/** Rejection payload for a failed request: the server's message plus any per-field validation messages. */
export function thunkError(err, fallback) {
  const apiErr = err?.response?.data?.error;
  const fieldErrors = {};
  (apiErr?.details || []).forEach((d) => {
    if (d.field && !fieldErrors[d.field]) fieldErrors[d.field] = d.message;
  });
  return {
    message: apiErr?.message || (err?.response ? fallback : 'Cannot reach the server. Check your connection and try again.'),
    status: err?.response?.status,
    fieldErrors,
  };
}
