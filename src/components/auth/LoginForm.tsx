'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, AlertCircle, CheckCircle2 } from 'lucide-react';
import { loginAction } from '@/server/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { emailOk } from '@/lib/validation';
import { FormInput } from './FormInput';
import { FormShell, Heading, Divider } from './AuthLayout';

type Errors = Record<string, string>;

export default function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!email) next.email = 'This field is required';
    else if (!emailOk(email)) next.email = 'Enter a valid email address';
    if (!password) next.password = 'This field is required';

    setErrors(next);
    setBanner(null);
    if (Object.keys(next).length) return;

    setLoading(true);
    const nextPath = new URLSearchParams(window.location.search).get('next');
    loginAction({ email, password, next: nextPath })
      .then((res) => {
        if (res.ok) {
          setBanner({ kind: 'success', msg: 'Login successful' });
          router.push(res.redirectTo);
          return;
        }
        setLoading(false);
        if (res.errors) setErrors(res.errors);
        setBanner({ kind: 'error', msg: res.message });
      })
      .catch(() => {
        setLoading(false);
        setBanner({ kind: 'error', msg: 'Something went wrong. Please try again' });
      });
  };

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
            <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
              Forgot password?
            </Link>
          </div>
        </div>

        <Button type="submit" className="w-full h-11 mt-2" disabled={loading}>
          {loading ? 'Logging in...' : 'Login'}
        </Button>
      </form>

      <div className="my-6">
        <Divider />
      </div>

      <p className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Register
        </Link>
      </p>
    </FormShell>
  );
}
