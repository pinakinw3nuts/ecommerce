'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/Select';
import { Label } from '@/components/ui/Label';
import { toast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

// Form validation schema
const userSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  role: z.enum(['ADMIN', 'USER']),
  status: z.enum(['active', 'banned']),
  password: z.string().min(8, 'Password must be at least 8 characters').optional(),
});

type UserFormData = z.infer<typeof userSchema>;

// Fetcher function for user data
const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = await res.json();
    if (error.code === 'TOKEN_EXPIRED') {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `/login?returnUrl=${returnUrl}`;
      return;
    }
    throw new Error(error.message || 'Failed to fetch user');
  }
  return res.json();
};

export default function UserDetailsPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(!params.id.startsWith('new'));
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<UserFormData | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm<UserFormData>({
    resolver: zodResolver(userSchema),
    defaultValues: {
      name: '',
      email: '',
      role: 'USER',
      status: 'active',
    },
  });

  // Fetch user data if editing
  useEffect(() => {
    if (params.id === 'new') {
      setIsLoading(false);
      return;
    }

    const fetchUser = async () => {
      try {
        const data = await fetcher(`/api/users/${params.id}`);
        setUser(data);
        reset({
          name: data.name,
          email: data.email,
          role: data.role,
          status: data.status,
        });
      } catch (err: any) {
        setError(err.message || 'Failed to load user');
        toast.error(err.message || 'Failed to load user');
      } finally {
        setIsLoading(false);
      }
    };

    fetchUser();
  }, [params.id, reset, toast]);

  const onSubmit = async (data: UserFormData) => {
    try {
      setIsSubmitting(true);
      const isNewUser = params.id === 'new';
      const url = isNewUser ? '/api/users' : `/api/users/${params.id}`;
      const method = isNewUser ? 'POST' : 'PATCH';

      // Remove password field if it's empty or if updating existing user
      const submitData = { ...data };
      if (!isNewUser || !submitData.password) {
        delete submitData.password;
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      });

      if (!response.ok) {
        const error = await response.json();
        if (error.code === 'TOKEN_EXPIRED') {
          const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
          window.location.href = `/login?returnUrl=${returnUrl}`;
          return;
        }
        throw new Error(error.message || `Failed to ${isNewUser ? 'create' : 'update'} user`);
      }

      toast.success(`User ${isNewUser ? 'created' : 'updated'} successfully`);
      
      router.push('/users');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'Something went wrong');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (error) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4">
        <p className="text-red-600">{error}</p>
        <Button
          variant="outline"
          onClick={() => router.back()}
          className="mt-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Go Back
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h1 className="text-2xl font-semibold text-gray-900">
          {params.id === 'new' ? 'Add New User' : isLoading ? 'Loading...' : `Edit User: ${user?.name}`}
        </h1>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
          <div className="grid grid-cols-1 gap-6">
            <div>
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                {...register('name')}
                className={cn("mt-1", errors.name && "border-red-500")}
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                {...register('email')}
                className={cn("mt-1", errors.email && "border-red-500")}
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {params.id === 'new' && (
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...register('password')}
                  className={cn("mt-1", errors.password && "border-red-500")}
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>
            )}

            <div>
              <Label htmlFor="role">Role</Label>
              <Select
                value={user?.role}
                onValueChange={(value) => setValue('role', value as 'ADMIN' | 'USER')}
              >
                <SelectTrigger id="role" className="mt-1">
                  <SelectValue placeholder="Select role" />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="USER">User</SelectItem>
                  <SelectItem value="ADMIN">Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="status">Status</Label>
              <Select
                value={user?.status}
                onValueChange={(value) => setValue('status', value as 'active' | 'banned')}
              >
                <SelectTrigger id="status" className="mt-1">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent className="z-[100]">
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="banned">Banned</SelectItem>
                </SelectContent>
              </Select>
              {errors.status && (
                <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6 border-t">
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {params.id === 'new' ? 'Create User' : 'Save Changes'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
} 