'use client';

import { useState } from 'react'

import { Alert, BackIcon, Button, Field, MailIcon, LockIcon, UserIcon } from './ui'

type View = 'login' | 'register' | 'forgot' | 'dashboard'
type Errors = Record<string, string>

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export default function AuthApp({ initialView = 'login' }: { initialView?: View }) {
  const [view, setView] = useState<View>(initialView)

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-mist p-0 sm:p-6">
      <div className="w-full max-w-[520px] bg-white px-6 py-12 sm:rounded-[28px] sm:px-10 sm:shadow-[0_30px_80px_-40px_rgba(13,27,64,0.35)] sm:ring-1 sm:ring-hair lg:px-14">
        <div className="flex items-center justify-center">
          {view === 'dashboard' ? (
            <Dashboard onBack={() => setView('login')} />
          ) : view === 'forgot' ? (
            <ForgotForm onBack={() => setView('login')} />
          ) : view === 'register' ? (
            <RegisterForm key="register" go={setView} />
          ) : (
            <LoginForm key="login" go={setView} />
          )}
        </div>
      </div>
    </div>
  )
}

/* ---------- Shared shell ---------- */

function FormShell({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-[400px] animate-rise">{children}</div>
}

function Divider() {
  return (
    <div className="flex items-center gap-4 py-1 text-mute">
      <span className="h-px flex-1 bg-hair" />
      <span className="text-[12px] font-medium tracking-wide">OR</span>
      <span className="h-px flex-1 bg-hair" />
    </div>
  )
}

/* ---------- Login ---------- */

function LoginForm({ go }: { go: (v: View) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (!email) next.email = 'This field is required'
    else if (!emailOk(email)) next.email = 'Enter a valid email address'
    if (!password) next.password = 'This field is required'
    setErrors(next)
    setBanner(null)
    if (Object.keys(next).length) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      // Demo credential check
      if (email === 'admin@campus.edu' && password === 'password123') {
        setBanner({ kind: 'success', msg: 'Login successful' })
        setTimeout(() => go('dashboard'), 900)
      } else {
        setBanner({ kind: 'error', msg: 'Email or password is incorrect' })
      }
    }, 850)
  }

  return (
    <FormShell>
      <Heading title="Welcome Back" subtitle="Login to your account" />

      {banner && (
        <div className="mb-5">
          <Alert kind={banner.kind}>{banner.msg}</Alert>
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-4">
        <Field
          id="login-email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          icon={<MailIcon />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          state={errors.email ? 'error' : email && emailOk(email) ? 'success' : 'default'}
          hint={errors.email}
        />
        <div>
          <Field
            id="login-password"
            label="Password"
            password
            placeholder="Enter your password"
            icon={<LockIcon />}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            state={errors.password ? 'error' : 'default'}
            hint={errors.password}
          />
          <div className="mt-2.5 flex justify-end">
            <button
              type="button"
              onClick={() => go('forgot')}
              className="text-[13px] font-medium text-navy-700 hover:text-navy-900 transition-colors"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button type="submit" loading={loading}>
          Login
        </Button>
      </form>

      <div className="my-6">
        <Divider />
      </div>

      <p className="text-center text-[14px] text-mute">
        Don&apos;t have an account?{' '}
        <button onClick={() => go('register')} className="font-semibold text-navy-700 hover:text-navy-900 transition-colors">
          Register
        </button>
      </p>

      <DemoHint />
    </FormShell>
  )
}

/* ---------- Register ---------- */

function RegisterForm({ go }: { go: (v: View) => void }) {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<Errors>({})
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null)
  const [loading, setLoading] = useState(false)

  const pwOk = password.length >= 8

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    const next: Errors = {}
    if (!name) next.name = 'This field is required'
    if (!email) next.email = 'This field is required'
    else if (!emailOk(email)) next.email = 'Enter a valid email address'
    if (!password) next.password = 'This field is required'
    else if (!pwOk) next.password = 'Password must be at least 8 characters'
    setErrors(next)
    setBanner(null)
    if (Object.keys(next).length) return

    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      // Demo: this address is "taken"
      if (email === 'taken@campus.edu') {
        setBanner({ kind: 'error', msg: 'Email already registered' })
      } else {
        setBanner({ kind: 'success', msg: 'Registration successful' })
      }
    }, 850)
  }

  return (
    <FormShell>
      <Heading title="Create Account" subtitle="Register to access campus facilities" />

      {banner && (
        <div className="mb-5">
          <Alert kind={banner.kind}>{banner.msg}</Alert>
        </div>
      )}

      <form onSubmit={submit} noValidate className="space-y-4">
        <Field
          id="reg-name"
          label="Full Name"
          placeholder="Enter your full name"
          icon={<UserIcon />}
          value={name}
          onChange={(e) => setName(e.target.value)}
          state={errors.name ? 'error' : name ? 'success' : 'default'}
          hint={errors.name}
        />
        <Field
          id="reg-email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          icon={<MailIcon />}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          state={errors.email ? 'error' : email && emailOk(email) ? 'success' : 'default'}
          hint={errors.email}
        />
        <Field
          id="reg-password"
          label="Password"
          password
          placeholder="Create password"
          icon={<LockIcon />}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          state={errors.password ? 'error' : password && pwOk ? 'success' : 'default'}
          hint={errors.password ?? (password && pwOk ? 'Looks good' : 'Minimum 8 characters')}
        />

        <Button type="submit" loading={loading}>
          Register
        </Button>
      </form>

      <p className="mt-6 text-center text-[14px] text-mute">
        Already have an account?{' '}
        <button onClick={() => go('login')} className="font-semibold text-navy-700 hover:text-navy-900 transition-colors">
          Login
        </button>
      </p>
    </FormShell>
  )
}

