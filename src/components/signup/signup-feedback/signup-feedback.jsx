import { Status } from '@/components/ui/status/status';

export function SignupFeedback({ status, message }) {
  return (
    <>
      {status === 'success' && (
        <Status kind="success">Thanks for your interest in SilicaFlights!</Status>
      )}
      {status === 'error' && <Status kind="error">{message}</Status>}
    </>
  );
}
