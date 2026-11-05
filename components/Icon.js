// Iconos de línea de toda la web (mismo trazo y tamaño de caja: 24×24)
const PATHS = {
  bolt: <path d="M13 2 4 14h7l-1 8 9-12h-7l1-8z" />,
  card: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="M2.5 10h19M7 15h3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9.5" />
      <path d="M2.5 12h19M12 2.5c2.6 2.8 3.9 6 3.9 9.5s-1.3 6.7-3.9 9.5c-2.6-2.8-3.9-6-3.9-9.5S9.4 5.3 12 2.5z" />
    </>
  ),
  chart: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />,
  layers: <path d="m12 3 9.5 5-9.5 5-9.5-5L12 3zm-9.5 9 9.5 5 9.5-5M2.5 16l9.5 5 9.5-5" />,
  edit: <path d="M4 20h4L19.5 8.5a2.8 2.8 0 0 0-4-4L4 16v4zM13.5 6.5l4 4" />,
  phone: (
    <>
      <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
      <path d="M11 18.5h2" />
    </>
  ),
  bag: <path d="M5 8h14l-1 12.5H6L5 8zm4 0V6.5a3 3 0 0 1 6 0V8" />,
  box: <path d="m12 2.5 8.5 4.5v10L12 21.5 3.5 17V7L12 2.5zM3.5 7 12 11.5 20.5 7M12 11.5v10" />,
  external: <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />,
  trash: <path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13M10 11v5M14 11v5" />,
  plus: <path d="M12 5v14M5 12h14" />,
  check: <path d="m5 12.5 4.5 4.5L19 7.5" />,
  lock: (
    <>
      <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
      <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
    </>
  ),
  mail: (
    <>
      <rect x="2.5" y="5" width="19" height="14" rx="2.5" />
      <path d="m3 6.5 9 6.5 9-6.5" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21a8 8 0 0 1 16 0" />
    </>
  ),
  tool: <path d="M14.5 6.5a4.5 4.5 0 0 0 5.6 5.6L21 13l-8 8-3-3 8-8-.9-.9a4.5 4.5 0 0 1-5.6-5.6l2.6 2.6 2.1-.6.6-2.1-2.6-2.6z" />,
  rocket: (
    <>
      <path d="M12 3c3.5 2 5.5 5.5 5 10l-2.5 3h-5L7 13c-.5-4.5 1.5-8 5-10z" />
      <circle cx="12" cy="9.5" r="1.8" />
      <path d="M9.5 16 8 20l2.5-1.5M14.5 16 16 20l-2.5-1.5" />
    </>
  ),
  store: <path d="M4 9.5 5.5 4h13L20 9.5M4 9.5V20h16V9.5M4 9.5h16M9.5 20v-5h5v5" />,
  out: <path d="M15 4h4v16h-4M10 8l-4 4 4 4M6 12h10" />,
  close: <path d="M6 6l12 12M18 6 6 18" />,
  copy: (
    <>
      <rect x="8.5" y="8.5" width="12" height="12" rx="2.5" />
      <path d="M15.5 8.5V6a2.5 2.5 0 0 0-2.5-2.5H6A2.5 2.5 0 0 0 3.5 6v7A2.5 2.5 0 0 0 6 15.5h2.5" />
    </>
  ),
};

export default function Icon({ name, size = 16, strokeWidth = 1.8, className = '' }) {
  return (
    <svg
      className={`icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {PATHS[name]}
    </svg>
  );
}
