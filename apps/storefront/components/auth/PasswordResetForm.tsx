'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

// Email schema for forgot password
const emailSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

// Reset password schema
const resetSchema = z.object({
  token: z.string().min(1, 'Token is required'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type EmailFormData = z.infer<typeof emailSchema>;
type ResetFormData = z.infer<typeof resetSchema>;

type FormMode = 'forgot' | 'reset';

interface PasswordResetFormProps {
  mode: FormMode;
  token?: string;
}

export default function PasswordResetForm({ mode, token = '' }: PasswordResetFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  // Email form (forgot password)
  const {
    register: registerEmail,
    handleSubmit: handleEmailSubmit,
    formState: { errors: emailErrors },
  } = useForm<EmailFormData>({
    resolver: zodResolver(emailSchema),
    defaultValues: {
      email: '',
    },
  });

  // Reset form
  const {
    register: registerReset,
    handleSubmit: handleResetSubmit,
    formState: { errors: resetErrors },
  } = useForm<ResetFormData>({
    resolver: zodResolver(resetSchema),
    defaultValues: {
      token: token,
      password: '',
      confirmPassword: '',
    },
  });

  // Handle forgot password submission
  const onForgotSubmit = async (data: EmailFormData) => {
    try {
      setIsLoading(true);
      setFormError(null);

      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: data.email }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to process request');
      }

      setIsSuccess(true);
      toast.success('Password reset email sent! Please check your inbox.');
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An error occurred');
      toast.error('Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle reset password submission
  const onResetSubmit = async (data: ResetFormData) => {
    try {
      setIsLoading(true);
      setFormError(null);

      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: data.token,
          password: data.password,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to reset password');
      }

      setIsSuccess(true);
      toast.success('Password reset successful!');
      
      // Redirect to login after short delay
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (error) {
      setFormError(error instanceof Error ? error.message : 'An error occurred');
      toast.error('Failed to reset password. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {formError && (
        <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
          {formError}
        </div>
      )}

      {isSuccess ? (
        <div className="text-center space-y-4">
          {mode === 'forgot' ? (
            <>
              <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-md">
                <p>We've sent a password reset link to your email address.</p>
                <p className="mt-2">Please check your inbox and follow the instructions.</p>
              </div>
              <Button
                type="button"
                className="mt-4"
                onClick={() => router.push('/login')}
              >
                Return to Login
              </Button>
            </>
          ) : (
            <>
              <div className="p-3 bg-green-50 border border-green-200 text-green-600 rounded-md">
                <p>Your password has been successfully reset!</p>
                <p className="mt-2">You will be redirected to the login page shortly.</p>
              </div>
              <Button
                type="button"
                className="mt-4"
                onClick={() => router.push('/login')}
              >
                Go to Login
              </Button>
            </>
          )}
        </div>
      ) : (
        <>
          {mode === 'forgot' ? (
            <>
              <h2 className="text-xl font-semibold mb-4">Forgot Password</h2>
              <p className="text-gray-600 mb-4">Enter your email address and we'll send you a link to reset your password.</p>
              
              <form onSubmit={handleEmailSubmit(onForgotSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium">
                    Email
                  </label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="your.email@example.com"
                    {...registerEmail('email')}
                    disabled={isLoading}
                    className={emailErrors.email ? 'border-red-500' : ''}
                  />
                  {emailErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{emailErrors.email.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Button>

                <div className="text-center mt-4">
                  <p className="text-sm text-gray-600">
                    Remember your password?{' '}
                    <Link href="/login" className="text-blue-600 hover:underline">
                      Login
                    </Link>
                  </p>
                </div>
              </form>
            </>
          ) : (
            <>
              <h2 className="text-xl font-semibold mb-4">Reset Password</h2>
              <p className="text-gray-600 mb-4">Enter your new password below.</p>
              
              <form onSubmit={handleResetSubmit(onResetSubmit)} className="space-y-4">
                <input type="hidden" {...registerReset('token')} />

                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium">
                    New Password
                  </label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    {...registerReset('password')}
                    disabled={isLoading}
                    className={resetErrors.password ? 'border-red-500' : ''}
                  />
                  {resetErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{resetErrors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <label htmlFor="confirmPassword" className="block text-sm font-medium">
                    Confirm Password
                  </label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    {...registerReset('confirmPassword')}
                    disabled={isLoading}
                    className={resetErrors.confirmPassword ? 'border-red-500' : ''}
                  />
                  {resetErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{resetErrors.confirmPassword.message}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? 'Resetting...' : 'Reset Password'}
                </Button>
              </form>
            </>
          )}
        </>
      )}
    </div>
  );
} 