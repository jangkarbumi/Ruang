'use client';

import { AuthLayout } from '@/components/auth/AuthLayout';
import ForgotForm from '@/components/auth/ForgotForm';

export default function ForgotPasswordPage() {
  return (
    <AuthLayout>
      <ForgotForm />
    </AuthLayout>
  );
}
