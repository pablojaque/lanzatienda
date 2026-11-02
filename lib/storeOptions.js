export const COLORS = [
  { name: 'Negro elegante', value: '#111111' },
  { name: 'Azul confianza', value: '#2563eb' },
  { name: 'Verde fresco', value: '#16a34a' },
  { name: 'Rojo energía', value: '#dc2626' },
  { name: 'Naranja vibrante', value: '#ea580c' },
  { name: 'Morado premium', value: '#7c3aed' },
  { name: 'Rosa', value: '#db2777' },
  { name: 'Turquesa', value: '#0d9488' },
];

export const FONTS = [
  { name: 'Poppins', family: "'Poppins', sans-serif", google: 'Poppins:wght@400;600;800', vibe: 'Moderna y amigable' },
  { name: 'Montserrat', family: "'Montserrat', sans-serif", google: 'Montserrat:wght@400;600;800', vibe: 'Fuerte y directa' },
  { name: 'Inter', family: "'Inter', sans-serif", google: 'Inter:wght@400;600;800', vibe: 'Limpia y tecnológica' },
  { name: 'Outfit', family: "'Outfit', sans-serif", google: 'Outfit:wght@400;600;800', vibe: 'Fresca y joven' },
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", google: 'Space+Grotesk:wght@400;600;700', vibe: 'Gadgets y tech' },
  { name: 'Nunito', family: "'Nunito', sans-serif", google: 'Nunito:wght@400;700;900', vibe: 'Suave, mascotas y bebés' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", google: 'Playfair+Display:wght@400;600;800', vibe: 'Lujo y belleza' },
  { name: 'Lora', family: "'Lora', serif", google: 'Lora:wght@400;600;700', vibe: 'Natural y artesanal' },
];

// Fondo de la tienda
export const THEMES = [
  { id: 'light', name: 'Claro', desc: 'Fondo blanco, el clásico' },
  { id: 'dark', name: 'Oscuro', desc: 'Fondo negro, más premium' },
];

// Forma de los botones
export const BUTTON_STYLES = [
  { id: 'rounded', name: 'Redondeados', radius: '14px' },
  { id: 'pill', name: 'Píldora', radius: '999px' },
  { id: 'square', name: 'Rectos', radius: '4px' },
];

// Grupos en los que se enseñan los upsells en el editor
export const UPSELL_GROUPS = [
  { id: 'ticket', title: 'Sube el ticket medio' },
  { id: 'urgency', title: 'Urgencia y confianza' },
  { id: 'mobile', title: 'Móvil y contacto' },
];

// price: coste extra que paga el cliente si lo marca (solo en los extras del pedido)
export const UPSELLS = [
  { id: 'bundles', group: 'ticket', title: 'Packs por cantidad', desc: 'Compra 2 o 3 unidades con descuento. Tú eliges el % de cada pack.', recommended: true },
  { id: 'shippingProtection', group: 'ticket', title: 'Protección de envío', desc: 'Casilla extra en el pedido: cubre pérdida o rotura del paquete.', price: 2.99, recommended: true },
  { id: 'express', group: 'ticket', title: 'Envío exprés', desc: 'Opción para recibirlo antes pagando un extra.', price: 4.99 },
  { id: 'giftWrap', group: 'ticket', title: 'Envoltorio de regalo', desc: 'Para quien lo compra como regalo.', price: 1.99 },
  { id: 'promoCodes', group: 'ticket', title: 'Códigos de descuento', desc: 'Campo para cupones al pagar con tarjeta. Los códigos se crean en tu panel de Stripe.' },
  { id: 'freeShippingBar', group: 'urgency', title: 'Barra de anuncio', desc: 'Aviso arriba del todo. Por defecto: "Envío GRATIS en todos los pedidos". Puedes cambiar el texto.', recommended: true },
  { id: 'launchOffer', group: 'urgency', title: 'Oferta de lanzamiento (72 h)', desc: 'Cuenta atrás real de 72 horas desde que lanzas la tienda. Al acabar, desaparece.' },
  { id: 'deliveryEstimate', group: 'urgency', title: 'Fecha de entrega estimada', desc: '"Recíbelo entre el 12 y el 16 de marzo", calculado con tus días de envío.', recommended: true },
  { id: 'reviews', group: 'urgency', title: 'Opiniones de clientes', desc: 'Sección con las opiniones que escribas en «Contenido», con su nota media.' },
  { id: 'guarantee', group: 'urgency', title: 'Garantía de 30 días', desc: 'Sellos de garantía, pago seguro y devoluciones fáciles junto al botón de compra.', recommended: true },
  { id: 'trustBadges', group: 'urgency', title: 'Logos de métodos de pago', desc: 'Visa, Mastercard, Apple Pay y Google Pay bajo el botón: da confianza al pagar.', recommended: true },
  { id: 'faq', group: 'urgency', title: 'Preguntas frecuentes', desc: 'Dudas típicas de envío, devoluciones y pago. Puedes escribir las tuyas en «Contenido».', recommended: true },
  { id: 'stickyCart', group: 'mobile', title: 'Botón de compra fijo en móvil', desc: 'El botón "Comprar" siempre visible abajo de la pantalla en el móvil.', recommended: true },
  { id: 'whatsapp', group: 'mobile', title: 'Botón de WhatsApp', desc: 'Botón flotante para que te escriban por WhatsApp. Pon tu número en «Ajustes».' },
];

export const DEFAULT_UPSELLS = UPSELLS.filter((u) => u.recommended).map((u) => u.id);

// Lo que se rellena solo en una tienda nueva (el usuario lo puede cambiar)
export const DEFAULT_ANNOUNCEMENT = '🚚 Envío GRATIS en todos los pedidos';
export const DEFAULT_BUNDLE_OFFS = [10, 20];
export const DEFAULT_SHIPPING_DAYS = { min: 5, max: 9 };
export const DEFAULT_FAQ = [
  {
    q: '¿Cuánto tarda en llegar mi pedido?',
    a: 'Cuando tu pedido salga del almacén te enviaremos el número de seguimiento por email para que puedas ver en todo momento dónde está.',
  },
  { q: '¿Puedo devolverlo?', a: 'Sí. Tienes 30 días desde que lo recibes para devolverlo si no estás satisfecho.' },
  {
    q: '¿Es seguro pagar aquí?',
    a: 'Sí, el pago se procesa a través de una pasarela de pago segura y cifrada. Nunca vemos ni guardamos los datos de tu tarjeta.',
  },
];
