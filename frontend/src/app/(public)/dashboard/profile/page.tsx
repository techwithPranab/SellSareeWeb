'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Loader2, KeyRound } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { userService } from '@/services/user.service';
import { authService } from '@/services/auth.service';
import toast from 'react-hot-toast';

interface ProfileForm {
  name: string;
  phone: string;
}

interface PasswordForm {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export default function ProfilePage() {
  const { user, fetchCurrentUser } = useAuth();
  const [saving, setSaving] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<ProfileForm>({
    defaultValues: {
      name: user?.name ?? '',
      phone: user?.phone ?? '',
    },
  });

  const {
    register: registerPwd,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: pwdErrors },
    reset: resetPassword,
    watch,
  } = useForm<PasswordForm>();

  const onSubmit = async (data: ProfileForm) => {
    setSaving(true);
    try {
      await userService.updateProfile(data);
      await fetchCurrentUser();
      toast.success('Profile updated successfully');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setSavingPassword(true);
    try {
      await authService.changePassword(data.currentPassword, data.newPassword);
      toast.success('Password changed successfully');
      resetPassword();
    } catch {
      toast.error('Failed to change password. Check your current password.');
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-playfair text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground text-sm mt-1">Manage your personal information</p>
      </div>

      {/* Profile Info */}
      <div className="bg-white rounded-2xl border border-border p-6 max-w-lg">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <div>
            <label className="label">Full Name</label>
            <input {...register('name', { required: 'Name is required' })} className="input-field" />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message}</p>}
          </div>
          <div>
            <label className="label">Email</label>
            <input value={user?.email ?? ''} disabled className="input-field opacity-60" />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
          </div>
          <div>
            <label className="label">Phone</label>
            <input {...register('phone')} className="input-field" placeholder="10-digit mobile number" />
          </div>
          <div>
            <label className="label">Referral Code</label>
            <input value={user?.referralCode ?? ''} disabled className="input-field opacity-60 font-mono" />
            <p className="text-xs text-muted-foreground mt-1">Share this code with friends for bonus points</p>
          </div>
          <div>
            <label className="label">Loyalty Points</label>
            <p className="text-2xl font-bold text-primary">{user?.loyaltyPoints ?? 0} pts</p>
          </div>
          <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
            {saving && <Loader2 className="w-4 h-4 animate-spin" />}
            Save Changes
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-2xl border border-border p-6 max-w-lg">
        <h2 className="font-semibold text-foreground mb-5 flex items-center gap-2">
          <KeyRound className="w-4 h-4 text-primary" />
          Change Password
        </h2>
        <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5">
          <div>
            <label className="label">Current Password</label>
            <input
              type="password"
              {...registerPwd('currentPassword', { required: 'Current password is required' })}
              className="input-field"
              autoComplete="current-password"
            />
            {pwdErrors.currentPassword && (
              <p className="text-red-500 text-xs mt-1">{pwdErrors.currentPassword.message}</p>
            )}
          </div>
          <div>
            <label className="label">New Password</label>
            <input
              type="password"
              {...registerPwd('newPassword', {
                required: 'New password is required',
                minLength: { value: 8, message: 'Password must be at least 8 characters' },
                pattern: {
                  value: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
                  message: 'Must include uppercase, lowercase and a number',
                },
              })}
              className="input-field"
              autoComplete="new-password"
            />
            {pwdErrors.newPassword && (
              <p className="text-red-500 text-xs mt-1">{pwdErrors.newPassword.message}</p>
            )}
          </div>
          <div>
            <label className="label">Confirm New Password</label>
            <input
              type="password"
              {...registerPwd('confirmPassword', {
                required: 'Please confirm your new password',
                validate: (val) => val === watch('newPassword') || 'Passwords do not match',
              })}
              className="input-field"
              autoComplete="new-password"
            />
            {pwdErrors.confirmPassword && (
              <p className="text-red-500 text-xs mt-1">{pwdErrors.confirmPassword.message}</p>
            )}
          </div>
          <button type="submit" disabled={savingPassword} className="btn-primary flex items-center gap-2">
            {savingPassword && <Loader2 className="w-4 h-4 animate-spin" />}
            Update Password
          </button>
        </form>
      </div>
    </div>
  );
}

