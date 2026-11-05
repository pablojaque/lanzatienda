import Link from 'next/link';
import { notFound } from 'next/navigation';
import Logo from '@/components/Logo';
import SiteFooter from '@/components/SiteFooter';
import { LEGAL, legalComplete } from '@/lib/legal';

const DOCS = {
  terminos: { title: 'Términos y condiciones', body: Terminos },
  privacidad: { title: 'Política de privacidad', body: Privacidad },
  cookies: { title: 'Política de cookies', body: Cookies },
};

export function generateStaticParams() {
  return Object.keys(DOCS).map((doc) => ({ doc }));
}

export async function generateMetadata({ params }) {
  const { doc } = await params;
  return { title: `${DOCS[doc]?.title || 'Legal'} — Dropshype` };
}

const contact = () => (LEGAL.email ? <a href={`mailto:${LEGAL.email}`}>{LEGAL.email}</a> : 'el email de contacto indicado arriba');

function Titular() {
  return (
    <ul className="legal-id">
      <li>
        <b>Titular:</b> {LEGAL.owner || 'pendiente de completar'}
      </li>
      <li>
        <b>NIF:</b> {LEGAL.nif || 'pendiente de completar'}
      </li>
      <li>
        <b>Dirección:</b> {LEGAL.address || 'pendiente de completar'}
      </li>
      <li>
        <b>Email:</b> {LEGAL.email ? contact() : 'pendiente de completar'}
      </li>
    </ul>
  );
}

function Terminos() {
  return (
    <>
      <p>
        Estos términos regulan el uso de Dropshype, un servicio para crear y publicar tiendas online. Al crear una cuenta los
        aceptas.
      </p>
      <h2>1. Quién presta el servicio</h2>
      <Titular />
      <h2>2. El servicio</h2>
      <p>
        Dropshype te permite crear tiendas online, publicarlas en internet, conectar un dominio, ver analíticas y, si lo
        activas, cobrar con tarjeta a través de Stripe. Crear y publicar tiendas es gratis. Algunas funciones, como comprar un
        dominio, tienen un precio que se indica antes de pagar.
      </p>
      <h2>3. Tu cuenta</h2>
      <p>
        Debes tener al menos 18 años y dar datos reales. Eres responsable de guardar tu contraseña y de lo que se haga con tu
        cuenta. Puedes borrar tu cuenta cuando quieras desde «Ajustes de cuenta».
      </p>
      <h2>4. Tus tiendas y lo que vendes</h2>
      <p>
        Tú eres el vendedor de los productos de tus tiendas, no Dropshype. Eres responsable de los textos, fotos, precios y
        productos que publicas, de cumplir la normativa de consumo (información al cliente, plazos de envío, derecho de
        desistimiento, garantías), de atender a tus clientes y de tus obligaciones fiscales.
      </p>
      <p>
        No está permitido vender productos ilegales, falsificados o peligrosos, publicar contenido que infrinja derechos de
        terceros ni usar opiniones o datos falsos para engañar a los compradores. Podemos retirar una tienda que incumpla estas
        normas.
      </p>
      <h2>5. Cobros con tarjeta</h2>
      <p>
        Los cobros dentro de las tiendas los procesa Stripe en una cuenta a tu nombre. Para usarlos debes aceptar las condiciones
        de Stripe, incluido su acuerdo de cuentas conectadas. Dropshype no guarda los datos de las tarjetas de tus clientes.
      </p>
      <h2>6. Dominios</h2>
      <p>
        Los dominios comprados en Dropshype se registran por un año y no se renuevan solos. Si una compra falla después de pagar,
        te devolvemos el dinero.
      </p>
      <h2>7. Disponibilidad y responsabilidad</h2>
      <p>
        Intentamos que el servicio funcione siempre, pero puede haber cortes, por ejemplo por mantenimiento o por problemas de
        nuestros proveedores. Dropshype no responde de las ventas que dejes de hacer ni de las decisiones de terceros, como el
        bloqueo de una tienda por una plataforma de anuncios.
      </p>
      <h2>8. Cambios y ley aplicable</h2>
      <p>
        Si cambiamos estos términos te avisaremos. Se rigen por la ley española. Si eres consumidor, puedes acudir a los
        tribunales de tu domicilio.
      </p>
    </>
  );
}

