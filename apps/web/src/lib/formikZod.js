/**
 * Adapts a Zod schema into a Formik `validate` function, so Formik's native
 * Yup-oriented validation prop works with Zod (CLAUDE.md mandates Zod, not
 * a second validation library).
 */
export function toFormikValidate(schema) {
  return (values) => {
    const result = schema.safeParse(values);
    if (result.success) return {};

    const errors = {};
    for (const issue of result.error.issues) {
      const path = issue.path.join('.');
      if (path && !(path in errors)) {
        errors[path] = issue.message;
      }
    }
    return errors;
  };
}
