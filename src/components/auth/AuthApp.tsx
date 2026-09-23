'use client';

import { useState } from 'react'
import { Mail, Lock, User, ArrowLeft, Eye, EyeOff, AlertCircle, CheckCircle2, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

type View = 'login' | 'register' | 'forgot' | 'dashboard'
type Errors = Record<string, string>

const emailOk = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)

export default function AuthApp({ initialView = 'login' }: { initialView?: View }) {
  const [view, setView] = useState<View>(initialView)

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/20 p-0 sm:p-6">
      <div className="w-full bg-background px-6 py-12 sm:rounded-3xl sm:px-10 sm:shadow-xl sm:border lg:px-14">
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

/* ---------- Shared Form Wrapper ---------- */

function FormInput({ 
  label, id, icon: Icon, type = 'text', hint, error, ...props 
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ElementType;
  hint?: string;
  error?: string;
}) {
  const [show, setShow] = useState(false)
  const isPassword = type === 'password'
  const inputType = isPassword ? (show ? 'text' : 'password') : type

  return (
    <div className="space-y-2">
      <Label htmlFor={id} className={error ? "text-destructive" : ""}>
        {label}
      </Label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <Input 
          id={id} 
          type={inputType} 
          className={`${Icon ? 'pl-9' : ''} ${error ? 'border-destructive focus-visible:ring-destructive' : ''}`}
          {...props} 
        />
        {isPassword && (
          <button 
            type="button" 
            onClick={() => setShow(!show)} 
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        )}
      </div>
      {(hint || error) && (
        <p className={`text-xs ${error ? 'text-destructive' : 'text-muted-foreground'}`}>
          {error || hint}
        </p>
      )}
    </div>
  )
}

function FormShell({ children }: { children: React.ReactNode }) {
  return <div className="w-full animate-in fade-in slide-in-from-bottom-2 duration-500">{children}</div>
}

function Divider() {
  return (
    <div className="flex items-center gap-4 py-1 text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium tracking-wide">OR</span>
      <span className="h-px flex-1 bg-border" />
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
        <Alert 
          variant={banner.kind === 'error' ? 'destructive' : 'default'} 
          className={`mb-5 ${banner.kind === 'success' ? 'border-green-500 text-green-700 bg-green-50' : ''}`}
        >
          {banner.kind === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-700!" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{banner.msg}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={submit} noValidate className="space-y-4">
        <FormInput
          id="login-email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <div>
          <FormInput
            id="login-password"
            label="Password"
            type="password"
            placeholder="Enter your password"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />
          <div className="mt-2.5 flex justify-end">
            <button
              type="button"
              onClick={() => go('forgot')}
              className="text-sm font-medium text-primary hover:underline"
            >
              Forgot password?
            </button>
          </div>
        </div>

        <Button type="submit" className="w-full h-11 mt-2" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </Button>
      </form>

      <div className="my-6">
        <Divider />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <button onClick={() => go('register')} className="font-semibold text-primary hover:underline">
          Register
        </button>
      </p>
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
        <Alert 
          variant={banner.kind === 'error' ? 'destructive' : 'default'} 
          className={`mb-5 ${banner.kind === 'success' ? 'border-green-500 text-green-700 bg-green-50' : ''}`}
        >
          {banner.kind === 'success' ? <CheckCircle2 className="h-4 w-4 text-green-700!" /> : <AlertCircle className="h-4 w-4" />}
          <AlertDescription>{banner.msg}</AlertDescription>
        </Alert>
      )}

      <form onSubmit={submit} noValidate className="space-y-4">
        <FormInput
          id="reg-name"
          label="Full Name"
          placeholder="Enter your full name"
          icon={User}
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
        />
        <FormInput
          id="reg-email"
          label="Email"
          type="email"
          placeholder="Enter your email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
        />
        <FormInput
          id="reg-password"
          label="Password"
          type="password"
          placeholder="Create password"
          icon={Lock}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          hint={password && pwOk ? 'Looks good' : 'Minimum 8 characters'}
        />

        <Button type="submit" className="w-full h-11 mt-2" disabled={loading}>
          {loading ? "Registering..." : "Register"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <button onClick={() => go('login')} className="font-semibold text-primary hover:underline">
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
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to login
      </button>

      <Heading title="Reset Password" subtitle="Enter your email and we'll send a reset link" />

      {sent ? (
        <div className="space-y-6">
          <Alert className="border-green-500 text-green-700 bg-green-50">
            <CheckCircle2 className="h-4 w-4 text-green-700!" />
            <AlertDescription>Reset link sent — check your inbox</AlertDescription>
          </Alert>
          <p className="text-sm leading-relaxed text-muted-foreground">
            We sent instructions to <span className="font-medium text-foreground">{email}</span>. The link expires in 30 minutes.
          </p>
          <Button onClick={onBack} variant="outline" className="w-full h-11">
            Return to login
          </Button>
        </div>
      ) : (
        <form onSubmit={submit} noValidate className="space-y-4">
          <FormInput
            id="forgot-email"
            label="Email"
            type="email"
            placeholder="Enter your email"
            icon={Mail}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={error}
          />
          <Button type="submit" className="w-full h-11" disabled={loading}>
            {loading ? "Sending..." : "Send reset link"}
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
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-green-50 border border-green-200">
          <Check className="h-8 w-8 text-green-600" />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">You&apos;re in</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Welcome back to CampusReserve. Redirecting you to your dashboard&hellip;
        </p>
        <div className="mt-8">
          <Button onClick={onBack} variant="outline" className="w-full h-11">
            Back to login
          </Button>
        </div>
      </div>
    </FormShell>
  )
}

/* ---------- Bits ---------- */

function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  )
}