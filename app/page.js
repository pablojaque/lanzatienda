import Link from 'next/link';
import HeaderBar from '@/components/HeaderBar';
import CursorFx from '@/components/CursorFx';
import NavShadow from '@/components/NavShadow';
import SiteFooter from '@/components/SiteFooter';
import Icon from '@/components/Icon';
import { getCurrentUser } from '@/lib/currentUser';

export const dynamic = 'force-dynamic';


const STEPS = [
  ['Sube tus productos', 'De 1 a 4 fotos por producto. Las optimizamos para que la tienda cargue al instante.'],
  ['Elige tu marca', 'Color y tipografía para que tu tienda parezca una marca de verdad, no una plantilla.'],
  ['Activa los upsells', 'Packs, protección de envío, envío exprés… lo que sube tu ticket medio.'],
  ['Lánzala', 'Publicada en internet en segundos, con su enlace y lista para tus anuncios.'],
];

const FEATURES = [
  {
    icon: 'card',
    title: 'Cobros con tarjeta integrados',
    text: 'Tus clientes pagan con tarjeta, Apple Pay o Google Pay sin salir de tu tienda. El dinero llega directo a tu cuenta.',
    tags: ['Stripe', 'Apple Pay', 'Google Pay'],
    wide: true,
  },
  { icon: 'bolt', title: 'Upsells que venden', text: 'Packs por cantidad, extras en el pedido y ofertas con cuenta atrás. Sin pagar apps al mes.' },
  { icon: 'globe', title: 'Tu propio dominio', text: 'Cómpralo aquí mismo o conecta el que ya tienes. Se configura solo, con HTTPS.' },
  { icon: 'chart', title: 'Analíticas claras', text: 'Visitas, de dónde vienen (TikTok, Instagram…) y cuántos llegan a pagar.' },
  {
    icon: 'layers',
    title: 'Uno o varios productos',
    text: 'Una landing de producto ganador o un catálogo de hasta 12 productos con su página cada uno.',
    tags: ['Catálogo', 'Página de producto'],
  },
  { icon: 'phone', title: 'Hecha para móvil', text: 'Carga rapidísima y botón de compra siempre visible, para el tráfico de TikTok.' },
  { icon: 'edit', title: 'Edita cuando quieras', text: 'Cambia fotos, precios o textos y vuelve a publicar en un clic.' },
  { icon: 'bag', title: 'Pedidos en un sitio', text: 'Cada pedido con su dirección de envío, listo para pasarlo a tu proveedor.' },
];

const FAQ = [
  ['¿Necesito saber programar?', 'No. Subes fotos, eliges colores y escribes el precio. Dropshype crea la web y la publica por ti.'],
  [
    '¿Cuánto cuesta?',
    'Crear y publicar tiendas es gratis. Solo pagas, si quieres, tu dominio propio. Las ventas con tarjeta tienen la comisión normal de Stripe.',
  ],
  ['¿Cómo cobro a mis clientes?', 'Activa los cobros con tarjeta (con Stripe) y tus clientes pagan dentro de la tienda. También puedes usar tu propio enlace de pago.'],
  ['¿Puedo usar mi propio dominio?', 'Sí. Puedes comprar uno dentro de Dropshype, que se conecta solo, o conectar uno que ya tengas.'],
  ['¿Puedo cambiar la tienda después?', 'Claro. Desde «Mis tiendas» la editas cuando quieras y los cambios se publican en segundos.'],
];

