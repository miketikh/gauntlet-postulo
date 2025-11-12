'use client';

/**
 * Admin Settings Page
 * Firm settings with tabs for general, letterhead, export preferences, and templates
 * Story 6.13 - Admin Panel Dashboard
 */

import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/lib/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, Settings, Save, Upload, Image as ImageIcon, X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

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

const letterheadSchema = z.object({
  letterheadCompanyName: z.string().max(255).optional(),
  letterheadAddress: z.string().optional(),
  letterheadPhone: z.string().max(50).optional(),
  letterheadEmail: z.string().email('Invalid email address').or(z.literal('')).optional(),
  letterheadWebsite: z.string().max(255).optional(),
});

const exportPreferencesSchema = z.object({
  exportFontFamily: z.string().min(1, 'Font family is required'),
  exportFontSize: z.number().min(8).max(18),
  marginTop: z.number().min(0).max(3),
  marginBottom: z.number().min(0).max(3),
  marginLeft: z.number().min(0).max(3),
  marginRight: z.number().min(0).max(3),
});

type LetterheadFormData = z.infer<typeof letterheadSchema>;
type ExportPreferencesFormData = z.infer<typeof exportPreferencesSchema>;

export default function AdminSettingsPage() {
  const { accessToken } = useAuth();
  const [firm, setFirm] = useState<Firm | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingGeneral, setSavingGeneral] = useState(false);
  const [savingLetterhead, setSavingLetterhead] = useState(false);
  const [savingExport, setSavingExport] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [successGeneral, setSuccessGeneral] = useState<string | null>(null);
  const [successLetterhead, setSuccessLetterhead] = useState<string | null>(null);
  const [successExport, setSuccessExport] = useState<string | null>(null);
  const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
  const [errorLetterhead, setErrorLetterhead] = useState<string | null>(null);
  const [errorExport, setErrorExport] = useState<string | null>(null);

  const {
    register: registerGeneral,
    handleSubmit: handleSubmitGeneral,
    reset: resetGeneral,
    formState: { errors: errorsGeneral, isDirty: isDirtyGeneral },
  } = useForm({
    defaultValues: {
      name: '',
    },
  });

  const {
    register: registerLetterhead,
    handleSubmit: handleSubmitLetterhead,
    reset: resetLetterhead,
    formState: { errors: errorsLetterhead, isDirty: isDirtyLetterhead },
  } = useForm<LetterheadFormData>({
    resolver: zodResolver(letterheadSchema),
    defaultValues: {
      letterheadCompanyName: '',
      letterheadAddress: '',
      letterheadPhone: '',
      letterheadEmail: '',
      letterheadWebsite: '',
    },
  });

  const {
    register: registerExport,
    handleSubmit: handleSubmitExport,
    reset: resetExport,
    setValue: setValueExport,
    formState: { errors: errorsExport, isDirty: isDirtyExport },
  } = useForm<ExportPreferencesFormData>({
    resolver: zodResolver(exportPreferencesSchema),
    defaultValues: {
      exportFontFamily: 'Times New Roman',
      exportFontSize: 12,
      marginTop: 1,
      marginBottom: 1,
      marginLeft: 1,
      marginRight: 1,
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

        // Reset general form
        resetGeneral({ name: data.firm.name });

        // Reset letterhead form
        resetLetterhead({
          letterheadCompanyName: data.firm.letterheadCompanyName || '',
          letterheadAddress: data.firm.letterheadAddress || '',
          letterheadPhone: data.firm.letterheadPhone || '',
          letterheadEmail: data.firm.letterheadEmail || '',
          letterheadWebsite: data.firm.letterheadWebsite || '',
        });

        // Reset export preferences form
        const margins = data.firm.exportMargins || { top: 1, bottom: 1, left: 1, right: 1 };
        resetExport({
          exportFontFamily: data.firm.exportFontFamily || 'Times New Roman',
          exportFontSize: data.firm.exportFontSize || 12,
          marginTop: margins.top,
          marginBottom: margins.bottom,
          marginLeft: margins.left,
          marginRight: margins.right,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    }

    fetchSettings();
  }, [accessToken, resetGeneral, resetLetterhead, resetExport]);

  const onSubmitGeneral = async (data: any) => {
    if (!accessToken) return;

    setSavingGeneral(true);
    setErrorGeneral(null);
    setSuccessGeneral(null);

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
      setSuccessGeneral('Settings updated successfully');
      resetGeneral({ name: result.firm.name });
      setTimeout(() => setSuccessGeneral(null), 3000);
    } catch (err) {
      setErrorGeneral(err instanceof Error ? err.message : 'Failed to update settings');
    } finally {
      setSavingGeneral(false);
    }
  };

  const onSubmitLetterhead = async (data: LetterheadFormData) => {
    if (!accessToken || !firm) return;

    setSavingLetterhead(true);
    setErrorLetterhead(null);
    setSuccessLetterhead(null);

    try {
      const response = await fetch(`/api/firms/${firm.id}/letterhead`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update letterhead');
      }

      const result = await response.json();
      setFirm(result.firm);
      setSuccessLetterhead('Letterhead updated successfully');
      resetLetterhead({
        letterheadCompanyName: result.firm.letterheadCompanyName || '',
        letterheadAddress: result.firm.letterheadAddress || '',
        letterheadPhone: result.firm.letterheadPhone || '',
        letterheadEmail: result.firm.letterheadEmail || '',
        letterheadWebsite: result.firm.letterheadWebsite || '',
      });
      setTimeout(() => setSuccessLetterhead(null), 3000);
    } catch (err) {
      setErrorLetterhead(err instanceof Error ? err.message : 'Failed to update letterhead');
    } finally {
      setSavingLetterhead(false);
    }
  };

  const onSubmitExport = async (data: ExportPreferencesFormData) => {
    if (!accessToken) return;

    setSavingExport(true);
    setErrorExport(null);
    setSuccessExport(null);

    try {
      const exportData = {
        exportFontFamily: data.exportFontFamily,
        exportFontSize: data.exportFontSize,
        exportMargins: {
          top: data.marginTop,
          bottom: data.marginBottom,
          left: data.marginLeft,
          right: data.marginRight,
        },
      };

      const response = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to update export preferences');
      }

      const result = await response.json();
      setFirm(result.firm);
      setSuccessExport('Export preferences updated successfully');
      const margins = result.firm.exportMargins || { top: 1, bottom: 1, left: 1, right: 1 };
      resetExport({
        exportFontFamily: result.firm.exportFontFamily || 'Times New Roman',
        exportFontSize: result.firm.exportFontSize || 12,
        marginTop: margins.top,
        marginBottom: margins.bottom,
        marginLeft: margins.left,
        marginRight: margins.right,
      });
      setTimeout(() => setSuccessExport(null), 3000);
    } catch (err) {
      setErrorExport(err instanceof Error ? err.message : 'Failed to update export preferences');
    } finally {
      setSavingExport(false);
    }
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setErrorLetterhead('Please select a valid image file');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setErrorLetterhead('Image size must be less than 5MB');
        return;
      }

      setLogoFile(file);
      setErrorLetterhead(null);

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLogoUpload = async () => {
    if (!logoFile || !accessToken || !firm) return;

    setUploadingLogo(true);
    setErrorLetterhead(null);
    setSuccessLetterhead(null);

    try {
      const formData = new FormData();
      formData.append('logo', logoFile);

      const response = await fetch(`/api/firms/${firm.id}/letterhead/logo`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to upload logo');
      }

      const result = await response.json();
      setFirm(result.firm);
      setSuccessLetterhead('Logo uploaded successfully');
      setLogoFile(null);
      setLogoPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => setSuccessLetterhead(null), 3000);
    } catch (err) {
      setErrorLetterhead(err instanceof Error ? err.message : 'Failed to upload logo');
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleLogoRemove = () => {
    setLogoFile(null);
    setLogoPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const setMarginPreset = (preset: 'normal' | 'narrow' | 'wide' | 'court') => {
    const presets = {
      normal: { top: 1, bottom: 1, left: 1, right: 1 },
      narrow: { top: 0.5, bottom: 0.5, left: 0.5, right: 0.5 },
      wide: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 },
      court: { top: 1, bottom: 1, left: 1.5, right: 1 },
    };

    const margins = presets[preset];
    setValueExport('marginTop', margins.top);
    setValueExport('marginBottom', margins.bottom);
    setValueExport('marginLeft', margins.left);
    setValueExport('marginRight', margins.right);
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

      {/* Global Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 p-4">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}

      <Tabs defaultValue="general" className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="letterhead">Letterhead</TabsTrigger>
          <TabsTrigger value="export">Export Preferences</TabsTrigger>
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
              {/* Success/Error Messages */}
              {successGeneral && (
                <div className="rounded-md bg-green-50 border border-green-200 p-4 mb-4">
                  <p className="text-sm text-green-800">{successGeneral}</p>
                </div>
              )}
              {errorGeneral && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-4">
                  <p className="text-sm text-red-800">{errorGeneral}</p>
                </div>
              )}

              <form onSubmit={handleSubmitGeneral(onSubmitGeneral)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Firm Name</Label>
                  <Input
                    id="name"
                    {...registerGeneral('name', { required: 'Firm name is required' })}
                    placeholder="Enter firm name"
                  />
                  {errorsGeneral.name && (
                    <p className="text-sm text-red-600">{errorsGeneral.name.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={savingGeneral || !isDirtyGeneral}>
                  {savingGeneral ? (
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
                Configure letterhead settings for exported documents
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Success/Error Messages */}
              {successLetterhead && (
                <div className="rounded-md bg-green-50 border border-green-200 p-4 mb-4">
                  <p className="text-sm text-green-800">{successLetterhead}</p>
                </div>
              )}
              {errorLetterhead && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-4">
                  <p className="text-sm text-red-800">{errorLetterhead}</p>
                </div>
              )}

              <div className="space-y-6">
                {/* Logo Upload Section */}
                <div className="space-y-3">
                  <Label>Logo</Label>
                  <div className="flex items-start gap-4">
                    {firm?.letterheadLogoS3Key && !logoPreview && (
                      <div className="flex items-center justify-center w-32 h-32 border-2 border-dashed border-slate-300 rounded-lg bg-slate-50">
                        <ImageIcon className="h-12 w-12 text-slate-400" />
                        <span className="text-xs text-slate-500 mt-2">Logo uploaded</span>
                      </div>
                    )}
                    {logoPreview && (
                      <div className="relative w-32 h-32">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="w-full h-full object-contain border-2 border-slate-300 rounded-lg"
                        />
                        <button
                          type="button"
                          onClick={handleLogoRemove}
                          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                    <div className="flex-1 space-y-2">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleLogoFileChange}
                        className="hidden"
                        id="logo-upload"
                      />
                      <label htmlFor="logo-upload">
                        <Button type="button" variant="outline" asChild>
                          <span className="cursor-pointer">
                            <Upload className="h-4 w-4 mr-2" />
                            {firm?.letterheadLogoS3Key ? 'Replace Logo' : 'Choose Logo'}
                          </span>
                        </Button>
                      </label>
                      {logoFile && (
                        <Button
                          type="button"
                          onClick={handleLogoUpload}
                          disabled={uploadingLogo}
                        >
                          {uploadingLogo ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Uploading...
                            </>
                          ) : (
                            <>
                              <Upload className="h-4 w-4 mr-2" />
                              Upload Logo
                            </>
                          )}
                        </Button>
                      )}
                      <p className="text-sm text-slate-500">
                        Recommended: PNG or JPG, max 5MB
                      </p>
                    </div>
                  </div>
                </div>

                {/* Letterhead Information Form */}
                <form onSubmit={handleSubmitLetterhead(onSubmitLetterhead)} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="letterheadCompanyName">Company Name</Label>
                    <Input
                      id="letterheadCompanyName"
                      {...registerLetterhead('letterheadCompanyName')}
                      placeholder="e.g., Smith & Associates Law Firm"
                    />
                    {errorsLetterhead.letterheadCompanyName && (
                      <p className="text-sm text-red-600">
                        {errorsLetterhead.letterheadCompanyName.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="letterheadAddress">Address</Label>
                    <Textarea
                      id="letterheadAddress"
                      {...registerLetterhead('letterheadAddress')}
                      placeholder="123 Main Street&#10;Suite 100&#10;City, State ZIP"
                      rows={3}
                    />
                    {errorsLetterhead.letterheadAddress && (
                      <p className="text-sm text-red-600">
                        {errorsLetterhead.letterheadAddress.message}
                      </p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="letterheadPhone">Phone</Label>
                      <Input
                        id="letterheadPhone"
                        {...registerLetterhead('letterheadPhone')}
                        placeholder="(555) 123-4567"
                      />
                      {errorsLetterhead.letterheadPhone && (
                        <p className="text-sm text-red-600">
                          {errorsLetterhead.letterheadPhone.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="letterheadEmail">Email</Label>
                      <Input
                        id="letterheadEmail"
                        type="email"
                        {...registerLetterhead('letterheadEmail')}
                        placeholder="info@lawfirm.com"
                      />
                      {errorsLetterhead.letterheadEmail && (
                        <p className="text-sm text-red-600">
                          {errorsLetterhead.letterheadEmail.message}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="letterheadWebsite">Website</Label>
                    <Input
                      id="letterheadWebsite"
                      {...registerLetterhead('letterheadWebsite')}
                      placeholder="www.lawfirm.com"
                    />
                    {errorsLetterhead.letterheadWebsite && (
                      <p className="text-sm text-red-600">
                        {errorsLetterhead.letterheadWebsite.message}
                      </p>
                    )}
                  </div>

                  <Button type="submit" disabled={savingLetterhead || !isDirtyLetterhead}>
                    {savingLetterhead ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4 mr-2" />
                        Save Letterhead
                      </>
                    )}
                  </Button>
                </form>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Preferences Tab */}
        <TabsContent value="export">
          <Card>
            <CardHeader>
              <CardTitle>Export Preferences</CardTitle>
              <CardDescription>
                Configure default settings for document exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              {/* Success/Error Messages */}
              {successExport && (
                <div className="rounded-md bg-green-50 border border-green-200 p-4 mb-4">
                  <p className="text-sm text-green-800">{successExport}</p>
                </div>
              )}
              {errorExport && (
                <div className="rounded-md bg-red-50 border border-red-200 p-4 mb-4">
                  <p className="text-sm text-red-800">{errorExport}</p>
                </div>
              )}

              <form onSubmit={handleSubmitExport(onSubmitExport)} className="space-y-6">
                {/* Font Settings */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium text-slate-900">Font Settings</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="exportFontFamily">Font Family</Label>
                      <select
                        id="exportFontFamily"
                        {...registerExport('exportFontFamily')}
                        className="flex h-10 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-950 focus-visible:ring-offset-2"
                      >
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Arial">Arial</option>
                        <option value="Calibri">Calibri</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Garamond">Garamond</option>
                      </select>
                      {errorsExport.exportFontFamily && (
                        <p className="text-sm text-red-600">
                          {errorsExport.exportFontFamily.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="exportFontSize">Font Size (pt)</Label>
                      <Input
                        id="exportFontSize"
                        type="number"
                        min="8"
                        max="18"
                        {...registerExport('exportFontSize', { valueAsNumber: true })}
                      />
                      {errorsExport.exportFontSize && (
                        <p className="text-sm text-red-600">
                          {errorsExport.exportFontSize.message}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Margin Settings */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-slate-900">Page Margins (inches)</h3>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMarginPreset('normal')}
                      >
                        Normal
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMarginPreset('narrow')}
                      >
                        Narrow
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMarginPreset('wide')}
                      >
                        Wide
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setMarginPreset('court')}
                      >
                        Court
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="marginTop">Top</Label>
                      <Input
                        id="marginTop"
                        type="number"
                        step="0.25"
                        min="0"
                        max="3"
                        {...registerExport('marginTop', { valueAsNumber: true })}
                      />
                      {errorsExport.marginTop && (
                        <p className="text-sm text-red-600">{errorsExport.marginTop.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marginBottom">Bottom</Label>
                      <Input
                        id="marginBottom"
                        type="number"
                        step="0.25"
                        min="0"
                        max="3"
                        {...registerExport('marginBottom', { valueAsNumber: true })}
                      />
                      {errorsExport.marginBottom && (
                        <p className="text-sm text-red-600">{errorsExport.marginBottom.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marginLeft">Left</Label>
                      <Input
                        id="marginLeft"
                        type="number"
                        step="0.25"
                        min="0"
                        max="3"
                        {...registerExport('marginLeft', { valueAsNumber: true })}
                      />
                      {errorsExport.marginLeft && (
                        <p className="text-sm text-red-600">{errorsExport.marginLeft.message}</p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="marginRight">Right</Label>
                      <Input
                        id="marginRight"
                        type="number"
                        step="0.25"
                        min="0"
                        max="3"
                        {...registerExport('marginRight', { valueAsNumber: true })}
                      />
                      {errorsExport.marginRight && (
                        <p className="text-sm text-red-600">{errorsExport.marginRight.message}</p>
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-slate-500">
                    <strong>Presets:</strong> Normal (1"), Narrow (0.5"), Wide (1.5"), Court (1.5" left, 1" others)
                  </p>
                </div>

                <Button type="submit" disabled={savingExport || !isDirtyExport}>
                  {savingExport ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Export Preferences
                    </>
                  )}
                </Button>
              </form>
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
                  Default template selection will be implemented in a future release. This feature will allow you to set a firm-wide default template that is pre-selected when creating new demand letters.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
