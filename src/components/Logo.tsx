import { cn } from '@/lib/utils'

/**
 * Brand mark: a friendly pastel sun-flower (recreated as scalable SVG so it
 * stays crisp at any size and works offline / in print).
 */
export function LogoMark({
  size = 40,
  className,
  spinning = false,
  eyes = 'closed',
  pupilOffset = { x: 0, y: 0 },
}: {
  size?: number
  className?: string
  spinning?: boolean
  /** 'closed' = serene curved eyes (brand default); 'open' = bright round eyes */
  eyes?: 'closed' | 'open'
  /** Optional offset to look towards a point/cursor */
  pupilOffset?: { x: number; y: number }
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={className}
      role="img"
      aria-label="Artechulate"
    >
      {/* 8 petals */}
      <g
        fill="#E8918C"
        style={
          spinning
            ? { transformOrigin: '50px 50px', animation: 'logo-spin 6s linear infinite' }
            : undefined
        }
      >
        {Array.from({ length: 8 }).map((_, i) => (
          <ellipse
            key={i}
            cx="50"
            cy="20"
            rx="9"
            ry="20"
            transform={`rotate(${i * 45} 50 50)`}
          />
        ))}
      </g>
      {/* center */}
      <circle cx="50" cy="50" r="22" fill="#F7D9D6" />
      {eyes === 'open' ? (
        /* bright round eyes with a shine */
        <g transform={`translate(${pupilOffset.x || 0}, ${pupilOffset.y || 0})`}>
          <circle cx="44" cy="47" r="4.2" fill="#3A3550" />
          <circle cx="56" cy="47" r="4.2" fill="#3A3550" />
          <circle cx="45.4" cy="45.6" r="1.3" fill="#fff" />
          <circle cx="57.4" cy="45.6" r="1.3" fill="#fff" />
        </g>
      ) : (
        /* serene closed eyes */
        <>
          <path
            d="M40 46 q4 5 8 0"
            fill="none"
            stroke="#3A3550"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
          <path
            d="M52 46 q4 5 8 0"
            fill="none"
            stroke="#3A3550"
            strokeWidth="2.4"
            strokeLinecap="round"
          />
        </>
      )}
      {/* smile */}
      <path
        d="M44 56 q6 7 12 0"
        fill="none"
        stroke="#3A3550"
        strokeWidth="2.4"
        strokeLinecap="round"
      />
      {/* cheeks */}
      <circle cx="38" cy="54" r="3" fill="#EFB4B0" />
      <circle cx="62" cy="54" r="3" fill="#EFB4B0" />
    </svg>
  )
}

/** In-page loading indicator using the brand mark with spinning petals. */
export function LogoSpinner({
  label,
  size = 52,
  className,
}: {
  label?: string
  size?: number
  className?: string
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center gap-3 py-16 text-sm text-muted-foreground',
        className
      )}
    >
      <LogoMark size={size} spinning />
      {label && <span>{label}</span>}
    </div>
  )
}

/** Mark + wordmark lockup. */
export function Logo({
  size = 40,
  showText = true,
  className,
  textClassName,
}: {
  size?: number
  showText?: boolean
  className?: string
  textClassName?: string
}) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <LogoMark size={size} />
      {showText && (
        <span
          className={cn(
            'text-xl font-bold tracking-tight text-foreground',
            textClassName
          )}
          style={{ fontFamily: 'Fredoka, system-ui, sans-serif' }}
        >
          ArTechulate
        </span>
      )}
    </span>
  )
}
