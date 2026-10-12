import './globals.css';
import { FONTS } from '@/lib/storeOptions';

export const metadata = {
  title: 'LanzaTienda — Tu tienda de dropshipping en 2 minutos',
  description: 'Sube 4 fotos de tu producto ganador, elige colores, fuente y upsells, y lanza tu tienda online al momento.',
};

const fontsHref =
  'https://fonts.googleapis.com/css2?' +
  ['Plus+Jakarta+Sans:wght@400;500;600;700;800', ...FONTS.map((f) => f.google)].map((f) => 'family=' + f).join('&') +
  '&display=swap';

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={fontsHref} />
        <link
          rel="icon"
          href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='24' fill='%23111'/><text x='50' y='70' font-size='60' text-anchor='middle'>🚀</text></svg>"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
