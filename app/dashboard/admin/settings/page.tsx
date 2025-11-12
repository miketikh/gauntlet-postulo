'use client';

/**
 * Admin Settings Page
 * Firm settings with tabs for general, letterhead, and templates
 * Story 6.13 - Admin Panel Dashboard
 */

import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Settings, Save } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

interface Firm {
  id: string;
  name: string;
  letterheadCompanyName: string | null;
  letterheadAddress: string | null;
  letterheadPhone: string | null;
  letterheadEmail: string | null;
  letterheadWebsite: string | null;
  letterheadLogoS3Key: string | null;
  exportMargins: { top: number; bottom: number; left: number; right: number } | null;
  exportFontFamily: string | null;
  exportFontSize: number | null;
}

const generalSettingsSchema = z.object({
  name: z.string().min(1, 'Firm name is required'),
});

export default function AdminSettingsPage() {
  const { accessToken } = useAuth();
  const [firm, setFirm] = useState<Firm | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm({
    defaultValues: {
      name: '',
    },
  });

  useEffect(() => {
    async function fetchSettings() {
      if (!accessToken) {
        setError('Not authenticated');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch('/api/admin/settings', {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch settings: ${response.statusText}`);
        }

        const data = await response.json();
        setFirm(data.firm);
        reset({ name: data.firm.name });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [accessToken, reset]);

  const onSubmitGeneral = async (data: any) => {
    if (!accessToken) return;

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update settings');
      }

      const result = await response.json();
      setFirm(result.firm);
      setSuccess('Settings updated successfully');
      reset({ name: result.firm.name });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error && !firm) {
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
          <h1 className="text-3xl font-bold text-slate-900">Firm Settings</h1>
          <p className="text-slate-600">Manage your firm's configuration</p>
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      {success && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4">
          <p className="text-sm text-green-800">{success}</p>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="letterhead">Letterhead</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        {/* General Settings Tab */}
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Basic firm information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmitGeneral)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Firm Name</Label>
                  <Input
                    id="name"
                    {...register('name', { required: 'Firm name is required' })}
                    placeholder="Enter firm name"
                  />
                  {errors.name && (
                    <p className="text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={saving || !isDirty}>
                  {saving ? (
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

        {/* Letterhead Tab */}
        <TabsContent value="letterhead">
          <Card>
            <CardHeader>
              <CardTitle>Letterhead Configuration</CardTitle>
              <CardDescription>
                Configure letterhead settings for exported documents (uses Story 5.9 APIs)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                  <p className="text-sm text-blue-800">
                    Letterhead configuration is available via the main letterhead API endpoints at:
                  </p>
                  <ul className="list-disc list-inside text-sm text-blue-700 mt-2 space-y-1">
                    <li>GET /api/firms/[id]/letterhead - View letterhead settings</li>
                    <li>PATCH /api/firms/[id]/letterhead - Update letterhead settings</li>
                    <li>POST /api/firms/[id]/letterhead/logo - Upload logo</li>
                  </ul>
                </div>

                {firm && (
                  <div className="space-y-3 border-t border-slate-200 pt-4">
                    <h3 className="font-medium text-slate-900">Current Configuration</h3>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-slate-500">Company Name:</span>
                        <p className="font-medium text-slate-900">
                          {firm.letterheadCompanyName || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Phone:</span>
                        <p className="font-medium text-slate-900">
                          {firm.letterheadPhone || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Email:</span>
                        <p className="font-medium text-slate-900">
                          {firm.letterheadEmail || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Website:</span>
                        <p className="font-medium text-slate-900">
                          {firm.letterheadWebsite || 'Not set'}
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Font:</span>
                        <p className="font-medium text-slate-900">
                          {firm.exportFontFamily || 'Times New Roman'} {firm.exportFontSize || 12}pt
                        </p>
                      </div>
                      <div>
                        <span className="text-slate-500">Logo:</span>
                        <p className="font-medium text-slate-900">
                          {firm.letterheadLogoS3Key ? 'Uploaded' : 'Not uploaded'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates">
          <Card>
            <CardHeader>
              <CardTitle>Default Template Settings</CardTitle>
              <CardDescription>Configure default templates for new projects</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
                <p className="text-sm text-blue-800">
                  Default template selection will be implemented here. Users can set a firm-wide default template that is pre-selected when creating new demand letters.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
