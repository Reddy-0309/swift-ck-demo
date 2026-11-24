/** The product mark: a check inside a document fold — "approved knowledge". */
export function BrandGlyph({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M6 3h8l4 4v14H6z" />
      <path d="M9.5 13.5l2 2 3.5-4" />
    </svg>
  );
}
