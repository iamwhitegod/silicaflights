'use client';

import { useId } from 'react';
import { Button } from '@/components/ui/button/button';
import { Modal } from '@/components/ui/modal/modal';
import { SettingsEditor } from '../settings-editor/settings-editor';
import styles from './advanced-search-dialog.module.scss';

export function AdvancedSearchDialog({ open, onOpenChange, value, onValueChange, departure }) {
  const formId = useId();

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Advanced search"
      layout="fixed"
      className={styles['advanced-search-dialog']}
      headerActions={
        <Button
          type="reset"
          form={formId}
          variant="ghost"
          size="sm"
          className={styles['advanced-search-dialog__clear']}
        >
          Clear filters
        </Button>
      }
    >
      <SettingsEditor
        id={formId}
        initial={value}
        departure={departure}
        onCancel={() => onOpenChange(false)}
        onApply={(next) => {
          onValueChange(next);
          onOpenChange(false);
        }}
      />
    </Modal>
  );
}
