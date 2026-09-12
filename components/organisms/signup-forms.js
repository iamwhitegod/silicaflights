'use client';
import { useRef, useState } from 'react';
import { Button, Status } from '@/components/atoms/controls';
import { Text } from '@/components/atoms/typography';
import { TextField, MultiSelect } from '@/components/molecules/fields';
import { locations } from '@/lib/content';
import { demoSubmit, validateSignup } from '@/lib/forms';
import s from './organisms.module.scss';

export function SignupForm({
  weekly = false,
  onSubmit = demoSubmit,
  idPrefix = weekly ? 'weekly' : 'founder',
}) {
  const [values, setValues] = useState({ name: '', email: '', departures: [], interests: [] });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  const ref = useRef(null);
  const set = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    if (status === 'success') setStatus('idle');
  };
  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const next = validateSignup(values, weekly);
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`${idPrefix}-${next.name ? 'name' : 'email'}`)?.focus();
      return;
    }
    pending.current = true;
    setStatus('loading');
    try {
      await onSubmit({ ...values, email: values.email.trim(), name: values.name.trim() });
      setStatus('success');
    } catch (error) {
      setMessage(error.message || 'The demo request failed. Please try again.');
      setStatus('error');
    } finally {
      pending.current = false;
    }
  }
  return (
    <form
      ref={ref}
      onSubmit={submit}
      noValidate
      className={weekly ? s.weeklyForm : s.founderForm}
      aria-label={weekly ? 'Weekly deals signup' : 'Founder signup'}
    >
      <fieldset disabled={status === 'loading'} className={s.formFields}>
        {weekly && (
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
        )}
        <div className={weekly ? undefined : s.founderInput}>
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
              !weekly && (
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
              )
            }
          />
        </div>
        {weekly && (
          <>
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
          </>
        )}
      </fieldset>
      <Text size="caption" className={s.demoNotice}>
        Demo only. Your information is not sent or saved.
      </Text>
      {status === 'success' && (
        <Status kind="success">
          Demo complete. Nothing was submitted. Thanks for exploring SilicaFlights!
        </Status>
      )}
      {status === 'error' && <Status kind="error">{message}</Status>}
    </form>
  );
}
export function FounderSignupForm(props) {
  return <SignupForm {...props} />;
}
export function WeeklyDealsForm(props) {
  return <SignupForm weekly {...props} />;
}
