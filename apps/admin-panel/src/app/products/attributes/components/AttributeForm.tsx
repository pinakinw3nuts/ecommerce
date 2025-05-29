'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Plus, Trash2, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';
import { Attribute, AttributeValue } from '@/services/attributes';

// Form validation schema
const attributeValueSchema = z.object({
  id: z.string().optional(),
  value: z.string().min(1, 'Value is required'),
  displayValue: z.string().optional(),
  metadata: z.object({
    hexColor: z.string().optional(),
    imageUrl: z.string().optional(),
    sortOrder: z.number().optional(),
  }).optional(),
});

const attributeSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  description: z.string().optional(),
  type: z.enum(['select', 'multiple', 'text', 'number', 'boolean']),
  isFilterable: z.boolean().optional(),
  isRequired: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().optional(),
  values: z.array(attributeValueSchema).optional(),
});

type AttributeFormData = z.infer<typeof attributeSchema>;

interface AttributeFormProps {
  attribute?: Attribute;
  onSubmit: (data: AttributeFormData) => Promise<void>;
  isSubmitting: boolean;
}

export default function AttributeForm({ attribute, onSubmit, isSubmitting }: AttributeFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [showValueFields, setShowValueFields] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
    reset
  } = useForm<AttributeFormData>({
    resolver: zodResolver(attributeSchema),
    defaultValues: {
      name: '',
      description: '',
      type: 'select',
      isFilterable: true,
      isRequired: false,
      isActive: true,
      sortOrder: 0,
      values: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'values',
  });

  // Watch the type field to determine if we should show value fields
  const typeValue = watch('type');

  useEffect(() => {
    // Only show value fields for select and multiple types
    setShowValueFields(typeValue === 'select' || typeValue === 'multiple');
  }, [typeValue]);

  // Update form when attribute data is loaded
  useEffect(() => {
    if (attribute) {
      reset({
        name: attribute.name,
        description: attribute.description || '',
        type: attribute.type as any,
        isFilterable: attribute.isFilterable,
        isRequired: attribute.isRequired,
        isActive: attribute.isActive,
        sortOrder: attribute.sortOrder,
        values: attribute.values || [],
      });
      
      setShowValueFields(attribute.type === 'select' || attribute.type === 'multiple');
    }
  }, [attribute, reset]);

  const handleFormSubmit = async (data: AttributeFormData) => {
    try {
      // If type is not select or multiple, remove values
      if (data.type !== 'select' && data.type !== 'multiple') {
        data.values = [];
      }
      
      // Explicitly convert checkbox values to booleans
      // Using direct comparison to true/false to ensure proper boolean values
      const formattedData = {
        ...data,
        isFilterable: data.isFilterable === true,
        isRequired: data.isRequired === true,
        isActive: data.isActive === true
      };
      
      // Log the form data being submitted
      console.log('Submitting attribute data:', {
        ...formattedData,
        isActive: formattedData.isActive,
        isFilterable: formattedData.isFilterable,
        isRequired: formattedData.isRequired
      });
      
      await onSubmit(formattedData);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to save attribute');
    }
  };

  const addValue = () => {
    append({ 
      value: '', 
      displayValue: '',
      metadata: {
        hexColor: '',
        imageUrl: '',
        sortOrder: fields.length + 1
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6 max-w-2xl">
      <div className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700">
            Name*
          </label>
          <input
            {...register('name')}
            type="text"
            id="name"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Description
          </label>
          <textarea
            {...register('description')}
            id="description"
            rows={3}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label htmlFor="type" className="block text-sm font-medium text-gray-700">
            Type*
          </label>
          <select
            {...register('type')}
            id="type"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="select">Select (Single Choice)</option>
            <option value="multiple">Multiple (Multiple Choice)</option>
            <option value="text">Text</option>
            <option value="number">Number</option>
            <option value="boolean">Boolean</option>
          </select>
          {errors.type && (
            <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>
          )}
        </div>

        <div className="flex space-x-4">
          <div className="flex items-center">
            <input
              {...register('isFilterable')}
              type="checkbox"
              id="isFilterable"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isFilterable" className="ml-2 block text-sm text-gray-700">
              Filterable
            </label>
          </div>
          <div className="flex items-center">
            <input
              {...register('isRequired')}
              type="checkbox"
              id="isRequired"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="isRequired" className="ml-2 block text-sm text-gray-700">
              Required
            </label>
          </div>
          <div className="flex items-center">
            <input
              {...register('isActive')}
              type="checkbox"
              id="isActive"
              className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              defaultChecked={attribute?.isActive}
            />
            <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
              Active
            </label>
          </div>
        </div>

        <div>
          <label htmlFor="sortOrder" className="block text-sm font-medium text-gray-700">
            Sort Order
          </label>
          <input
            {...register('sortOrder', { valueAsNumber: true })}
            type="number"
            id="sortOrder"
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.sortOrder && (
            <p className="mt-1 text-sm text-red-600">{errors.sortOrder.message}</p>
          )}
        </div>

        {showValueFields && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Attribute Values</h3>
              <Button
                type="button"
                onClick={addValue}
                size="sm"
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Value
              </Button>
            </div>

            {fields.length === 0 && (
              <div className="text-center py-4 text-gray-500 bg-gray-50 border border-dashed border-gray-300 rounded-md">
                No values added yet. Click "Add Value" to create attribute values.
              </div>
            )}

            {fields.map((field, index) => (
              <div key={field.id} className="p-4 border border-gray-200 rounded-md bg-gray-50">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-medium">Value #{index + 1}</h4>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => remove(index)}
                    className="text-red-500"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label htmlFor={`values.${index}.value`} className="block text-sm font-medium text-gray-700">
                      Value*
                    </label>
                    <input
                      {...register(`values.${index}.value`)}
                      type="text"
                      id={`values.${index}.value`}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                    {errors.values?.[index]?.value && (
                      <p className="mt-1 text-sm text-red-600">{errors.values[index]?.value?.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor={`values.${index}.displayValue`} className="block text-sm font-medium text-gray-700">
                      Display Value
                    </label>
                    <input
                      {...register(`values.${index}.displayValue`)}
                      type="text"
                      id={`values.${index}.displayValue`}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor={`values.${index}.metadata.hexColor`} className="block text-sm font-medium text-gray-700">
                        Color (HEX)
                      </label>
                      <div className="flex items-center">
                        <input
                          {...register(`values.${index}.metadata.hexColor`)}
                          type="text"
                          id={`values.${index}.metadata.hexColor`}
                          placeholder="#RRGGBB"
                          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                        <input
                          type="color"
                          value={watch(`values.${index}.metadata.hexColor`) || '#ffffff'}
                          onChange={(e) => setValue(`values.${index}.metadata.hexColor`, e.target.value)}
                          className="ml-2 h-8 w-8 rounded-md border border-gray-300"
                        />
                      </div>
                    </div>

                    <div>
                      <label htmlFor={`values.${index}.metadata.sortOrder`} className="block text-sm font-medium text-gray-700">
                        Sort Order
                      </label>
                      <input
                        {...register(`values.${index}.metadata.sortOrder`, { valueAsNumber: true })}
                        type="number"
                        id={`values.${index}.metadata.sortOrder`}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor={`values.${index}.metadata.imageUrl`} className="block text-sm font-medium text-gray-700">
                      Image URL
                    </label>
                    <input
                      {...register(`values.${index}.metadata.imageUrl`)}
                      type="text"
                      id={`values.${index}.metadata.imageUrl`}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex space-x-3">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Save Attribute
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
  );
} 