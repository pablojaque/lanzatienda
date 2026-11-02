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

// Tipografías de Google Fonts para las tiendas (todas comprobadas: la petición de cada una responde bien).
// display: letra decorativa; en la tienda solo se usa en títulos, precios y botones (el resto, en una letra legible)
export const FONT_CATEGORIES = [
  { id: 'moderna', name: 'Modernas' },
  { id: 'elegante', name: 'Elegantes' },
  { id: 'impacto', name: 'Impacto' },
  { id: 'redondeada', name: 'Redondeadas' },
  { id: 'manuscrita', name: 'Manuscritas' },
  { id: 'tecnica', name: 'Técnicas' },
];

export const FONTS = [
  { name: 'Poppins', family: "'Poppins', sans-serif", google: 'Poppins:wght@400;600;800', category: 'moderna', vibe: 'Moderna y amigable' },
  { name: 'Montserrat', family: "'Montserrat', sans-serif", google: 'Montserrat:wght@400;600;800', category: 'moderna', vibe: 'Fuerte y directa' },
  { name: 'Inter', family: "'Inter', sans-serif", google: 'Inter:wght@400;600;800', category: 'moderna', vibe: 'Limpia y tecnológica' },
  { name: 'Outfit', family: "'Outfit', sans-serif", google: 'Outfit:wght@400;600;800', category: 'moderna', vibe: 'Fresca y joven' },
  { name: 'DM Sans', family: "'DM Sans', sans-serif", google: 'DM+Sans:wght@400;600;800', category: 'moderna', vibe: 'Sencilla y elegante' },
  { name: 'Manrope', family: "'Manrope', sans-serif", google: 'Manrope:wght@400;600;800', category: 'moderna', vibe: 'Startup y tecnología' },
  { name: 'Plus Jakarta Sans', family: "'Plus Jakarta Sans', sans-serif", google: 'Plus+Jakarta+Sans:wght@400;600;800', category: 'moderna', vibe: 'Actual y cercana' },
  { name: 'Raleway', family: "'Raleway', sans-serif", google: 'Raleway:wght@400;600;800', category: 'moderna', vibe: 'Fina y con estilo' },
  { name: 'Rubik', family: "'Rubik', sans-serif", google: 'Rubik:wght@400;600;800', category: 'moderna', vibe: 'Suave y con carácter' },
  { name: 'Work Sans', family: "'Work Sans', sans-serif", google: 'Work+Sans:wght@400;600;800', category: 'moderna', vibe: 'Práctica y clara' },
  { name: 'Urbanist', family: "'Urbanist', sans-serif", google: 'Urbanist:wght@400;600;800', category: 'moderna', vibe: 'Geométrica y urbana' },
  { name: 'Sora', family: "'Sora', sans-serif", google: 'Sora:wght@400;600;800', category: 'moderna', vibe: 'Futurista y limpia' },
  { name: 'Lexend', family: "'Lexend', sans-serif", google: 'Lexend:wght@400;600;800', category: 'moderna', vibe: 'Muy fácil de leer' },
  { name: 'Figtree', family: "'Figtree', sans-serif", google: 'Figtree:wght@400;600;800', category: 'moderna', vibe: 'Amable y moderna' },
  { name: 'Archivo', family: "'Archivo', sans-serif", google: 'Archivo:wght@400;600;800', category: 'moderna', vibe: 'Sólida y versátil' },
  { name: 'Barlow', family: "'Barlow', sans-serif", google: 'Barlow:wght@400;600;800', category: 'moderna', vibe: 'Deportiva y técnica' },
  { name: 'Space Grotesk', family: "'Space Grotesk', sans-serif", google: 'Space+Grotesk:wght@400;600;700', category: 'moderna', vibe: 'Gadgets y tech' },
  { name: 'Syne', family: "'Syne', sans-serif", google: 'Syne:wght@400;600;800', category: 'impacto', vibe: 'Creativa y atrevida' },
  { name: 'Unbounded', family: "'Unbounded', sans-serif", google: 'Unbounded:wght@400;600;800', category: 'impacto', vibe: 'Ancha y llamativa' },
  { name: 'Kanit', family: "'Kanit', sans-serif", google: 'Kanit:wght@400;600;800', category: 'impacto', vibe: 'Fitness y energía' },
  { name: 'Oswald', family: "'Oswald', sans-serif", google: 'Oswald:wght@400;600;700', category: 'impacto', vibe: 'Alta y contundente' },
  { name: 'Bebas Neue', family: "'Bebas Neue', sans-serif", google: 'Bebas+Neue', category: 'impacto', vibe: 'Titulares de impacto', display: true },
  { name: 'Anton', family: "'Anton', sans-serif", google: 'Anton', category: 'impacto', vibe: 'Grande y potente', display: true },
  { name: 'Archivo Black', family: "'Archivo Black', sans-serif", google: 'Archivo+Black', category: 'impacto', vibe: 'Gruesa y directa', display: true },
  { name: 'Righteous', family: "'Righteous', sans-serif", google: 'Righteous', category: 'impacto', vibe: 'Retro y gamer', display: true },
  { name: 'Nunito', family: "'Nunito', sans-serif", google: 'Nunito:wght@400;700;900', category: 'redondeada', vibe: 'Suave, mascotas y bebés' },
  { name: 'Quicksand', family: "'Quicksand', sans-serif", google: 'Quicksand:wght@400;600;700', category: 'redondeada', vibe: 'Ligera y simpática' },
  { name: 'Fredoka', family: "'Fredoka', sans-serif", google: 'Fredoka:wght@400;600;700', category: 'redondeada', vibe: 'Divertida y juguetona' },
  { name: 'Baloo 2', family: "'Baloo 2', sans-serif", google: 'Baloo+2:wght@400;600;800', category: 'redondeada', vibe: 'Infantil y alegre' },
  { name: 'Comfortaa', family: "'Comfortaa', sans-serif", google: 'Comfortaa:wght@400;600;700', category: 'redondeada', vibe: 'Redonda y tranquila' },
  { name: 'Varela Round', family: "'Varela Round', sans-serif", google: 'Varela+Round', category: 'redondeada', vibe: 'Cercana y amable' },
  { name: 'Josefin Sans', family: "'Josefin Sans', serif", google: 'Josefin+Sans:wght@400;600;700', category: 'elegante', vibe: 'Vintage y elegante' },
  { name: 'Playfair Display', family: "'Playfair Display', serif", google: 'Playfair+Display:wght@400;600;800', category: 'elegante', vibe: 'Lujo y belleza' },
  { name: 'Lora', family: "'Lora', serif", google: 'Lora:wght@400;600;700', category: 'elegante', vibe: 'Natural y artesanal' },
  { name: 'Cormorant Garamond', family: "'Cormorant Garamond', serif", google: 'Cormorant+Garamond:wght@400;600;700', category: 'elegante', vibe: 'Joyería y alta gama' },
  { name: 'DM Serif Display', family: "'DM Serif Display', serif", google: 'DM+Serif+Display', category: 'elegante', vibe: 'Revista de moda' },
  { name: 'Libre Baskerville', family: "'Libre Baskerville', serif", google: 'Libre+Baskerville:wght@400;700', category: 'elegante', vibe: 'Clásica y seria' },
  { name: 'Merriweather', family: "'Merriweather', serif", google: 'Merriweather:wght@400;700;900', category: 'elegante', vibe: 'Editorial y confiable' },
  { name: 'Fraunces', family: "'Fraunces', serif", google: 'Fraunces:wght@400;600;800', category: 'elegante', vibe: 'Cálida y con personalidad' },
  { name: 'Bodoni Moda', family: "'Bodoni Moda', serif", google: 'Bodoni+Moda:wght@400;600;800', category: 'elegante', vibe: 'Moda y perfumes' },
  { name: 'Cinzel', family: "'Cinzel', serif", google: 'Cinzel:wght@400;600;800', category: 'elegante', vibe: 'Mayúsculas de lujo', display: true },
  { name: 'EB Garamond', family: "'EB Garamond', serif", google: 'EB+Garamond:wght@400;600;800', category: 'elegante', vibe: 'Libros y tradición' },
  { name: 'Prata', family: "'Prata', serif", google: 'Prata', category: 'elegante', vibe: 'Cosmética premium' },
  { name: 'Marcellus', family: "'Marcellus', serif", google: 'Marcellus', category: 'elegante', vibe: 'Spa y bienestar' },
  { name: 'Pacifico', family: "'Pacifico', cursive", google: 'Pacifico', category: 'manuscrita', vibe: 'Playa y verano', display: true },
  { name: 'Caveat', family: "'Caveat', cursive", google: 'Caveat:wght@400;600;700', category: 'manuscrita', vibe: 'Escrita a mano', display: true },
  { name: 'Dancing Script', family: "'Dancing Script', cursive", google: 'Dancing+Script:wght@400;600;700', category: 'manuscrita', vibe: 'Romántica y dulce', display: true },
  { name: 'Permanent Marker', family: "'Permanent Marker', cursive", google: 'Permanent+Marker', category: 'manuscrita', vibe: 'Rotulador urbano', display: true },
  { name: 'Lobster', family: "'Lobster', cursive", google: 'Lobster', category: 'manuscrita', vibe: 'Retro y llamativa', display: true },
  { name: 'Space Mono', family: "'Space Mono', monospace", google: 'Space+Mono:wght@400;700', category: 'tecnica', vibe: 'Código y tecnología' },
  { name: 'JetBrains Mono', family: "'JetBrains Mono', monospace", google: 'JetBrains+Mono:wght@400;600;800', category: 'tecnica', vibe: 'Gamer y programación' },
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
