import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Formik, Form } from 'formik';
import { AuthTextField } from './AuthTextField.jsx';

function renderField({ initialValue = '', initialErrors = {}, initialTouched = {} } = {}) {
  return render(
    <Formik
      initialValues={{ email: initialValue }}
      initialErrors={initialErrors}
      initialTouched={initialTouched}
      onSubmit={() => {}}
    >
      <Form>
        <AuthTextField
          name="email"
          label="Work Email"
          type="email"
          placeholder="name@company.com"
          icon="alternate_email"
        />
      </Form>
    </Formik>,
  );
}

describe('AuthTextField', () => {
  it('shows the error text and aria attributes when touched and invalid', () => {
    renderField({
      initialValue: 'not-an-email',
      initialErrors: { email: 'Enter a valid email address.' },
      initialTouched: { email: true },
    });

    const input = screen.getByLabelText('Work Email');
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-describedby', 'email-error');
    const error = document.getElementById('email-error');
    expect(error).toHaveTextContent('Enter a valid email address.');
  });

  it('renders no error paragraph for a valid, untouched field', () => {
    renderField();
    expect(document.getElementById('email-error')).not.toBeInTheDocument();
  });
});
