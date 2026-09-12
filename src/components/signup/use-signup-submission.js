'use client';
import { useRef, useState } from 'react';
import { validateSignup } from './validation';

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
    const next = validateSignup(values, requireName);
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
  return { values, errors, status, message, set, submit };
}
