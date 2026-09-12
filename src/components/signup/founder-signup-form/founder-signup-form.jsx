'use client';
import { Button } from '@/components/ui/button/button';
import { TextField } from '@/components/ui/text-field/text-field';
import { demoSubmit } from '@/lib/demo-submission';
import { useSignupSubmission } from '../use-signup-submission';
import { SignupFeedback } from '../signup-feedback/signup-feedback';
import styles from './founder-signup-form.module.scss';

/**
 * @param {{onSubmit?: (values: import('../use-signup-submission').SignupValues) => Promise<void>,
 *   idPrefix?: string}} props
 */
export function FounderSignupForm({ onSubmit = demoSubmit, idPrefix = 'founder' }) {
  const { values, errors, status, message, set, submit } = useSignupSubmission({
    onSubmit,
    idPrefix,
    requireName: false,
  });
  return (
    <form
      onSubmit={submit}
      noValidate
      className={styles['founder-signup-form']}
      aria-label="Founder signup"
    >
      <fieldset disabled={status === 'loading'} className={styles['founder-signup-form__fields']}>
        <div className={styles['founder-signup-form__email']}>
          <TextField
            id={`${idPrefix}-email`}
            label="Email address"
            type="email"
            name="email"
            autoComplete="email"
            required
            placeholder="Enter your email"
            value={values.email}
            onChange={(event) => set('email', event.target.value)}
            error={errors.email}
            action={
              <Button
                size="sm"
                type="submit"
                loading={status === 'loading'}
                success={status === 'success'}
              >
                {status === 'loading'
                  ? 'Joining…'
                  : status === 'success'
                    ? 'Demo complete'
                    : status === 'error'
                      ? 'Try again'
                      : 'Join'}
              </Button>
            }
          />
        </div>
      </fieldset>
      <SignupFeedback status={status} message={message} />
    </form>
  );
}
