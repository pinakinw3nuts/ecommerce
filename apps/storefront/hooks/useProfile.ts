'use client';

import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { toast } from 'react-hot-toast';

export interface ProfileData {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface ProfileFormData {
  name: string;
  email: string;
  phone?: string;
}

export function useProfile() {
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch user profile
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);
      const { data } = await api.get('/v1/user/me');
      setProfile(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to fetch profile';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Update user profile
  const updateProfile = async (formData: ProfileFormData) => {
    try {
      setSaving(true);
      setError(null);
      const { data } = await api.patch('/v1/user/me', formData);
      setProfile(data);
      toast.success('Profile updated successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update profile';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Change password
  const changePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setSaving(true);
      setError(null);
      await api.post('/v1/user/change-password', {
        currentPassword,
        newPassword
      });
      toast.success('Password updated successfully');
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to change password';
      setError(errorMessage);
      toast.error(errorMessage);
      return false;
    } finally {
      setSaving(false);
    }
  };

  // Load profile on mount
  useEffect(() => {
    fetchProfile();
  }, []);

  return {
    profile,
    loading,
    saving,
    error,
    fetchProfile,
    updateProfile,
    changePassword
  };
} 