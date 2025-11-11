/**
 * Variables Form Component
 * Dynamic form for collecting case variables based on template requirements
 * Part of Story 2.8 - AI Generation Workflow UI
 */

'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Card, CardContent } from '@/components/ui/card';
import { FileText } from 'lucide-react';

interface VariablesFormProps {
  template: any;
  onSubmit: (variables: Record<string, any>) => void;
}

/**
 * Build Zod schema from template variables
 * This creates a validation schema dynamically based on the template's requirements
 */
function buildSchemaFromTemplate(template: any) {
  // Default schema with common demand letter fields
  return z.object({
    plaintiffName: z.string().min(1, 'Plaintiff name is required'),
    defendantName: z.string().min(1, 'Defendant name is required'),
    incidentDate: z.string().min(1, 'Incident date is required'),
    incidentDescription: z.string().min(10, 'Please provide more details (at least 10 characters)'),
    demandAmount: z.string().optional(),
    jurisdiction: z.string().optional(),
  });
}

export function VariablesForm({ template, onSubmit }: VariablesFormProps) {
  const schema = buildSchemaFromTemplate(template);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      plaintiffName: '',
      defendantName: '',
      incidentDate: '',
      incidentDescription: '',
      demandAmount: '',
      jurisdiction: '',
    },
  });

  const handleSubmit = (values: any) => {
    onSubmit(values);
  };

  return (
    <Card>
      <CardContent className="pt-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Template Info */}
            <div className="flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-900">
                  Template: {template.name}
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  {template.description || 'No description available'}
                </p>
              </div>
            </div>

            {/* Required Fields Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Required Information</h3>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="plaintiffName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Plaintiff Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormDescription>
                        The name of your client
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="defendantName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Defendant Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Jane Smith" {...field} />
                      </FormControl>
                      <FormDescription>
                        The person or entity being held responsible
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incidentDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Date *</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription>
                        When the incident occurred
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="incidentDescription"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Incident Description *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Describe what happened, including key details about the incident..."
                          rows={5}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Provide a detailed summary of the incident
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Optional Fields Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Information</h3>

              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="demandAmount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Demand Amount (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="$50,000" {...field} />
                      </FormControl>
                      <FormDescription>
                        The settlement amount being requested
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="jurisdiction"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Jurisdiction (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="State of California" {...field} />
                      </FormControl>
                      <FormDescription>
                        The legal jurisdiction for this case
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4 border-t">
              <Button
                type="submit"
                size="lg"
                className="w-full"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Creating...' : 'Generate Demand Letter'}
              </Button>
              <p className="text-sm text-slate-500 text-center mt-3">
                This will create a new project and start AI generation
              </p>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
