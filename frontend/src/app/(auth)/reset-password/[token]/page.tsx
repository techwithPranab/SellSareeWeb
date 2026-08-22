'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, Loader2, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import { authService } from '@/services/auth.service';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/validations/auth.schema';
import { APP_NAME } from '@/constants';

export default function ResetPasswordPage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const { register, handleSubmit, formState: { errors } } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!params.token) {
      toast.error('This password reset link is invalid.');
      return;
    }
    setSubmitting(true);
    try {
      await authService.resetPassword(params.token, data.password);
      toast.success('Password reset successfully. Please sign in.');
      router.replace('/login');
    } catch (error: unknown) {
      const message = (error as { response?: { data?: { message?: string } } }).response?.data?.message;
      toast.error(message || 'This reset link is invalid or has expired. Please request a new one.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl border border-border bg-white p-8 shadow-xl">
        <div className="mb-8 text-center">
          <Link href="/" className="mb-6 inline-flex items-center gap-2">
            <Image src="/images/pp-aura-mark.png" alt="" width={40} height={40} sizes="40px" className="h-10 w-10 object-contain" priority />
            <span className="font-playfair text-xl font-bold text-primary">{APP_NAME}</span>
          </Link>
          <h1 className="text-2xl font-bold text-foreground">Create a New Password</h1>
          <p className="mt-1 text-sm text-muted">Choose a secure password for your account.</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label htmlFor="new-password" className="label">New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input id="new-password" {...register('password')} type={showPassword ? 'text' : 'password'} autoComplete="new-password" placeholder="At least 8 characters" className="input-field pl-10 pr-10" />
              <button type="button" onClick={() => setShowPassword(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground" aria-label={showPassword ? 'Hide new password' : 'Show new password'}>
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
          </div>

          <div>
            <label htmlFor="confirm-new-password" className="label">Confirm New Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input id="confirm-new-password" {...register('confirmPassword')} type={showConfirmation ? 'text' : 'password'} autoComplete="new-password" placeholder="Re-enter your password" className="input-field pl-10 pr-10" />
              <button type="button" onClick={() => setShowConfirmation(value => !value)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground" aria-label={showConfirmation ? 'Hide confirmed password' : 'Show confirmed password'}>
                {showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="mt-1 text-xs text-red-500">{errors.confirmPassword.message}</p>}
          </div>

          <button type="submit" disabled={submitting} className="btn-primary flex w-full items-center justify-center gap-2">
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Resetting…</> : 'Reset Password'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted">
          Need another link? <Link href="/forgot-password" className="font-medium text-primary hover:underline">Request password reset</Link>
        </p>
      </div>
    </div>
  );
}
