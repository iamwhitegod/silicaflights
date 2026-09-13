'use client';

import { Button } from '@/components/ui/button/button';
import { TextField } from '@/components/ui/text-field/text-field';
import { Modal } from '@/components/ui/modal/modal';
import styles from './example-modal.module.scss';

export function ExampleModal({ open, onOpenChange }) {
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="A place for the details"
      description="This dialog keeps focus inside while it is open. Press Escape or use the close button to return."
    >
      <div className={styles['example-modal']}>
        <TextField label="Example input" placeholder="Try keyboard navigation" />
        <Button onClick={() => onOpenChange(false)}>Done</Button>
      </div>
    </Modal>
  );
}
