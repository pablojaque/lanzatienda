'use client';

import { Section } from '@/components/editor/ui';

/** Paso 5: datos de la tienda, contacto, pagos, píxeles de anuncios y SEO. */
export default function LaunchStep({ store, setStore, editing, domain, setDomain, domainOk, linkOk, error }) {
  const set = (key) => (e) => setStore((s) => ({ ...s, [key]: e.target.value }));
  const setIn = (group, key) => (e) => setStore((s) => ({ ...s, [group]: { ...s[group], [key]: e.target.value } }));

  return (
    <>
      <h2>{editing ? 'Revisa y publica los cambios' : 'Últimos detalles y ¡a lanzar!'}</h2>
      <div className="form">
        <label>
          Nombre de tu tienda *
          <input value={store.storeName} onChange={set('storeName')} placeholder="Ej: GlowHome" maxLength={40} />
        </label>
        <label>
          Email de contacto
          <input type="email" value={store.contactEmail} onChange={set('contactEmail')} placeholder="hola@tutienda.com" />
          <span className="field-hint">Sale en la tienda y en sus políticas para que tus clientes te escriban.</span>
        </label>
        <div className="form-row">
          <label>
            WhatsApp
            <input value={store.whatsapp} onChange={set('whatsapp')} placeholder="34600123456" inputMode="tel" />
          </label>
          <label>
            Instagram
            <input value={store.social.instagram} onChange={setIn('social', 'instagram')} placeholder="@tutienda" />
          </label>
        </div>
        <label>
          TikTok
          <input value={store.social.tiktok} onChange={setIn('social', 'tiktok')} placeholder="@tutienda" />
          <span className="field-hint">El WhatsApp con el prefijo del país y sin espacios (34 para España).</span>
        </label>
        <label>
          Enlace de pago propio (opcional)
          <input value={store.paymentLink} onChange={set('paymentLink')} placeholder="https://buy.stripe.com/..." />
          {linkOk ? (
            <span className="field-hint">
              Si activas los cobros con tarjeta en «Mis tiendas», no hace falta: el pago se hace dentro de tu tienda.
            </span>
          ) : (
            <span className="field-error">Tiene que empezar por https://</span>
          )}
        </label>
        {!editing && (
          <label>
            Tu dominio (opcional)
            <input value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mitienda.com" />
            {domainOk ? (
              <span className="field-hint">¿Ya compraste un dominio? Ponlo aquí y lo conectamos. Si no, tu tienda tendrá un enlace gratis.</span>
            ) : (
              <span className="field-error">Escribe solo el dominio, por ejemplo: mitienda.com</span>
            )}
          </label>
        )}
      </div>

      <details className="ed-more">
        <summary>Píxeles de anuncios (Meta, TikTok, Google)</summary>
        <p className="ed-hint">
          Pega solo el ID del píxel. Medimos visitas, inicio de pago y compras para que tus anuncios aprendan.
        </p>
        <div className="form">
          <label>
            Meta Pixel ID (Facebook e Instagram)
            <input value={store.pixels.meta} onChange={setIn('pixels', 'meta')} placeholder="123456789012345" inputMode="numeric" />
          </label>
          <label>
            TikTok Pixel ID
            <input value={store.pixels.tiktok} onChange={setIn('pixels', 'tiktok')} placeholder="C1A2B3C4D5E6F7G8H9" />
          </label>
          <label>
            Google Analytics (GA4)
            <input value={store.pixels.ga} onChange={setIn('pixels', 'ga')} placeholder="G-XXXXXXXXXX" />
          </label>
        </div>
      </details>

      <details className="ed-more">
        <summary>Google (SEO)</summary>
        <p className="ed-hint">Cómo sale tu tienda en Google y al compartir el enlace. Si lo dejas vacío, usamos el nombre y la descripción.</p>
        <div className="form">
          <label>
            Título
            <input value={store.seo.title} onChange={setIn('seo', 'title')} maxLength={70} placeholder={store.storeName || 'Mi tienda'} />
          </label>
          <label>
            Descripción
            <textarea rows={2} value={store.seo.description} onChange={setIn('seo', 'description')} maxLength={160} />
          </label>
        </div>
      </details>

      <p className="ed-hint ed-legal">
        Tu tienda incluye páginas de envíos, devoluciones y privacidad (las piden TikTok y Meta para anunciarte). Son un texto
        general: revísalo y adáptalo a tu caso.
      </p>

      {error && <div className="alert">{error}</div>}
    </>
  );
}
