import { useState } from 'react';
import { Formik, Form, Field, ErrorMessage } from 'formik';
import { toFormikValidate } from '../../lib/formikZod.js';
import { loginSchema } from './auth.schemas.js';
import { supabase } from '../../lib/supabase.js';

export function LoginPage() {
  const [serverError, setServerError] = useState(null);

  return (
    <div className="mx-auto mt-24 max-w-sm p-6">
      <h1 className="mb-4 text-2xl font-semibold">Log in</h1>
      <Formik
        initialValues={{ email: '', password: '' }}
        validate={toFormikValidate(loginSchema)}
        onSubmit={async (values, { setSubmitting }) => {
          setServerError(null);
          const { error } = await supabase.auth.signInWithPassword(values);
          if (error) setServerError(error.message);
          setSubmitting(false);
        }}
      >
        {({ isSubmitting }) => (
          <Form className="flex flex-col gap-3">
            <label htmlFor="email">Email</label>
            <Field id="email" name="email" type="email" className="border p-2" />
            <ErrorMessage name="email" component="div" className="text-sm text-red-600" />

            <label htmlFor="password">Password</label>
            <Field id="password" name="password" type="password" className="border p-2" />
            <ErrorMessage name="password" component="div" className="text-sm text-red-600" />

            {serverError && <div className="text-sm text-red-600">{serverError}</div>}

            <button type="submit" disabled={isSubmitting} className="bg-blue-600 p-2 text-white">
              Log in
            </button>
          </Form>
        )}
      </Formik>
    </div>
  );
}
