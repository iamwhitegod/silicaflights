import { Text } from '@/components/ui/text/text';
import { Status } from '@/components/ui/status/status';
import styles from './signup-feedback.module.scss';

export function SignupFeedback({ status, message }) {
  return (
    <>
      <Text size="caption" className={styles['signup-feedback__notice']}>
        Demo only. Your information is not sent or saved.
      </Text>
      {status === 'success' && (
        <Status kind="success">
          Demo complete. Nothing was submitted. Thanks for exploring SilicaFlights!
        </Status>
      )}
      {status === 'error' && <Status kind="error">{message}</Status>}
    </>
  );
}
