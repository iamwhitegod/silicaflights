'use client';

import { useRef, useState } from 'react';
import { validateForm } from '@/lib/validation';
import { founderSignupSchema, weeklyDealsSchema } from './schemas';

/**
 * @typedef {Object} SignupValues
 * @property {string} name
 * @property {string} email
 * @property {string[]} departures
 * @property {string[]} interests
 */

/**
 * Owns validation, focus, and the submission lifecycle shared by both signup forms.
 * @param {{onSubmit: (values: SignupValues) => Promise<void>, idPrefix: string, requireName?: boolean}} options
 */
export function useSignupSubmission({ onSubmit, idPrefix, requireName = false }) {
  const [values, setValues] = useState({ name: '', email: '', departures: [], interests: [] });
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');
  const pending = useRef(false);
  const set = (key, value) => {
    setValues((previous) => ({ ...previous, [key]: value }));
    if (status === 'success') setStatus('idle');
  };

  async function submit(event) {
    event.preventDefault();
    if (pending.current) return;
    const { values: submission, errors: next } = validateForm(
      requireName ? weeklyDealsSchema : founderSignupSchema,
      values,
    );
    setErrors(next);
    if (Object.keys(next).length) {
      document.getElementById(`${idPrefix}-${next.name ? 'name' : 'email'}`)?.focus();

      return;
    }
    pending.current = true;
    setStatus('loading');
    try {
      await onSubmit(submission);
      setStatus('success');
    } catch (error) {
      setMessage(error.message || 'The request failed. Please try again.');
      setStatus('error');
    } finally {
      pending.current = false;
    }
  }

  return { values, errors, status, message, set, submit };
}