export default async function Home() {
  const { user, name } = await getCurrentUser();
  return (
    <>
      <CursorFx />
      <NavShadow />
      <header className="site-header lp-nav">
        <div className="container">
          <HeaderBar
            user={user}
            name={name}
            nav={
              <nav className="nav-links" aria-label="Secciones">
                <a href="#como-funciona" className="nav-link">
                  Cómo funciona
                </a>
                <a href="#funciones" className="nav-link">
                  Funciones
                </a>
                <a href="#preguntas" className="nav-link">
                  Preguntas
                </a>
              </nav>
            }
          >
            {!user && (
              <Link href="/entrar" className="nav-link hide-sm">
                Entrar
              </Link>
            )}
            <Link href="/crear" className="btn btn-primary btn-sm">
              {user ? 'Crear tienda' : 'Empezar gratis'}
            </Link>
          </HeaderBar>
        </div>
      </header>

      <main>
        <section className="lp-hero" data-fx>
          <div className="lp-hero-bg" aria-hidden="true" />
          <div className="container lp-hero-inner">
            <span className="lp-badge rise">
              <b>Nuevo</b> Cobros con tarjeta dentro de tu tienda
            </span>
            <h1 className="rise d1">
              Tu tienda de dropshipping, <em>lista en 2 minutos.</em>
            </h1>
            <p className="lp-sub rise d2">
              Sube tus productos, elige tu marca y lánzala. Dropshype crea la web, la publica y te da el enlace para empezar a
              vender hoy.
            </p>
            <div className="lp-ctas rise d3">
              <Link href="/crear" className="btn btn-primary btn-xl">
                Crear mi tienda gratis →
              </Link>
              <a href="#como-funciona" className="btn btn-ghost btn-xl">
                Ver cómo funciona
              </a>
            </div>
            <p className="lp-note rise d3">
              <span>Sin tarjeta</span>
              <span>Sin cuotas mensuales</span>
              <span>Lista en 2 minutos</span>
            </p>

            <div className="lp-stage rise d4">
              <div className="lp-float f1" data-depth="10">
                <span className="dot">
                  <Icon name="bag" size={16} />
                </span>
                <div>
                  <b>Nuevo pedido · 53,98 €</b>
                  <small>2 x Lámpara Sunset · Madrid</small>
                </div>
              </div>
              <div className="lp-float f2" data-depth="-8">
                <span className="dot">
                  <Icon name="chart" size={16} />
                </span>
                <div>
                  <b>+128 visitas hoy</b>
                  <small>74 % desde TikTok</small>
                </div>
              </div>
              <div className="lp-float f3" data-depth="6">
                <span className="dot">
                  <Icon name="globe" size={16} />
                </span>
                <div>
                  <b>sunsetlamp.shop</b>
                  <small>Dominio conectado · HTTPS</small>
                </div>
              </div>

              <div className="lp-mock" data-tilt aria-hidden="true">
                <div className="mock-bar">
                  <i />
                  <i />
                  <i />
                  <span>sunsetlamp.shop</span>
                </div>
                <div className="mock-body">
                  <div>
                    <div className="mock-img" />
                    <div className="mock-thumbs">
                      <i />
                      <i />
                      <i />
                      <i />
                    </div>
                  </div>
                  <div className="mock-info">
                    <small>★★★★★ 4,9 · 2.300 opiniones</small>
                    <h4>Lámpara Sunset LED</h4>
                    <div className="mock-price">
                      <b>29,99 €</b>
                      <s>59,99 €</s>
                      <em>-50%</em>
                    </div>
                    <div className="mock-pack">
                      <span>1 unidad</span>
                      <b>29,99 €</b>
                    </div>
                    <div className="mock-pack on">
                      <span>2 unidades · -10%</span>
                      <b>53,98 €</b>
                    </div>
                    <div className="mock-pack">
                      <span>3 unidades · -20%</span>
                      <b>71,98 €</b>
                    </div>
                    <div className="mock-buy">Comprar ahora</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-strip">
          <div className="container">
            <p>Pensada para vender con tráfico de</p>
            <ul>
              <li>TikTok</li>
              <li>Instagram</li>
              <li>Facebook</li>
              <li>Google</li>
              <li>YouTube</li>
            </ul>
          </div>
        </section>

        <section className="lp-section">
          <div className="container">
            <div className="lp-stats">
              <div>
                <b>2 min</b>
                <span>De las fotos a la tienda online</span>
              </div>
              <div>
                <b>0 €</b>
                <span>Al mes, sin cuotas ni apps</span>
              </div>
              <div>
                <b>12</b>
                <span>Productos por tienda</span>
              </div>
              <div>
                <b>100 %</b>
                <span>Pensada para móvil</span>
              </div>
            </div>
          </div>
        </section>

        <section className="lp-section" id="como-funciona" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="lp-head">
              <span className="eyebrow">Cómo funciona</span>
              <h2 className="lp-title">De producto ganador a tienda online en cuatro pasos.</h2>
            </div>
            <div className="lp-steps">
              {STEPS.map(([title, text]) => (
                <div key={title} className="lp-step">
                  <h3>{title}</h3>
                  <p>{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" id="funciones" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="lp-head">
              <span className="eyebrow">Funciones</span>
              <h2 className="lp-title">Todo lo que necesitas para testear y vender.</h2>
              <p className="lp-sub">Sin Shopify, sin plantillas que configurar y sin pagar apps cada mes.</p>
            </div>
            <div className="bento">
              {FEATURES.map((f) => (
                <article key={f.title} className={`spot ${f.wide ? 'wide' : ''}`}>
                  <span className="spot-icon">
                    <Icon name={f.icon} size={18} strokeWidth={1.7} />
                  </span>
                  <h3>{f.title}</h3>
                  <p>{f.text}</p>
                  {f.tags && (
                    <div className="spot-tags">
                      {f.tags.map((t) => (
                        <span key={t}>{t}</span>
                      ))}
                    </div>
                  )}
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="lp-section" id="preguntas" style={{ paddingTop: 0 }}>
          <div className="container">
            <div className="lp-head center">
              <span className="eyebrow">Preguntas</span>
              <h2 className="lp-title">Lo que suelen preguntarnos.</h2>
            </div>
            <div className="lp-faq">
              {FAQ.map(([q, a]) => (
                <details key={q}>
                  <summary>{q}</summary>
                  <p>{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="container">
          <div className="lp-cta">
            <h2 className="lp-title">¿Tienes el producto? Ya tienes la tienda.</h2>
            <p className="lp-sub">Crea tu tienda gratis y publícala hoy mismo.</p>
            <div className="lp-ctas">
              <Link href="/crear" className="btn btn-primary btn-xl">
                Crear mi tienda gratis →
              </Link>
            </div>
          </div>
        </section>
      </main>

      <SiteFooter />
    </>
  );
}
