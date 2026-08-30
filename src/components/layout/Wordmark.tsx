import { clsx } from 'clsx'
import acwaLogo from '../../assets/acwa-logo.jpg'

export function Wordmark({ compact }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-white p-1 shadow-[0_0_0_1px_rgba(255,255,255,0.08)]">
        <img src={acwaLogo} alt="ACWA Power" className="size-full object-contain" />
      </span>
      {!compact && (
        <div className="leading-tight">
          <p className="font-mono text-sm font-semibold tracking-wide text-text">PM Logbook</p>
          <p className={clsx('text-[11px] text-text-faint')}>Aldur-2 Power &amp; Water Services</p>
        </div>
      )}
    </div>
  )
}
