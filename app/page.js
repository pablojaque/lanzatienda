import Link from 'next/link';

const STEPS = [
  { n: '1', title: 'Sube 4 fotos', text: 'Las fotos de tu producto ganador. Nosotros las optimizamos.' },
  { n: '2', title: 'Elige tu marca', text: 'Color y tipografía para que tu tienda parezca una marca de verdad.' },
  { n: '3', title: 'Añade upsells', text: 'Packs, protección de envío, envío exprés… lo que suba tu ticket medio.' },
  { n: '4', title: 'Lánzala', text: 'Te damos el enlace de tu tienda online, publicada y lista para tus anuncios.' },
];

const FEATURES = [
  ['⚡', 'Sin Shopify, sin plantillas', 'Ni temas que configurar ni apps que instalar. Una página de producto pensada para vender.'],
  ['📱', 'Hecha para TikTok y móvil', 'Carga rapidísima y botón de compra siempre visible en el móvil.'],
  ['💸', 'Upsells integrados', 'Packs por cantidad y extras en el pedido sin pagar apps mensuales.'],
  ['🌍', 'Online al momento', 'Tu tienda se publica en internet con su propio enlace en menos de un minuto.'],
];

export default function Home() {
  return (
    <>
      <header className="site-header">
        <div className="container row">
          <Link href="/" className="brand">
            Lanza<span>Tienda</span>
          </Link>
          <Link href="/crear" className="btn btn-dark btn-sm">
            Crear mi tienda
          </Link>
        </div>
      </header>

      <main>
        <section className="hero container">
          <p className="pill">Para dropshippers que quieren testear rápido</p>
          <h1>
            Tu tienda de producto ganador,
            <br />
            <mark>lista en 2 minutos.</mark>
          </h1>
          <p className="lead">
            Sube 4 fotos, elige colores, fuente y upsells. Nosotros creamos la web, la publicamos y te damos el enlace
            para empezar a vender.
          </p>
          <Link href="/crear" className="btn btn-primary btn-xl">
            🚀 Crear mi tienda ahora
          </Link>
          <p className="hint">Gratis · Sin tarjeta · Registro en 10 segundos</p>
        </section>

        <section className="container steps">
          {STEPS.map((s) => (
            <div key={s.n} className="step-card">
              <span className="step-n">{s.n}</span>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          ))}
        </section>

        <section className="container features">
          <h2>Todo lo que necesitas para testear un producto</h2>
          <div className="feature-grid">
            {FEATURES.map(([icon, title, text]) => (
              <div key={title} className="feature">
                <span className="feature-icon">{icon}</span>
                <div>
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="container final-cta">
          <h2>¿Tienes el producto? Ya tienes la tienda.</h2>
          <Link href="/crear" className="btn btn-primary btn-xl">
            Crear mi tienda
          </Link>
        </section>
      </main>

      <footer className="site-footer">© {new Date().getFullYear()} LanzaTienda</footer>
    </>
  );
}
