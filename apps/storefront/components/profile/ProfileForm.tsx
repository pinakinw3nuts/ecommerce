'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useProfile, ProfileData } from '@/hooks/useProfile';

// Profile schema validation
const profileSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Please enter a valid email address'),
  phone: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

// Password change schema
const passwordSchema = z.object({
  currentPassword: z.string().min(8, 'Current password must be at least 8 characters'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
  confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type PasswordFormData = z.infer<typeof passwordSchema>;

export default function ProfileForm() {
  const { profile, loading, saving, error, updateProfile, changePassword } = useProfile();
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

  // Profile form
  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    reset: resetProfile,
    formState: { errors: profileErrors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
    },
  });

  // Password form
  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    reset: resetPassword,
    formState: { errors: passwordErrors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  // Update form values when profile data is loaded
  useEffect(() => {
    if (profile) {
      resetProfile({
        name: profile.name || '',
        email: profile.email || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, resetProfile]);

  // Handle profile update
  const onProfileSubmit = async (data: ProfileFormData) => {
    await updateProfile(data);
  };

  // Handle password update
  const onPasswordSubmit = async (data: PasswordFormData) => {
    const success = await changePassword(data.currentPassword, data.newPassword);
    if (success) {
      setIsPasswordModalOpen(false);
      resetPassword();
    }
  };

  if (loading) {
    return <div className="flex justify-center p-4">Loading profile...</div>;
  }

  return (
    <div className="space-y-8">
      {/* Profile Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <h2 className="text-xl font-semibold mb-4">Personal Information</h2>
        
        {error && (
          <div className="p-3 mb-4 bg-red-50 border border-red-200 text-red-600 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Full Name
            </label>
            <Input
              id="name"
              type="text"
              {...registerProfile('name')}
              disabled={saving}
              className={profileErrors.name ? 'border-red-500' : ''}
            />
            {profileErrors.name && (
              <p className="text-red-500 text-xs mt-1">{profileErrors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <Input
              id="email"
              type="email"
              {...registerProfile('email')}
              disabled={saving}
              className={profileErrors.email ? 'border-red-500' : ''}
            />
            {profileErrors.email && (
              <p className="text-red-500 text-xs mt-1">{profileErrors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium">
              Phone (optional)
            </label>
            <Input
              id="phone"
              type="text"
              {...registerProfile('phone')}
              disabled={saving}
            />
          </div>

          <div className="flex space-x-4 pt-2">
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsPasswordModalOpen(true)}
              disabled={saving}
            >
              Change Password
            </Button>
          </div>
        </form>
      </div>

      {/* Password Change Modal */}
      {isPasswordModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Change Password</h3>
            
            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="currentPassword" className="block text-sm font-medium">
                  Current Password
                </label>
                <Input
                  id="currentPassword"
                  type="password"
                  {...registerPassword('currentPassword')}
                  disabled={saving}
                  className={passwordErrors.currentPassword ? 'border-red-500' : ''}
                />
                {passwordErrors.currentPassword && (
                  <p className="text-red-500 text-xs mt-1">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="newPassword" className="block text-sm font-medium">
                  New Password
                </label>
                <Input
                  id="newPassword"
                  type="password"
                  {...registerPassword('newPassword')}
                  disabled={saving}
                  className={passwordErrors.newPassword ? 'border-red-500' : ''}
                />
                {passwordErrors.newPassword && (
                  <p className="text-red-500 text-xs mt-1">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label htmlFor="confirmPassword" className="block text-sm font-medium">
                  Confirm New Password
                </label>
                <Input
                  id="confirmPassword"
                  type="password"
                  {...registerPassword('confirmPassword')}
                  disabled={saving}
                  className={passwordErrors.confirmPassword ? 'border-red-500' : ''}
                />
                {passwordErrors.confirmPassword && (
                  <p className="text-red-500 text-xs mt-1">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsPasswordModalOpen(false)}
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={saving}
                >
                  {saving ? 'Updating...' : 'Update Password'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 