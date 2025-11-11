'use client';

/**
 * Signup/Registration Page
 * User registration with firm selection, React Hook Form, and Zod validation
 * Based on architecture.md authentication patterns
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import axios from 'axios';
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

// Password validation rules (matching backend)
const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// Signup form validation schema
const signupSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(100, 'First name must be less than 100 characters')
    .trim(),
  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(100, 'Last name must be less than 100 characters')
    .trim(),
  email: z
    .string()
    .email('Invalid email format')
    .toLowerCase()
    .trim(),
  password: passwordSchema,
  firmId: z.string().uuid('Please select a firm'),
});

type SignupFormData = z.infer<typeof signupSchema>;

interface Firm {
  id: string;
  name: string;
}

export default function SignupPage() {
  const router = useRouter();
  const [firms, setFirms] = useState<Firm[]>([]);
  const [isLoadingFirms, setIsLoadingFirms] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Initialize form with React Hook Form + Zod
  const form = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      firmId: '',
    },
  });

  // Fetch firms on mount
  useEffect(() => {
    const fetchFirms = async () => {
      try {
        setIsLoadingFirms(true);
        const response = await axios.get('/api/firms');
        setFirms(response.data.firms);
      } catch (err) {
        console.error('Error fetching firms:', err);
        setError('Failed to load law firms. Please refresh the page.');
      } finally {
        setIsLoadingFirms(false);
      }
    };

    fetchFirms();
  }, []);

  // Handle form submission
  const onSubmit = async (data: SignupFormData) => {
    try {
      setIsSubmitting(true);
      setError(null);

      // Call registration API
      await axios.post('/api/auth/register', data);

      // Show success message
      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        router.push('/login');
      }, 2000);
    } catch (err: any) {
      console.error('Registration error:', err);

      // Handle error response
      if (err.response?.data?.error) {
        const errorMessage = err.response.data.error.message;

        // Handle validation errors
        if (err.response.data.error.code === 'VALIDATION_ERROR') {
          const details = err.response.data.error.details;
          if (details && Array.isArray(details) && details.length > 0) {
            setError(details.map((d: any) => d.message).join(', '));
          } else {
            setError(errorMessage);
          }
        } else {
          setError(errorMessage);
        }
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show success state
  if (success) {
    return (
      <Card className="w-full shadow-xl">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <CheckCircle2 className="w-10 h-10 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">
              Registration Successful!
            </h2>
            <p className="text-slate-600 mb-4">
              Your account has been created successfully.
            </p>
            <p className="text-sm text-slate-500">
              Redirecting to login page...
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full shadow-xl">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl font-bold">Create Account</CardTitle>
        <CardDescription>
          Sign up to start creating demand letters
        </CardDescription>
      </CardHeader>

      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Error Alert */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">{error}</p>
              </div>
            )}

            {/* Name Fields - Side by Side */}
            <div className="grid grid-cols-2 gap-4">
              {/* First Name Field */}
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>First Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="John"
                        autoComplete="given-name"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Last Name Field */}
              <FormField
                control={form.control}
                name="lastName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Last Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Doe"
                        autoComplete="family-name"
                        disabled={isSubmitting}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Email Field */}
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      placeholder="attorney@lawfirm.com"
                      autoComplete="email"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Password Field */}
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Create a password"
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                  <p className="text-xs text-slate-500 mt-1">
                    Must be at least 8 characters with 1 uppercase letter and 1 number
                  </p>
                </FormItem>
              )}
            />

            {/* Firm Selection Field */}
            <FormField
              control={form.control}
              name="firmId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Law Firm</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting || isLoadingFirms}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select your law firm" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {isLoadingFirms ? (
                        <div className="flex items-center justify-center p-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                        </div>
                      ) : firms.length === 0 ? (
                        <div className="p-2 text-sm text-slate-500">
                          No firms available
                        </div>
                      ) : (
                        firms.map((firm) => (
                          <SelectItem key={firm.id} value={firm.id}>
                            {firm.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || isLoadingFirms}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating account...
                </>
              ) : (
                'Create Account'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>

      <CardFooter className="flex flex-col space-y-4">
        <div className="text-sm text-center text-slate-600">
          Already have an account?{' '}
          <Link
            href="/login"
            className="text-blue-600 hover:text-blue-700 font-medium underline-offset-4 hover:underline"
          >
            Login
          </Link>
        </div>
      </CardFooter>
    </Card>
  );
}