function Privacidad() {
  return (
    <>
      <p>Aquí te explicamos qué datos personales tratamos en Dropshype, para qué y qué derechos tienes.</p>
      <h2>1. Responsable</h2>
      <Titular />
      <h2>2. Qué datos tratamos</h2>
      <ul>
        <li>Datos de tu cuenta: email, nombre y contraseña (guardada cifrada).</li>
        <li>El contenido de tus tiendas: productos, fotos, textos y ajustes.</li>
        <li>
          Si compras un dominio: los datos del titular que pide el registro de dominios (nombre, dirección, teléfono y email).
        </li>
        <li>
          Analíticas de tus tiendas: visitas, origen y dispositivo de los visitantes, con un identificador aleatorio que no
          identifica a la persona.
        </li>
      </ul>
      <h2>3. Para qué y con qué base</h2>
      <p>
        Para darte el servicio que pides al crear tu cuenta (ejecución del contrato), para gestionar pagos y dominios, y para
        cumplir obligaciones legales. No vendemos tus datos ni los usamos para publicidad.
      </p>
      <h2>4. Con quién los compartimos</h2>
      <p>
        Solo con los proveedores que necesitamos para funcionar: Supabase (cuentas y base de datos), Vercel (publicación de las
        tiendas y dominios), Stripe (pagos) y Google Fonts (tipografías). Algunos están fuera de la UE y usan las garantías
        previstas por el RGPD, como las cláusulas contractuales tipo.
      </p>
      <h2>5. Cuánto tiempo</h2>
      <p>
        Mientras tengas la cuenta. Si la borras, se borran tus datos y tus tiendas, salvo lo que la ley nos obligue a conservar
        (por ejemplo, facturas).
      </p>
      <h2>6. Tus derechos</h2>
      <p>
        Puedes acceder a tus datos, corregirlos, borrarlos, oponerte o pedir su portabilidad escribiendo a {contact()}. Si no te
        atendemos bien, puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
      </p>
      <h2>7. Datos de los clientes de tus tiendas</h2>
      <p>
        Respecto a los datos de quienes compran en tu tienda, el responsable eres tú y Dropshype actúa como encargado del
        tratamiento: solo los usamos para darte el servicio.
      </p>
    </>
  );
}

function Cookies() {
  return (
    <>
      <p>Dropshype solo usa las cookies imprescindibles para funcionar. No usamos cookies de publicidad ni de seguimiento.</p>
      <h2>Cookies que usamos</h2>
      <ul>
        <li>
          <b>Sesión (Supabase):</b> mantienen tu sesión iniciada mientras usas Dropshype. Sin ellas no podrías entrar en tu
          cuenta.
        </li>
      </ul>
      <p>Al ser técnicas y necesarias, no hace falta pedir tu consentimiento para usarlas.</p>
      <h2>Tus tiendas</h2>
      <p>
        Las tiendas que creas cuentan las visitas de forma anónima. Si añades píxeles de anuncios (Meta, TikTok o Google), esos
        servicios usan sus propias cookies: en ese caso eres tú, como dueño de la tienda, quien debe informar a tus visitantes y
        pedir su consentimiento cuando la ley lo exija.
      </p>
      <h2>Cómo borrarlas</h2>
      <p>Puedes borrar las cookies desde los ajustes de tu navegador. Si borras la de sesión, tendrás que volver a entrar.</p>
    </>
  );
}

export default async function LegalPage({ params }) {
  const { doc } = await params;
  const page = DOCS[doc];
  if (!page) notFound();
  const Body = page.body;
  return (
    <>
      <header className="site-header">
        <div className="container row">
          <Logo />
          <Link href="/" className="logout">
            Volver
          </Link>
        </div>
      </header>
      <main className="container legal">
        <span className="eyebrow">Legal</span>
        <h1>{page.title}</h1>
        <p className="muted">Última actualización: {LEGAL.updated}</p>
        {!legalComplete() && (
          <div className="alert">Faltan los datos del titular de Dropshype. Se completarán en breve.</div>
        )}
        <Body />
      </main>
      <SiteFooter />
    </>
  );
}
