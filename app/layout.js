import './globals.css';
import { FONTS } from '@/lib/storeOptions';

export const metadata = {
  title: 'LanzaTienda — Tu tienda de dropshipping en 2 minutos',
  description: 'Sube 4 fotos de tu producto ganador, elige colores, fuente y upsells, y lanza tu tienda online al momento.',
};

// Pone el modo claro/oscuro elegido antes de pintar nada (si no, la página parpadearía)
const themeScript = `try{var t=localStorage.getItem('lt-theme');if(t==='light'||t==='dark')document.documentElement.dataset.theme=t}catch(e){}`;

const fontsHref =
  'https://fonts.googleapis.com/css2?' +
  ['Geist:wght@400..700', 'Geist+Mono:wght@400..600', ...FONTS.map((f) => f.google)].map((f) => 'family=' + f).join('&') +
  '&display=swap';

export default function RootLayout({ children }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={fontsHref} />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'><rect width='24' height='24' rx='6' fill='%23f25418'/><g fill='none' stroke='white' stroke-width='2.6' stroke-linecap='round' stroke-linejoin='round'><path d='M6 13l6-6 6 6'/><path d='M6 19l6-6 6 6' opacity='.55'/></g></svg>"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
