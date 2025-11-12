'use client';

/**
 * User Settings Page
 * Personal settings for all users (profile, password)
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings, Save, User, Lock } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'attorney' | 'paralegal';
  firmId: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100)
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password must contain at least one uppercase letter, one lowercase letter, and one number'
    ),
  confirmPassword: z.string().min(1, 'Please confirm your new password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export default function SettingsPage() {
  const { accessToken, setUser: updateAuthUser } = useAuth();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successProfile, setSuccessProfile] = useState<string | null>(null);
  const [successPassword, setSuccessPassword] = useState<string | null>(null);
  const [errorProfile, setErrorProfile] = useState<string | null>(null);
  const [errorPassword, setErrorPassword] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleSubmitProfile,
    reset: resetProfile,
    formState: { errors: errorsProfile, isDirty: isDirtyProfile },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
    },
  });

  const {
    register: registerPassword,
    handleSubmit: handleSubmitPassword,
    reset: resetPassword,
    formState: { errors: errorsPassword },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    async function fetchUserProfile() {
      if (!accessToken) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/users/me', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch profile: ${response.statusText}`);
        }

        const data = await response.json();
        setUser(data.user);
        resetProfile({
          firstName: data.user.firstName,
          lastName: data.user.lastName,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    fetchUserProfile();
  }, [accessToken, resetProfile]);

  const onSubmitProfile = async (data: ProfileFormData) => {
    if (!accessToken) return;

    setSavingProfile(true);
    setErrorProfile(null);
    setSuccessProfile(null);

    try {
      const response = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update profile');
      }

      const result = await response.json();
      setUser(result.user);

      // Update auth store to refresh header
      updateAuthUser(result.user);

      setSuccessProfile('Profile updated successfully');
      resetProfile({
        firstName: result.user.firstName,
        lastName: result.user.lastName,
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessProfile(null), 3000);
    } catch (err) {
      setErrorProfile(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const onSubmitPassword = async (data: PasswordFormData) => {
    if (!accessToken) return;

    setSavingPassword(true);
    setErrorPassword(null);
    setSuccessPassword(null);

    try {
      const response = await fetch('/api/users/me/password', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to change password');
      }

      setSuccessPassword('Password changed successfully');
      resetPassword({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });

      // Clear success message after 3 seconds
      setTimeout(() => setSuccessPassword(null), 3000);
    } catch (err) {
      setErrorPassword(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error && !user) {
    return (
      <div className="rounded-md bg-red-50 border border-red-200 p-4">
        <p className="text-sm text-red-800">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-3">
        <Settings className="h-8 w-8 text-slate-700" />
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Settings</h1>
          <p className="text-slate-600">Manage your personal account settings</p>
        </div>
      </div>

      <Tabs defaultValue="profile" className="space-y-4">
        <TabsList>
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Lock className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your personal information</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Success/Error Messages */}
              {successProfile && (
                <div className="rounded-md bg-green-50 border border-green-200 p-4 mb-4">
                  <p className="text-sm text-green-800">{successProfile}</p>
                </div>
              )}
              {errorProfile && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-4">
                  <p className="text-sm text-red-800">{errorProfile}</p>
                </div>
              )}

              <form onSubmit={handleSubmitProfile(onSubmitProfile)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    {...registerProfile('firstName')}
                    placeholder="Enter your first name"
                  />
                  {errorsProfile.firstName && (
                    <p className="text-sm text-red-600">{errorsProfile.firstName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    {...registerProfile('lastName')}
                    placeholder="Enter your last name"
                  />
                  {errorsProfile.lastName && (
                    <p className="text-sm text-red-600">{errorsProfile.lastName.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="bg-slate-50"
                  />
                  <p className="text-sm text-slate-500">
                    Email address cannot be changed. Contact your admin if you need to update it.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={user?.role || ''}
                    disabled
                    className="bg-slate-50 capitalize"
                  />
                  <p className="text-sm text-slate-500">
                    Your role is managed by your firm administrator.
                  </p>
                </div>

                <Button type="submit" disabled={savingProfile || !isDirtyProfile}>
                  {savingProfile ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Change Password</CardTitle>
              <CardDescription>
                Update your password to keep your account secure
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Success/Error Messages */}
              {successPassword && (
                <div className="rounded-md bg-green-50 border border-green-200 p-4 mb-4">
                  <p className="text-sm text-green-800">{successPassword}</p>
                </div>
              )}
              {errorPassword && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-4">
                  <p className="text-sm text-red-800">{errorPassword}</p>
                </div>
              )}

              <form onSubmit={handleSubmitPassword(onSubmitPassword)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <Input
                    id="currentPassword"
                    type="password"
                    {...registerPassword('currentPassword')}
                    placeholder="Enter your current password"
                  />
                  {errorsPassword.currentPassword && (
                    <p className="text-sm text-red-600">{errorsPassword.currentPassword.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    {...registerPassword('newPassword')}
                    placeholder="Enter your new password"
                  />
                  {errorsPassword.newPassword && (
                    <p className="text-sm text-red-600">{errorsPassword.newPassword.message}</p>
                  )}
                  <p className="text-sm text-slate-500">
                    Password must be at least 8 characters and contain uppercase, lowercase, and numbers.
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    {...registerPassword('confirmPassword')}
                    placeholder="Confirm your new password"
                  />
                  {errorsPassword.confirmPassword && (
                    <p className="text-sm text-red-600">{errorsPassword.confirmPassword.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={savingPassword}>
                  {savingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Lock className="h-4 w-4 mr-2" />
                      Change Password
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