/* ---------- Forgot password ---------- */

function ForgotForm({ onBack }: { onBack: () => void }) {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return setError('This field is required')
    if (!emailOk(email)) return setError('Enter a valid email address')
    setError('')
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSent(true)
    }, 850)
  }

  return (
    <FormShell>
      <button
        onClick={onBack}
        className="mb-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-mute hover:text-navy-800 transition-colors"
      >
        <BackIcon className="w-4 h-4" /> Back to login
      </button>

      <Heading title="Reset Password" subtitle="Enter your email and we'll send a reset link" />

      {sent ? (
        <div className="space-y-6">
          <Alert kind="success">Reset link sent — check your inbox</Alert>
          <p className="text-[14px] leading-relaxed text-mute">
            We sent instructions to <span className="font-medium text-ink">{email}</span>. The link expires in 30 minutes.
          </p>
          <Button onClick={onBack}>Return to login</Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <Field
            id="forgot-email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            icon={<MailIcon />}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            state={error ? 'error' : email && emailOk(email) ? 'success' : 'default'}
            hint={error}
          />
          <Button type="submit" loading={loading}>
            Send reset link
          </Button>
        </form>
      )}
    </FormShell>
  )
}

/* ---------- Dashboard (flow endpoint) ---------- */

function Dashboard({ onBack }: { onBack: () => void }) {
  return (
    <FormShell>
      <div className="text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-ok-soft ring-1 ring-ok/20">
          <svg className="h-8 w-8 text-ok" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="m5 12.5 4.2 4.2L19 7" />
          </svg>
        </div>
        <h1 className="font-display text-[26px] font-semibold tracking-tight text-ink">You&apos;re in</h1>
        <p className="mt-2 text-[15px] text-mute">
          Welcome back to CampusReserve. Redirecting you to your dashboard&hellip;
        </p>
        <div className="mt-8">
          <Button onClick={onBack}>Back to login</Button>
        </div>
      </div>
    </FormShell>
  )
}

/* ---------- Bits ---------- */

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-7">
      <h1 className="font-display text-[28px] font-semibold tracking-tight text-ink">{title}</h1>
      <p className="mt-1.5 text-[15px] text-mute">{subtitle}</p>
    </div>
  )
}

function DemoHint() {
  return (
    <p className="mt-6 rounded-lg bg-mist px-3 py-2.5 text-center text-[12px] leading-relaxed text-mute">
      Demo login — <span className="font-medium text-ink/70">admin@campus.edu</span> / <span className="font-medium text-ink/70">password123</span>
    </p>
  )
}
