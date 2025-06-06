'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { toast } from 'react-hot-toast';

// Define forgot password schema
const forgotPasswordSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
});

type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;

export default function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: ForgotPasswordFormData) => {
    try {
      setIsLoading(true);
      setError(null);

      // Call the forgot password API
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'Failed to process request');
      }

      // Request successful
      setIsSubmitted(true);
      toast.success('Password reset instructions sent to your email');
    } catch (error) {
      console.error('Forgot password error:', error);
      setError(error instanceof Error ? error.message : 'An error occurred');
      toast.error('Failed to process request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-8 w-8 text-green-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold">Check Your Email</h2>
          <p className="text-gray-600">
            We've sent password reset instructions to your email address. Please check your inbox.
          </p>
          <div className="pt-4">
            <Link href="/login">
              <Button
                variant="outline"
                className="w-full"
              >
                Back to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <p className="text-gray-600 mb-6">
        Enter the email address associated with your account, and we'll send you instructions to reset your password.
      </p>
      
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium">
            Email Address
          </label>
          <Input
            id="email"
            type="email"
            placeholder="your.email@example.com"
            {...register('email')}
            disabled={isLoading}
            className={errors.email ? 'border-red-500' : ''}
          />
          {errors.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email.message}</p>
          )}
        </div>

        <Button
          type="submit"
          className="w-full bg-[#D23F57] hover:bg-[#b8354a] text-white"
          disabled={isLoading}
        >
          {isLoading ? 'Processing...' : 'Reset Password'}
        </Button>

        <div className="text-center mt-4">
          <Link href="/login" className="text-sm text-[#D23F57] hover:underline">
            Back to Login
          </Link>
        </div>
      </form>
    </div>
  );
} 