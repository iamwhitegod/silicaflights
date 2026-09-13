'use client';

import { Modal } from '@/components/ui/modal/modal';
import { SettingsEditor } from '../settings-editor/settings-editor';

export function AdvancedSearchDialog({ open, onOpenChange, value, onValueChange, departure }) {
  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Advanced search">
      <SettingsEditor
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
