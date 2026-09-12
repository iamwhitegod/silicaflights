'use client';
import { useState } from 'react';
import { Heading, Text } from '@/components/atoms/typography';
import { Button, Icon, IconButton, Link, Status } from '@/components/atoms/controls';
import { TextField, DateField, Combobox, Chip, NumberStepper } from '@/components/molecules/fields';
import { SegmentedControl, Tabs } from '@/components/molecules/selection';
import Modal from '@/components/molecules/modal';
import { FeatureCard, DestinationCard } from '@/components/molecules/cards';
import { FounderSignupForm, WeeklyDealsForm } from '@/components/organisms/signup-forms';
import FlightSearchForm from '@/components/organisms/flight-search';
import Navigation from '@/components/organisms/navigation';
import { airports, features, destinations } from '@/lib/content';
import { demoSubmit, demoFailure } from '@/lib/forms';
import s from './design-system.module.scss';

const colors = [
  ['Yellow', 'yellow', '#FCCB5F'],
  ['Sky blue', 'sky', '#0089FC'],
  ['Brand blue', 'blue', '#4F86FD'],
  ['Action', 'action', '#0045D7'],
  ['Surface', 'surface', '#F5F5F5'],
  ['Ink', 'text', '#1E1E1E'],
  ['Cream', 'cream', '#FFFDEA'],
  ['Mint', 'mint', '#E6FBF4'],
  ['Peach', 'peach', '#FFEADB'],
  ['Error', 'error', '#B42318'],
  ['Success', 'success', '#166534'],
];
const chapters = [
  ['foundations', 'Foundations'],
  ['atoms', 'Atoms'],
  ['molecules', 'Molecules'],
  ['organisms', 'Organisms'],
];
function Chapter({ id, number, title, children }) {
  return (
    <section id={id} className={s.chapter}>
      <div className={s.chapterTitle}>
        <span>{number}</span>
        <Heading tone="default">{title}</Heading>
      </div>
      {children}
    </section>
  );
}
function Specimen({ title, children, wide }) {
  return (
    <div className={wide ? s.wide : s.specimen}>
      <h3>{title}</h3>
      <div className={s.sample}>{children}</div>
    </div>
  );
}
export default function DesignSystem() {
  const [city, setCity] = useState('');
  const [trip, setTrip] = useState('one-way');
  const [tab, setTab] = useState('one');
  const [count, setCount] = useState(1);
  const [modal, setModal] = useState(false);
  const [chip, setChip] = useState(true);
  const [failure, setFailure] = useState(false);
  return (
    <div className={s.workspace}>
      <aside className={s.sidebar}>
        <Link href="/" variant="navigation" className={s.brand}>
          Silica Flights<span>Design system / v1.0</span>
        </Link>
        <nav aria-label="Design system chapters">
          {chapters.map(([id, label], index) => (
            <Link key={id} href={'#' + id} variant="navigation">
              <small>0{index + 1}</small>
              {label}
            </Link>
          ))}
        </nav>
        <p>
          Built from small things.
          <br />
          Made for everywhere.
        </p>
      </aside>
      <main id="main" className={s.main}>
        <header className={s.header}>
          <Text size="caption" tone="muted">
            SILICAFLIGHTS · COMPONENT LIBRARY
          </Text>
          <Heading level={1} variant="hero" tone="default">
            A little system.
            <br />A world of possibility.
          </Heading>
          <Text tone="muted">
            The foundations and reusable patterns behind a simpler way to fly. Explore real
            controls, their states, and how they work together.
          </Text>
          <span className={s.badge}>Atomic Design · Sass · rem</span>
        </header>
        <Chapter id="foundations" number="01" title="Foundations">
          <p className={s.intro}>
            A warm yellow, an open sky, and typography with a little personality.
          </p>
          <div className={s.colors}>
            {colors.map(([label, token, value]) => (
              <div className={s.color} key={token}>
                <div style={{ background: 'var(--color-' + token + ')' }} />
                <strong>{label}</strong>
                <code>{value}</code>
              </div>
            ))}
          </div>
          <div className={s.specimens}>
            <Specimen title="Recoleta Alt / Display">
              <Heading level={3} variant="hero">
                Fly anywhere
              </Heading>
              <Heading level={3}>Pay less</Heading>
              <Text size="caption" tone="muted">
                Bold · 3.2–5.6rem
              </Text>
            </Specimen>
            <Specimen title="Switzer / Everyday">
              <Heading level={3} variant="card" tone="default">
                Your next adventure starts here.
              </Heading>
              <Text>
                Clear, friendly, and easy to read. Body text uses Switzer Regular at 1.6rem.
              </Text>
              <Text size="label" tone="muted">
                Labels at 1.4rem · Captions at 1.2rem
              </Text>
              <p className={s.script}>The sky at your fingertips</p>
            </Specimen>
          </div>
          <Specimen title="Spacing / 0.4rem base" wide>
            <div className={s.spacing}>
              {[1, 2, 3, 4, 5, 6, 8, 10, 12, 16, 20, 24].map((step) => (
                <div key={step}>
                  <span style={{ width: 'var(--space-' + step + ')' }} />
                  <code>{(step * 0.4).toFixed(1)}rem</code>
                </div>
              ))}
            </div>
          </Specimen>
          <Text size="label" tone="muted">
            Root: 62.5%. Semantic CSS properties supply component values; Sass supplies structure
            and breakpoints. Dark blue replaces bright selection blue where small white text needs
            stronger contrast.
          </Text>
        </Chapter>
        <Chapter id="atoms" number="02" title="Atoms">
          <div className={s.specimens}>
            <Specimen title="Buttons / variants">
              <div className={s.row}>
                <Button>Search flights</Button>
                <Button variant="secondary">Join Founders</Button>
                <Button variant="neutral">Cancel</Button>
                <Button variant="ghost">Clear filters</Button>
              </div>
            </Specimen>
            <Specimen title="Buttons / feedback">
              <div className={s.row}>
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
              <div className={s.row}>
                <Link href="#molecules">Explore molecules</Link>
                <Link variant="navigation" href="#organisms">
                  See organisms
                </Link>
                <Icon name="settings" />
                <Icon name="close" />
                <Icon name="check" />
              </div>
              <Text size="caption" tone="muted">
                Tab through controls for focus. Hover or press for interaction feedback.
              </Text>
            </Specimen>
            <Specimen title="Status messages">
              <Status kind="info">Your choices stay in this demo.</Status>
              <Status kind="success">Demo complete. Nothing was submitted.</Status>
              <Status kind="error">Something went wrong. Please try again.</Status>
            </Specimen>
          </div>
        </Chapter>
        <Chapter id="molecules" number="03" title="Molecules">
          <div className={s.specimens}>
            <Specimen title="Airport combobox">
              <Combobox
                label="Departure airport"
                options={airports}
                value={city}
                onValueChange={setCity}
                hint="Type to search. Use arrow keys and Enter to select."
              />
            </Specimen>
            <Specimen title="Date and travelers">
              <DateField label="Travel date" />
              <NumberStepper label="Adults" value={count} onValueChange={setCount} min={1} />
            </Specimen>
            <Specimen title="Selection and chips">
              <SegmentedControl
                label="Trip type"
                options={[
                  { value: 'one-way', label: 'One-way' },
                  { value: 'round-trip', label: 'Round trip' },
                  { value: 'multi-city', label: 'Multi-city', disabled: true },
                ]}
                value={trip}
                onValueChange={setTrip}
              />
              <div className={s.row}>
                {chip ? (
                  <Chip selected onRemove={() => setChip(false)}>
                    Nigeria
                  </Chip>
                ) : (
                  <Chip onClick={() => setChip(true)}>Add Nigeria</Chip>
                )}
                <Chip disabled>Unavailable</Chip>
              </div>
            </Specimen>
            <Specimen title="Tabs and modal">
              <Tabs
                label="Example tabs"
                value={tab}
                onValueChange={setTab}
                items={[
                  {
                    value: 'one',
                    label: 'Overview',
                    content: <Text>Tabs keep related information in one place.</Text>,
                  },
                  {
                    value: 'two',
                    label: 'Details',
                    content: <Text>Use Left, Right, Home, and End to navigate.</Text>,
                  },
                  { value: 'three', label: 'Unavailable', disabled: true, content: null },
                ]}
              />
              <Button onClick={() => setModal(true)}>Open example modal</Button>
            </Specimen>
            <Specimen title="Feature card">
              <FeatureCard {...features[0]} />
            </Specimen>
            <Specimen title="Destination card">
              <DestinationCard {...destinations[0]} />
              <Text size="caption" tone="muted">
                Sample fare. Selecting the card prefills search.
              </Text>
            </Specimen>
          </div>
        </Chapter>
        <Chapter id="organisms" number="04" title="Organisms">
          <div className={s.previewSky}>
            <Navigation />
            <FlightSearchForm
              idPrefix="showcase-flight"
              onSubmit={failure ? demoFailure : demoSubmit}
            />
          </div>
          <div className={s.demoControl}>
            <label>
              <input
                type="checkbox"
                checked={failure}
                onChange={(event) => setFailure(event.target.checked)}
              />{' '}
              Simulate submission failure
            </label>
            <Text size="caption" tone="muted">
              Applies to all forms below and the search above. Turn off to retry successfully.
            </Text>
          </div>
          <div className={s.specimens}>
            <Specimen title="Founder signup">
              <div className={s.previewBlue}>
                <FounderSignupForm
                  idPrefix="showcase-founder"
                  onSubmit={failure ? demoFailure : demoSubmit}
                />
              </div>
            </Specimen>
            <Specimen title="Weekly deals">
              <WeeklyDealsForm
                idPrefix="showcase-weekly"
                onSubmit={failure ? demoFailure : demoSubmit}
              />
            </Specimen>
          </div>
        </Chapter>
        <footer className={s.endnote}>SilicaFlights · Design system · Development preview</footer>
      </main>
      <Modal
        open={modal}
        onOpenChange={setModal}
        title="A place for the details"
        description="This dialog keeps focus inside while it is open. Press Escape or use the close button to return."
      >
        <div className={s.sample}>
          <TextField label="Example input" placeholder="Try keyboard navigation" />
          <Button onClick={() => setModal(false)}>Done</Button>
        </div>
      </Modal>
    </div>
  );
}
