'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Mail, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { emailOk } from '@/lib/validation';
import { FormInput } from './FormInput';
import { FormShell, Heading } from './AuthLayout';

export default function ForgotForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return setError('This field is required');
    if (!emailOk(email)) return setError('Enter a valid email address');
    setError('');
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
    }, 850);
  };

  return (
    <FormShell>
      <Link
        href="/login"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="w-4 h-4" /> Back to login
      </Link>

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
          <Link href="/login" className="flex w-full justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground h-11 items-center">
            Return to login
          </Link>
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
            {loading ? 'Sending...' : 'Send reset link'}
          </Button>
        </form>
      )}
    </FormShell>
  );
}
