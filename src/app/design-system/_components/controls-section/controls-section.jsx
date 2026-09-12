'use client';
import { useState } from 'react';
import { Icon } from '@/components/ui/icon/icon';
import { Button } from '@/components/ui/button/button';
import { IconButton } from '@/components/ui/icon-button/icon-button';
import { Link } from '@/components/ui/link/link';
import { Status } from '@/components/ui/status/status';
import { Text } from '@/components/ui/text/text';
import { TextField } from '@/components/ui/text-field/text-field';
import { Chapter } from '../chapter/chapter';
import { Specimen } from '../specimen/specimen';
import { ExampleModal } from '../example-modal/example-modal';
import styles from './controls-section.module.scss';
export function ControlsSection() {
  const [modal, setModal] = useState(false);
  return (
    <>
      <Chapter id="atoms" number="02" title="Atoms">
        <div className={styles['controls-section']}>
          <Specimen title="Buttons / variants">
            <div className={styles['controls-section__row']}>
              <Button>Search flights</Button>
              <Button variant="secondary">Join Founders</Button>
              <Button variant="neutral">Cancel</Button>
              <Button variant="ghost">Clear filters</Button>
            </div>
          </Specimen>
          <Specimen title="Buttons / feedback">
            <div className={styles['controls-section__row']}>
              <Button disabled>Unavailable</Button>
              <Button loading>Searching…</Button>
              <Button success>Demo complete</Button>
              <IconButton label="Open settings" icon="settings" onClick={() => setModal(true)} />
            </div>
          </Specimen>
          <Specimen title="Inputs / default and filled">
            <TextField label="Your name" placeholder="Enter your full name" />
            <TextField label="Filled input" defaultValue="Alex Morgan" />
          </Specimen>
          <Specimen title="Inputs / error and unavailable">
            <TextField
              label="Email address"
              defaultValue="alex@"
              error="Enter a valid email address."
            />
            <TextField label="Disabled input" placeholder="Not available" disabled />
            <TextField label="Read-only input" defaultValue="SilicaFlights" readOnly />
          </Specimen>
          <Specimen title="Links and icons">
            <div className={styles['controls-section__row']}>
              <Link href="#molecules">Explore molecules</Link>
              <Link variant="navigation" href="#organisms">
                See organisms
              </Link>
              <Icon name="settings" />
              <Icon name="close" />
              <Icon name="check" />
            </div>
            <Text size="caption" tone="muted">
              Tab through controls for focus. Hover or press for interaction feedback. Dialogs
              animate in and out; tabs and status messages fade into view. Reduced motion follows
              your system preference.
            </Text>
          </Specimen>
          <Specimen title="Status messages">
            <Status kind="info">Your choices stay in this demo.</Status>
            <Status kind="success">Demo complete. Nothing was submitted.</Status>
            <Status kind="error">Something went wrong. Please try again.</Status>
          </Specimen>
        </div>
      </Chapter>
      <ExampleModal open={modal} onOpenChange={setModal} />
    </>
  );
}
