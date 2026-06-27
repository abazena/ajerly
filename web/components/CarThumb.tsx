// Thumbnail slot for car cards. Shows imageUrl when present, otherwise a car
// icon placeholder. Sized to match the existing card scale; a single source of
// truth so future image upload only changes this one component.
export default function CarThumb({ src, size = 38 }: { src?: string | null; size?: number }) {
  return (
    <span className="car-thumb" style={{ width: size, height: size }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" />
      ) : (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5 17h14M6.5 17l1-5.5a2 2 0 0 1 2-1.6h5a2 2 0 0 1 2 1.6l1 5.5" />
          <circle cx="8" cy="17.5" r="1.4" />
          <circle cx="16" cy="17.5" r="1.4" />
        </svg>
      )}
    </span>
  );
}
