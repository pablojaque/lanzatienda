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

// price: coste extra que paga el cliente si lo marca (solo en los add-ons)
export const UPSELLS = [
  { id: 'bundles', title: 'Packs por cantidad', desc: 'Compra 2 y ahorra un 10%, compra 3 y ahorra un 20%. Sube el ticket medio.', recommended: true },
  { id: 'shippingProtection', title: 'Protección de envío', desc: 'Casilla extra en el pedido: cubre pérdida o rotura del paquete.', price: 2.99, recommended: true },
  { id: 'express', title: 'Envío exprés', desc: 'Opción para recibirlo antes pagando un extra.', price: 4.99 },
  { id: 'giftWrap', title: 'Envoltorio de regalo', desc: 'Para quien lo compra como regalo.', price: 1.99 },
  { id: 'freeShippingBar', title: 'Barra de envío gratis', desc: 'Aviso arriba del todo: "Envío GRATIS en todos los pedidos".', recommended: true },
  { id: 'launchOffer', title: 'Oferta de lanzamiento (72 h)', desc: 'Cuenta atrás real de 72 horas desde que lanzas la tienda. Al acabar, desaparece.' },
  { id: 'guarantee', title: 'Garantía de 30 días', desc: 'Sellos de garantía, pago seguro y devoluciones fáciles junto al botón de compra.', recommended: true },
  { id: 'faq', title: 'Preguntas frecuentes', desc: 'Sección con dudas típicas: envío, devoluciones, pago y seguimiento.', recommended: true },
  { id: 'stickyCart', title: 'Botón de compra fijo en móvil', desc: 'El botón "Comprar" siempre visible abajo de la pantalla en el móvil.', recommended: true },
];

export const DEFAULT_UPSELLS = UPSELLS.filter((u) => u.recommended).map((u) => u.id);
