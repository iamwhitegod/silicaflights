import { notFound } from 'next/navigation';
import { DesignSystem } from './_components/design-system/design-system';
export const metadata = {
  title: 'SilicaFlights — Design system',
  robots: { index: false, follow: false },
};
export default function DesignSystemPage() {
  if (process.env.NODE_ENV !== 'development') notFound();
  return <DesignSystem />;
}
