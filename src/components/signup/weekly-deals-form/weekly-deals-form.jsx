'use client';
import { Button } from '@/components/ui/button/button';
import { TextField } from '@/components/ui/text-field/text-field';
import { MultiSelect } from '@/components/ui/multi-select/multi-select';
import { locations } from '@/data/travel-locations';
import { demoSubmit } from '@/lib/demo-submission';
import { useSignupSubmission } from '../use-signup-submission';
import { SignupFeedback } from '../signup-feedback/signup-feedback';
import styles from './weekly-deals-form.module.scss';

/**
 * @param {{onSubmit?: (values: import('../use-signup-submission').SignupValues) => Promise<void>,
 *   idPrefix?: string}} props
 */
export function WeeklyDealsForm({ onSubmit = demoSubmit, idPrefix = 'weekly' }) {
  const { values, errors, status, message, set, submit } = useSignupSubmission({
    onSubmit,
    idPrefix,
    requireName: true,
  });
  return (
    <form
      onSubmit={submit}
      noValidate
      className={styles['weekly-deals-form']}
      aria-label="Weekly deals signup"
    >
      <fieldset disabled={status === 'loading'} className={styles['weekly-deals-form__fields']}>
        <TextField
          id={`${idPrefix}-name`}
          label="Full name"
          name="name"
          autoComplete="name"
          required
          placeholder="Your full name"
          value={values.name}
          onChange={(event) => set('name', event.target.value)}
          error={errors.name}
        />
        <div>
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
          />
        </div>

        <MultiSelect
          label="Departure countries or cities"
          options={locations}
          value={values.departures}
          onValueChange={(value) => set('departures', value)}
        />
        <MultiSelect
          label="Places of interest"
          options={locations}
          value={values.interests}
          onValueChange={(value) => set('interests', value)}
        />
        <Button
          size="lg"
          type="submit"
          loading={status === 'loading'}
          success={status === 'success'}
        >
          {status === 'loading'
            ? 'Adding you to the demo list…'
            : status === 'success'
              ? 'Demo complete'
              : status === 'error'
                ? 'Try again'
                : 'Subscribe'}
        </Button>
      </fieldset>
      <SignupFeedback status={status} message={message} />
    </form>
  );
}
