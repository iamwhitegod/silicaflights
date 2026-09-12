import { ScrollProvider } from '@/components/ui/scroll-provider/scroll-provider';

export default function LandingLayout({ children }) {
  return <ScrollProvider>{children}</ScrollProvider>;
}
