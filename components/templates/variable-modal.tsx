'use client';

/**
 * Variable Modal Component
 * Story 3.5: Variable configuration modal
 */

import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { TemplateVariable, VariableType } from '@/lib/types/template';

const variableFormSchema = z.object({
  name: z
    .string()
    .min(1, 'Variable name is required')
    .max(100)
    .regex(/^[a-zA-Z0-9_]+$/, 'Variable name must contain only letters, numbers, and underscores'),
  type: z.enum(['text', 'number', 'date', 'currency']),
  required: z.boolean(),
  defaultValue: z.union([z.string(), z.number()]).optional(),
});

type VariableFormData = z.infer<typeof variableFormSchema>;

interface VariableModalProps {
  isOpen: boolean;
  variable: TemplateVariable | null;
  existingVariableNames: string[];
  onSave: (variable: TemplateVariable) => void;
  onClose: () => void;
}

export function VariableModal({
  isOpen,
  variable,
  existingVariableNames,
  onSave,
  onClose,
}: VariableModalProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
    setError,
  } = useForm<VariableFormData>({
    resolver: zodResolver(variableFormSchema),
    defaultValues: {
      name: '',
      type: 'text',
      required: false,
      defaultValue: '',
    },
  });

  const variableType = watch('type');

  // Reset form when modal opens/closes or variable changes
  useEffect(() => {
    if (isOpen) {
      if (variable) {
        reset({
          name: variable.name,
          type: variable.type,
          required: variable.required,
          defaultValue: variable.defaultValue || '',
        });
      } else {
        reset({
          name: '',
          type: 'text',
          required: false,
          defaultValue: '',
        });
      }
    }
  }, [isOpen, variable, reset]);

  const onSubmit = (data: VariableFormData) => {
    // Check for duplicate variable names
    if (existingVariableNames.includes(data.name)) {
      setError('name', {
        type: 'manual',
        message: 'A variable with this name already exists',
      });
      return;
    }

    let finalDefaultValue: string | number | null = null;

    if (data.defaultValue !== undefined && data.defaultValue !== '') {
      if (data.type === 'number' || data.type === 'currency') {
        const numValue = typeof data.defaultValue === 'string' ?
          parseFloat(data.defaultValue) : data.defaultValue;
        if (!isNaN(numValue)) {
          finalDefaultValue = numValue;
        }
      } else {
        finalDefaultValue = String(data.defaultValue);
      }
    }

    const newVariable: TemplateVariable = {
      name: data.name,
      type: data.type,
      required: data.required,
      defaultValue: finalDefaultValue,
    };

    onSave(newVariable);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {variable ? 'Edit Variable' : 'Add Variable'}
          </DialogTitle>
          <DialogDescription>
            Define a variable that can be used in template sections
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Variable Name */}
          <div>
            <Label htmlFor="name">Variable Name *</Label>
            <Input
              id="name"
              placeholder="e.g., plaintiff_name, demand_amount"
              {...register('name')}
              disabled={!!variable} // Don't allow renaming existing variables
            />
            <p className="text-sm text-slate-600 mt-1">
              Use lowercase letters, numbers, and underscores only
            </p>
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          {/* Variable Type */}
          <div>
            <Label htmlFor="type">Variable Type *</Label>
            <Select
              value={variableType}
              onValueChange={(value) => setValue('type', value as VariableType)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="text">Text</SelectItem>
                <SelectItem value="number">Number</SelectItem>
                <SelectItem value="date">Date</SelectItem>
                <SelectItem value="currency">Currency</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Default Value */}
          <div>
            <Label htmlFor="defaultValue">Default Value (Optional)</Label>
            <Input
              id="defaultValue"
              placeholder={
                variableType === 'currency' ? '$10,000.00' :
                variableType === 'number' ? '0' :
                variableType === 'date' ? 'YYYY-MM-DD' :
                'Default value...'
              }
              {...register('defaultValue')}
            />
            <p className="text-sm text-slate-600 mt-1">
              {variableType === 'currency' && 'Enter as number (e.g., 10000)'}
              {variableType === 'number' && 'Enter numeric value'}
              {variableType === 'date' && 'Format: YYYY-MM-DD'}
              {variableType === 'text' && 'Enter default text value'}
            </p>
          </div>

          {/* Required Checkbox */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="required"
              checked={watch('required')}
              onCheckedChange={(checked) => setValue('required', !!checked)}
            />
            <Label htmlFor="required" className="font-normal cursor-pointer">
              This variable is required
            </Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">
              {variable ? 'Save Changes' : 'Add Variable'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
