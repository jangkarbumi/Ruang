'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, Lock, User, AlertCircle, CheckCircle2 } from 'lucide-react';
import { registerAction } from '@/server/actions/auth-actions';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { emailOk } from '@/lib/validation';
import { FormInput } from './FormInput';
import { FormShell, Heading } from './AuthLayout';

type Errors = Record<string, string>;

export default function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<Errors>({});
  const [banner, setBanner] = useState<{ kind: 'success' | 'error'; msg: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const pwOk = password.length >= 8;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const next: Errors = {};
    if (!name) next.name = 'This field is required';
    if (!email) next.email = 'This field is required';
    else if (!emailOk(email)) next.email = 'Enter a valid email address';
    if (!password) next.password = 'This field is required';
    else if (!pwOk) next.password = 'Password must be at least 8 characters';

    setErrors(next);
    setBanner(null);
    if (Object.keys(next).length) return;

    setLoading(true);
    registerAction({ name, email, password })
      .then((res) => {
        setLoading(false);
        if (res.ok) {
          setBanner({ kind: 'success', msg: 'Registration submitted. You can log in after an admin verifies your account' });
          return;
        }
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
          {loading ? 'Registering...' : 'Register'}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Login
        </Link>
      </p>
    </FormShell>
  );
}
