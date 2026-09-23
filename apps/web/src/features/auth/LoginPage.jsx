import { useState } from 'react';
import { Formik, Form } from 'formik';
import { toFormikValidate } from '../../lib/formikZod.js';
import { loginSchema } from './auth.schemas.js';
import { supabase } from '../../lib/supabase.js';
import { Icon } from '../../components/Icon.jsx';
import { LoginBackdrop } from './components/LoginBackdrop.jsx';
import { LoginBrandHeader } from './components/LoginBrandHeader.jsx';
import { AuthTextField } from './components/AuthTextField.jsx';
import { SsoButtons } from './components/SsoButtons.jsx';
import { PortalStatusStrip } from './components/PortalStatusStrip.jsx';
import { LoginFooter } from './components/LoginFooter.jsx';

export function LoginPage() {
  const [serverError, setServerError] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);

  return (
    <div className="w-full flex items-center justify-center p-gutter">
      <div className="flex flex-col w-full items-center justify-center py-gutter-lg px-gutter-sm">
        <div className="relative w-full max-w-md">
          <LoginBackdrop />
          <div className="relative bg-surface-container-lowest shadow-xl rounded-xl p-space-xl sm:p-margin transition-all">
            <LoginBrandHeader />
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
                <Form className="space-y-space-md">
                  <AuthTextField
                    name="email"
                    label="Work Email"
                    type="email"
                    placeholder="name@company.com"
                    icon="alternate_email"
                    autoComplete="email"
                  />

                  <div className="relative">
                    <button
                      type="button"
                      className="absolute right-0 top-0 text-label-sm text-secondary hover:text-on-secondary-fixed-variant transition-colors"
                    >
                      Forgot password?
                    </button>
                    <AuthTextField
                      name="password"
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••••••"
                      icon="lock"
                      autoComplete="current-password"
                      trailing={
                        <button
                          type="button"
                          aria-label={showPassword ? 'Hide password' : 'Show password'}
                          aria-pressed={showPassword}
                          onClick={() => setShowPassword((value) => !value)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center text-outline hover:text-on-surface transition-colors cursor-pointer"
                        >
                          <Icon name={showPassword ? 'visibility_off' : 'visibility'} size={18} />
                        </button>
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between pt-1">
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={remember}
                        onChange={(event) => setRemember(event.target.checked)}
                        className="w-4 h-4 rounded-xs text-secondary bg-surface-container-low focus:ring-0 focus:outline-hidden transition cursor-pointer accent-secondary"
                      />
                      <span className="text-body-sm text-on-surface-variant">
                        Remember this device for 30 days
                      </span>
                    </label>
                  </div>

                  {serverError && (
                    <p role="alert" className="text-body-sm text-error">
                      {serverError}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    aria-busy={isSubmitting}
                    className="w-full h-11 bg-primary text-on-primary text-label-lg rounded-lg shadow-md hover:bg-secondary transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer group disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <span>Enter BrainX Workspace</span>
                    <Icon
                      name={isSubmitting ? 'progress_activity' : 'arrow_forward'}
                      size={18}
                      className={
                        isSubmitting
                          ? 'animate-spin'
                          : 'group-hover:translate-x-0.5 transition-transform'
                      }
                    />
                  </button>
                </Form>
              )}
            </Formik>

            <SsoButtons />
            <PortalStatusStrip />
          </div>

          <LoginFooter />
        </div>
      </div>
    </div>
  );
}
