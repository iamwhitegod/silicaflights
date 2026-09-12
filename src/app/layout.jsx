import localFont from 'next/font/local';
import 'lenis/dist/lenis.css';
import '@/styles/globals.scss';

const body = localFont({
  src: [
    { path: '../../assets/fonts/Switzer-Regular.otf', weight: '400', style: 'normal' },
    { path: '../../assets/fonts/Switzer-Medium.otf', weight: '500', style: 'normal' },
    { path: '../../assets/fonts/Switzer-Semibold.otf', weight: '600', style: 'normal' },
    { path: '../../assets/fonts/Switzer-Bold.otf', weight: '700', style: 'normal' },
  ],
  variable: '--font-body',
  display: 'swap',
});
const display = localFont({
  src: '../../assets/fonts/RecoletaAlt-Bold.ttf',
  weight: '700',
  variable: '--font-display',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});
const script = localFont({
  src: '../../assets/fonts/Cintarini.ttf',
  weight: '400',
  variable: '--font-script',
  display: 'swap',
  preload: false,
});

export const metadata = {
  title: 'SilicaFlights — Fly anywhere. Pay less.',
  description:
    'Discover your next destination with SilicaFlights. Explore flight search and get inspired by weekly travel deals.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${body.variable} ${display.variable} ${script.variable}`}>
      <body>
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
