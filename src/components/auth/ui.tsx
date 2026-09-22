'use client';

import { useState } from 'react'
import type { InputHTMLAttributes, ReactNode } from 'react'

/* ---------- Icons (inline, 1.6px stroke) ---------- */

type IconProps = { className?: string }
const base = (className?: string) => `w-[18px] h-[18px] ${className ?? ''}`

export const MailIcon = ({ className }: IconProps) => (
  <svg className={base(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="m3.5 7 7.3 5.2a2 2 0 0 0 2.4 0L20.5 7" />
  </svg>
)

export const LockIcon = ({ className }: IconProps) => (
  <svg className={base(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <rect x="4.5" y="10.5" width="15" height="10" rx="2.5" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" />
  </svg>
)

export const UserIcon = ({ className }: IconProps) => (
  <svg className={base(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="8" r="3.6" />
    <path d="M5 19.5a7 7 0 0 1 14 0" />
  </svg>
)

export const EyeIcon = ({ className }: IconProps) => (
  <svg className={base(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
)

export const EyeOffIcon = ({ className }: IconProps) => (
  <svg className={base(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 4l16 16" />
    <path d="M9.9 5.8A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a15.9 15.9 0 0 1-3.3 3.9M6.6 7.6A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5a9.3 9.3 0 0 0 3.3-.6" />
    <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
  </svg>
)

export const CheckIcon = ({ className }: IconProps) => (
  <svg className={base(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m5 12.5 4.2 4.2L19 7" />
  </svg>
)

export const AlertIcon = ({ className }: IconProps) => (
  <svg className={base(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7.5v5M12 16h.01" />
  </svg>
)

export const ArrowIcon = ({ className }: IconProps) => (
  <svg className={base(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 12h15M13 6l6 6-6 6" />
  </svg>
)

export const BackIcon = ({ className }: IconProps) => (
  <svg className={base(className)} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 12H5M11 6l-6 6 6 6" />
  </svg>
)

/* ---------- Input field ---------- */

type FieldState = 'default' | 'success' | 'error'

type FieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  icon?: ReactNode
  state?: FieldState
  hint?: string
  password?: boolean
}

export function Field({ label, icon, state = 'default', hint, password, id, ...rest }: FieldProps) {
  const [show, setShow] = useState(false)
  const [focus, setFocus] = useState(false)

  const ring =
    state === 'error'
      ? 'border-err/60 focus-within:border-err focus-within:ring-err/15'
      : state === 'success'
        ? 'border-ok/60 focus-within:border-ok focus-within:ring-ok/15'
        : 'border-hair focus-within:border-navy-600 focus-within:ring-navy-600/12'

  const iconColor =
    state === 'error' ? 'text-err' : state === 'success' ? 'text-ok' : focus ? 'text-navy-700' : 'text-mute'

  return (
    <div className="space-y-1.5">
      <label htmlFor={id} className="block text-[13px] font-medium text-ink/80">
        {label}
      </label>
      <div
        className={`flex items-center gap-2.5 rounded-xl border bg-white px-3.5 h-12 transition-all duration-200 focus-within:ring-4 ${ring}`}
      >
        {icon && <span className={`shrink-0 transition-colors ${iconColor}`}>{icon}</span>}
        <input
          id={id}
          type={password ? (show ? 'text' : 'password') : rest.type ?? 'text'}
          onFocus={(e) => {
            setFocus(true)
            rest.onFocus?.(e)
          }}
          onBlur={(e) => {
            setFocus(false)
            rest.onBlur?.(e)
          }}
          {...rest}
          className="w-full bg-transparent text-[15px] text-ink placeholder:text-mute/70 outline-none"
        />
        {password && (
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="shrink-0 text-mute hover:text-navy-700 transition-colors"
          >
            {show ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        )}
        {state === 'success' && !password && <CheckIcon className="w-[18px] h-[18px] text-ok shrink-0" />}
      </div>
      {hint && (
        <p className={`text-[12.5px] ${state === 'error' ? 'text-err' : state === 'success' ? 'text-ok' : 'text-mute'}`}>
          {hint}
        </p>
      )}
    </div>
  )
}

/* ---------- Button ---------- */

type ButtonProps = {
  children: ReactNode
  onClick?: () => void
  type?: 'button' | 'submit'
  loading?: boolean
  disabled?: boolean
}

export function Button({ children, onClick, type = 'button', loading, disabled }: ButtonProps) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className="group relative flex w-full h-12 items-center justify-center gap-2 rounded-xl bg-navy-900 text-[15px] font-semibold text-white shadow-[0_8px_24px_-8px_rgba(13,27,64,0.55)] transition-all duration-200 hover:bg-navy-800 hover:shadow-[0_12px_30px_-8px_rgba(13,27,64,0.6)] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-55 disabled:shadow-none"
    >
      {loading ? (
        <span className="h-4.5 w-4.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
      ) : (
        <>
          {children}
          <ArrowIcon className="w-[18px] h-[18px] transition-transform duration-200 group-hover:translate-x-0.5" />
        </>
      )}
    </button>
  )
}

/* ---------- Alert ---------- */

export function Alert({ kind, children }: { kind: 'success' | 'error'; children: ReactNode }) {
  const ok = kind === 'success'
  return (
    <div
      role="alert"
      className={`flex items-center gap-2.5 rounded-xl border px-3.5 py-3 text-[13.5px] font-medium animate-rise ${
        ok ? 'border-ok/25 bg-ok-soft text-ok' : 'border-err/25 bg-err-soft text-err'
      }`}
    >
      <span className="shrink-0">{ok ? <CheckIcon className="w-[18px] h-[18px]" /> : <AlertIcon className="w-[18px] h-[18px]" />}</span>
      {children}
    </div>
  )
}
