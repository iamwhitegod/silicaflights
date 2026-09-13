import { ValidationError } from 'yup';

/** Run Yup and adapt its errors to the field messages used by the forms. */
export function validateForm(schema, values, { context, mapError } = {}) {
  try {
    return { values: schema.validateSync(values, { abortEarly: false, context }), errors: {} };
  } catch (error) {
    if (!(error instanceof ValidationError)) throw error;
    const errors = {};
    for (const issue of error.inner.length ? error.inner : [error]) {
      const fieldError = mapError ? mapError(issue) : issue;
      const path = (fieldError.path || 'form').split('[')[0];
      errors[path] ??= fieldError.message;
    }

    return { values: undefined, errors };
  }
}
