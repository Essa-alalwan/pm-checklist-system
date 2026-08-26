import { clsx } from 'clsx'

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

export function getButtonClasses(variant: ButtonVariant = 'primary', size: ButtonSize = 'md', className?: string) {
  return clsx(
    'inline-flex items-center justify-center gap-2 rounded-lg font-semibold tracking-tight transition-colors duration-150 disabled:opacity-40 disabled:pointer-events-none select-none',
    size === 'md' && 'min-h-11 px-4 text-sm',
    size === 'lg' && 'min-h-14 px-6 text-base',
    variant === 'primary' && 'bg-brand text-[#04181e] hover:bg-brand-strong active:bg-brand shadow-[0_0_0_1px_var(--color-brand)]',
    variant === 'secondary' &&
      'bg-surface-2 text-text border border-border-strong hover:border-brand hover:text-brand-strong',
    variant === 'ghost' && 'text-text-muted hover:text-text hover:bg-surface-2',
    variant === 'danger' && 'bg-critical/10 text-critical border border-critical/40 hover:bg-critical/20',
    className,
  )
}
