'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/hooks/useToast';

const productSchema = z
  .object({
    name: z.string()
      .min(3, 'Product name must be at least 3 characters')
      .max(100, 'Product name cannot exceed 100 characters')
      .trim()
      .refine(val => val.length > 0, 'Product name is required'),
    
    description: z.string()
      .min(10, 'Description must be at least 10 characters')
      .max(5000, 'Description cannot exceed 5000 characters')
      .trim(),
    
    price: z.number()
      .min(0, 'Price must be greater than or equal to 0')
      .max(1000000, 'Price cannot exceed 1,000,000')
      .refine(val => !isNaN(val), 'Price must be a valid number'),
    
    stock: z.number()
      .int('Stock must be a whole number')
      .min(0, 'Stock must be greater than or equal to 0')
      .max(1000000, 'Stock cannot exceed 1,000,000'),
    
    sku: z.string()
      .min(3, 'SKU must be at least 3 characters')
      .max(50, 'SKU cannot exceed 50 characters')
      .trim()
      .refine(val => /^[A-Za-z0-9\-_]+$/.test(val), 'SKU can only contain letters, numbers, hyphens, and underscores'),
    
    categoryId: z.string()
      .min(1, 'Please select a category')
      .refine(val => val !== 'default-category' || val.length > 10, 'Please select a valid category'),
    
    isPublished: z.boolean().default(false),
    isFeatured: z.boolean().default(false),
    
    image: z.string().optional(),
    
    brandId: z.string().optional()
      .refine(
        val => !val || val === '' || /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val),
        'Invalid brand ID format'
      ),
    
    salePrice: z.number()
      .min(0, 'Sale price must be greater than or equal to 0')
      .max(1000000, 'Sale price cannot exceed 1,000,000')
      .nullable()
      .optional(),
    
    saleStartDate: z.string().nullable().optional()
      .transform(val => {
        if (!val) return null;
        try {
          // Try to create a valid date object
          const date = new Date(val);
          if (isNaN(date.getTime())) return null;
          return val;
        } catch (e) {
          return null;
        }
      }),
    
    saleEndDate: z.string().nullable().optional()
      .transform(val => {
        if (!val) return null;
        try {
          // Try to create a valid date object
          const date = new Date(val);
          if (isNaN(date.getTime())) return null;
          return val;
        } catch (e) {
          return null;
        }
      }),
    
    stockQuantity: z.number()
      .int('Stock quantity must be a whole number')
      .min(0, 'Stock quantity must be greater than or equal to 0')
      .max(1000000, 'Stock quantity cannot exceed 1,000,000')
      .optional(),
    
    isInStock: z.boolean().default(true),
    
    specifications: z.string()
      .max(10000, 'Specifications cannot exceed 10,000 characters')
      .nullable()
      .optional(),
    
    keywords: z.array(z.string().trim())
      .nullable()
      .optional(),
    
    seoMetadata: z.object({
      title: z.string()
        .max(100, 'SEO title cannot exceed 100 characters')
        .optional()
        .nullable(),
      
      description: z.string()
        .max(200, 'SEO description cannot exceed 200 characters')
        .optional()
        .nullable(),
      
      keywords: z.union([
        z.string().max(500, 'SEO keywords cannot exceed 500 characters'),
        z.array(z.string().trim())
      ])
      .optional()
      .nullable()
      .transform(val => {
        if (!val) return [];
        if (typeof val === 'string') {
          return val.split(',').map(k => k.trim()).filter(Boolean);
        }
        return val;
      }),
      
      ogImage: z.union([
        z.string()
          .url('Please provide a valid URL for the social media image')
          .refine(
            (val) => {
              if (!val) return true; // Empty is valid
              // Check if it's a valid image URL
              return /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(val) || 
                    /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg))/i.test(val);
            },
            { message: 'URL must be a valid image (jpg, png, gif, etc.)' }
          ),
        z.literal('').transform(() => ''),
        z.null()
      ])
      .optional()
      .nullable()
    })
    .nullable()
    .optional(),
    
    variants: z.array(
      z.object({
        id: z.string().optional(),
        name: z.string()
          .min(1, 'Variant name is required')
          .max(50, 'Variant name cannot exceed 50 characters')
          .trim(),
        
        sku: z.string()
          .min(3, 'Variant SKU must be at least 3 characters')
          .max(50, 'Variant SKU cannot exceed 50 characters')
          .trim()
          .refine(val => /^[A-Za-z0-9\-_]+$/.test(val), 'Variant SKU can only contain letters, numbers, hyphens, and underscores'),
        
        price: z.number()
          .min(0, 'Variant price must be greater than or equal to 0')
          .max(1000000, 'Variant price cannot exceed 1,000,000'),
        
        stock: z.number()
          .int('Variant stock must be a whole number')
          .min(0, 'Variant stock must be greater than or equal to 0')
          .max(1000000, 'Variant stock cannot exceed 1,000,000')
      })
    )
    .optional(),
    
    tagIds: z.array(z.string()).optional(),
  })
  .refine(
    (data) => {
      // Validate that sale price is less than or equal to regular price
      if (data.salePrice !== null && data.salePrice !== undefined && data.price !== undefined) {
        return data.salePrice <= data.price;
      }
      return true;
    },
    {
      message: "Sale price must be less than or equal to regular price",
      path: ["salePrice"]
    }
  )
  .refine(
    (data) => {
      // Validate that sale end date is after sale start date
      if (data.saleStartDate && data.saleEndDate) {
        const startDate = new Date(data.saleStartDate);
        const endDate = new Date(data.saleEndDate);
        return endDate >= startDate;
      }
      return true;
    },
    {
      message: "Sale end date must be after sale start date",
      path: ["saleEndDate"]
    }
  );

type ProductFormData = z.infer<typeof productSchema>;

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => Promise<void>;
  isEditing?: boolean;
}

// Category type definition
interface Category {
  id: string;
  name: string;
  slug?: string;
  description?: string;
}

export function ProductForm({ initialData, onSubmit, isEditing = false }: ProductFormProps) {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>(initialData?.image || '');
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [hasFetchedCategories, setHasFetchedCategories] = useState(false);
  const toast = useToast();
  
  // Add state for brands
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingBrands, setIsLoadingBrands] = useState(true);
  const [brandError, setBrandError] = useState<string | null>(null);
  const [hasFetchedBrands, setHasFetchedBrands] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<string>(initialData?.brandId || '');
  
  // Add state for tags
  const [tags, setTags] = useState<{ id: string; name: string }[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(true);
  const [tagError, setTagError] = useState<string | null>(null);
  const [hasFetchedTags, setHasFetchedTags] = useState(false);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(initialData?.tagIds || []);
  
  // Add state for variants
  const [productVariants, setProductVariants] = useState<{
    id?: string;
    name: string;
    sku: string;
    price: number;
    stock: number;
  }[]>(initialData?.variants || []);
  
  // Helper function to format dates for input fields
  const formatDateForInput = (dateString: string | null | undefined): string => {
    if (!dateString) return '';
    try {
      // Create a date object from the string
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return ''; // Invalid date
      
      // Format as YYYY-MM-DDThh:mm (format required by datetime-local input)
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      
      return `${year}-${month}-${day}T${hours}:${minutes}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };
  
  // Debug initial data
  useEffect(() => {
    console.log('ProductForm initialData:', initialData);
    console.log('Using image URL:', initialData?.image || 'none');
    console.log('Initial categoryId:', initialData?.categoryId || 'none');
    console.log('Initial brandId:', initialData?.brandId || 'none');
  }, [initialData]);

  // Fetch categories when component mounts
  useEffect(() => {
    // Prevent multiple fetch attempts
    if (hasFetchedCategories) return;
    
    const fetchCategories = async () => {
      try {
        setIsLoadingCategories(true);
        setCategoryError(null);
        
        // Add the correct query parameters that the API expects
        const response = await fetch('/api/categories?pageSize=100', {
          cache: 'no-store', // Prevent caching
          headers: { 'x-fetch-time': Date.now().toString() } // Add unique header to prevent caching
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Failed to fetch categories (${response.status})`);
        }
        
        const data = await response.json();
        console.log('Raw categories API response:', data);
        
        // Handle different response formats
        let categoryData: Category[] = [];
        
        if (Array.isArray(data)) {
          categoryData = data;
        } else if (data.data && Array.isArray(data.data)) {
          categoryData = data.data;
        } else if (data.categories && Array.isArray(data.categories)) {
          categoryData = data.categories;
        }
        
        console.log('Categories loaded:', categoryData);
        
        if (categoryData.length === 0) {
          console.warn('No categories found in response:', data);
        }
        
        setCategories(categoryData);
      } catch (error: any) {
        console.error('Error fetching categories:', error);
        setCategoryError(error.message || 'Failed to load categories');
        toast.error('Failed to load categories. Please try again.');
      } finally {
        setIsLoadingCategories(false);
        setHasFetchedCategories(true);
      }
    };

    fetchCategories();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  const retryFetchCategories = () => {
    toast.info('Retrying category fetch...');
    setIsLoadingCategories(true);
    setCategoryError(null);
    setHasFetchedCategories(false); // Reset the flag to allow a new fetch
    
    // Trigger re-fetch by forcing a re-render
    setTimeout(() => {
      const fetchCategories = async () => {
        try {
          const response = await fetch('/api/categories?pageSize=100', { 
            cache: 'no-store',
            headers: { 
              'x-retry': 'true',
              'x-fetch-time': Date.now().toString() // Add timestamp to bypass cache
            }
          });
          
          if (!response.ok) {
            const error = await response.json().catch(() => ({}));
            throw new Error(error.message || `Failed to fetch categories (${response.status})`);
          }
          
          const data = await response.json();
          console.log('Raw categories API response on retry:', data);
          
          // Handle different response formats
          let categoryData: Category[] = [];
          
          if (Array.isArray(data)) {
            categoryData = data;
          } else if (data.data && Array.isArray(data.data)) {
            categoryData = data.data;
          } else if (data.categories && Array.isArray(data.categories)) {
            categoryData = data.categories;
          }
          
          console.log('Categories loaded on retry:', categoryData);
          
          if (categoryData.length === 0) {
            console.warn('No categories found in response on retry:', data);
          }
          
          setCategories(categoryData);
          toast.success('Categories loaded successfully');
        } catch (error: any) {
          console.error('Error retrying category fetch:', error);
          setCategoryError(error.message || 'Failed to load categories');
          toast.error('Still unable to load categories. Please check if the product service is running.');
        } finally {
          setIsLoadingCategories(false);
          setHasFetchedCategories(true);
        }
      };
      
      fetchCategories();
    }, 500);
  };

  // Add a useEffect for fetching brands
  useEffect(() => {
    // Prevent multiple fetch attempts
    if (hasFetchedBrands) return;
    
    const fetchBrands = async () => {
      try {
        setIsLoadingBrands(true);
        setBrandError(null);
        
        const response = await fetch('/api/brands?pageSize=100', {
          cache: 'no-store',
          headers: { 'x-fetch-time': Date.now().toString() }
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Failed to fetch brands (${response.status})`);
        }
        
        const data = await response.json();
        console.log('Raw brands API response:', data);
        
        // Handle different response formats
        let brandData: { id: string; name: string }[] = [];
        
        if (Array.isArray(data)) {
          brandData = data;
        } else if (data.data && Array.isArray(data.data)) {
          brandData = data.data;
        } else if (data.brands && Array.isArray(data.brands)) {
          brandData = data.brands;
        }
        
        console.log('Brands loaded:', brandData);
        setBrands(brandData);
        
        // Check if the currently selected brand exists in the loaded brands
        if (selectedBrandId) {
          const brandExists = brandData.some(brand => brand.id === selectedBrandId);
          if (!brandExists) {
            console.warn(`Selected brand ID ${selectedBrandId} not found in loaded brands`);
          } else {
            console.log(`Selected brand ID ${selectedBrandId} found in loaded brands`);
          }
        }
      } catch (error: any) {
        console.error('Error fetching brands:', error);
        setBrandError(error.message || 'Failed to load brands');
        toast.error('Failed to load brands, but you can continue without selecting one.');
      } finally {
        setIsLoadingBrands(false);
        setHasFetchedBrands(true);
      }
    };

    fetchBrands();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  // Add a useEffect for fetching tags
  useEffect(() => {
    // Prevent multiple fetch attempts
    if (hasFetchedTags) return;
    
    const fetchTags = async () => {
      try {
        setIsLoadingTags(true);
        setTagError(null);
        
        const response = await fetch('/api/tags?pageSize=100', {
          cache: 'no-store',
          headers: { 'x-fetch-time': Date.now().toString() }
        });
        
        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(error.message || `Failed to fetch tags (${response.status})`);
        }
        
        const data = await response.json();
        console.log('Raw tags API response:', data);
        
        // Handle different response formats
        let tagData: { id: string; name: string }[] = [];
        
        if (Array.isArray(data)) {
          tagData = data;
        } else if (data.data && Array.isArray(data.data)) {
          tagData = data.data;
        } else if (data.tags && Array.isArray(data.tags)) {
          tagData = data.tags;
        }
        
        console.log('Tags loaded:', tagData);
        setTags(tagData);
        
        // Check if the currently selected tags exist in the loaded tags
        if (selectedTagIds.length > 0) {
          console.log('Selected tag IDs:', selectedTagIds);
          const existingTagIds = tagData.map(tag => tag.id);
          const validSelectedTags = selectedTagIds.filter(id => existingTagIds.includes(id));
          
          if (validSelectedTags.length !== selectedTagIds.length) {
            console.warn('Some selected tag IDs were not found in loaded tags');
            console.log('Valid tags:', validSelectedTags);
          } else {
            console.log('All selected tag IDs found in loaded tags');
          }
        }
      } catch (error: any) {
        console.error('Error fetching tags:', error);
        setTagError(error.message || 'Failed to load tags');
        toast.error('Failed to load tags, but you can continue without selecting any.');
      } finally {
        setIsLoadingTags(false);
        setHasFetchedTags(true);
      }
    };

    fetchTags();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array to run only once on mount

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    watch,
    setValue,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: initialData?.name || '',
      description: initialData?.description || '',
      price: initialData?.price !== undefined ? initialData.price : 0,
      stock: initialData?.stock !== undefined ? initialData.stock : 0,
      sku: initialData?.sku || '',
      categoryId: initialData?.categoryId || '',
      isPublished: initialData?.isPublished !== undefined ? initialData.isPublished : false,
      isFeatured: initialData?.isFeatured !== undefined ? initialData.isFeatured : false,
      brandId: initialData?.brandId || '',
      salePrice: initialData?.salePrice !== undefined ? initialData.salePrice : null,
      saleStartDate: initialData?.saleStartDate || null,
      saleEndDate: initialData?.saleEndDate || null,
      stockQuantity: initialData?.stockQuantity !== undefined ? initialData.stockQuantity : 0,
      isInStock: initialData?.isInStock !== undefined ? initialData.isInStock : true,
      specifications: initialData?.specifications || null,
      keywords: initialData?.keywords || null,
      seoMetadata: initialData?.seoMetadata || null,
      variants: initialData?.variants || [],
      tagIds: initialData?.tagIds || [],
    },
  });
  
  // Debug form values
  const formValues = watch();
  useEffect(() => {
    console.log('Initial form data:', {
      name: initialData?.name || 'not set',
      description: initialData?.description || 'not set',
      price: initialData?.price !== undefined ? initialData.price : 'not set',
      stock: initialData?.stock !== undefined ? initialData.stock : 'not set',
      sku: initialData?.sku || 'not set',
      categoryId: initialData?.categoryId || 'not set',
      isPublished: initialData?.isPublished !== undefined ? initialData.isPublished : 'not set',
      isFeatured: initialData?.isFeatured !== undefined ? initialData.isFeatured : 'not set',
    });
    
    if (isEditing) {
      console.log('Current form values:', formValues);
    }
  }, [formValues, isEditing, initialData]);

  // Update the useEffect to set all form values when component mounts
  useEffect(() => {
    if (initialData) {
      console.log('Setting initial form values:', initialData);
      
      // Basic product details
      if (initialData.name) setValue('name', initialData.name);
      if (initialData.description) setValue('description', initialData.description);
      if (initialData.price !== undefined) setValue('price', initialData.price);
      if (initialData.stock !== undefined) setValue('stock', initialData.stock);
      if (initialData.sku) setValue('sku', initialData.sku);
      if (initialData.categoryId) setValue('categoryId', initialData.categoryId);
      
      // Status flags
      if (initialData.isPublished !== undefined) setValue('isPublished', initialData.isPublished);
      if (initialData.isFeatured !== undefined) setValue('isFeatured', initialData.isFeatured);
      if (initialData.isInStock !== undefined) setValue('isInStock', initialData.isInStock);
      
      // Brand
      if (initialData.brandId) {
        setValue('brandId', initialData.brandId);
        setSelectedBrandId(initialData.brandId);
        console.log('Setting brandId in form to:', initialData.brandId);
      }
      
      // Tags
      if (initialData.tagIds && initialData.tagIds.length > 0) {
        setValue('tagIds', initialData.tagIds);
        setSelectedTagIds(initialData.tagIds);
        console.log('Setting tagIds in form to:', initialData.tagIds);
      }
      
      // Sale information
      if (initialData.salePrice !== undefined) setValue('salePrice', initialData.salePrice);
      if (initialData.saleStartDate) setValue('saleStartDate', initialData.saleStartDate);
      if (initialData.saleEndDate) setValue('saleEndDate', initialData.saleEndDate);
      
      // Inventory
      if (initialData.stockQuantity !== undefined) setValue('stockQuantity', initialData.stockQuantity);
      
      // Other fields
      if (initialData.specifications) setValue('specifications', initialData.specifications);
      
      // SEO Metadata
      if (initialData.seoMetadata) {
        if (initialData.seoMetadata.title) setValue('seoMetadata.title', initialData.seoMetadata.title);
        if (initialData.seoMetadata.description) setValue('seoMetadata.description', initialData.seoMetadata.description);
        
        // Handle keywords properly
        if (initialData.seoMetadata.keywords) {
          if (typeof initialData.seoMetadata.keywords === 'string') {
            setValue('seoMetadata.keywords', initialData.seoMetadata.keywords);
          } else if (Array.isArray(initialData.seoMetadata.keywords)) {
            setValue('seoMetadata.keywords', initialData.seoMetadata.keywords);
          }
        }
        
        if (initialData.seoMetadata.ogImage) setValue('seoMetadata.ogImage', initialData.seoMetadata.ogImage);
      }
      
      // Handle variants
      if (initialData.variants && initialData.variants.length > 0) {
        setProductVariants(initialData.variants);
        setValue('variants', initialData.variants);
      }
    }
  }, [initialData, setValue]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Add custom handlers for date fields
  const handleDateChange = (field: 'saleStartDate' | 'saleEndDate', value: string) => {
    if (!value || value.trim() === '') {
      // If the field is cleared, set to null
      setValue(field, null);
      console.log(`Set ${field} to null because input was cleared`);
      return;
    }
    
    try {
      // Convert the local datetime to a Date object
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        // Convert to ISO string format with Z suffix
        const isoDate = date.toISOString();
        setValue(field, isoDate);
        console.log(`Set ${field} to ISO format:`, isoDate);
      } else {
        // If invalid date, set to null
        setValue(field, null);
        console.log(`Set ${field} to null because date was invalid`);
      }
    } catch (error) {
      console.error(`Error formatting ${field}:`, error);
      setValue(field, null);
    }
  };

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      console.log('Form submission data:', data);
      
      // Ensure proper SEO metadata handling
      const formattedSeoMetadata = {
        title: data.seoMetadata?.title || '',
        description: data.seoMetadata?.description || '',
        keywords: [] as string[],
        ogImage: ''
      };
      
      // Process keywords based on its type
      if (data.seoMetadata?.keywords) {
        if (typeof data.seoMetadata.keywords === 'string') {
          formattedSeoMetadata.keywords = (data.seoMetadata.keywords as string).split(',')
            .map(k => k.trim())
            .filter(Boolean);
        } else if (Array.isArray(data.seoMetadata.keywords)) {
          formattedSeoMetadata.keywords = data.seoMetadata.keywords as string[];
        }
      }
      
      // Validate ogImage
      if (data.seoMetadata?.ogImage) {
        // Check if it's empty or just whitespace
        if (!data.seoMetadata.ogImage.trim()) {
          formattedSeoMetadata.ogImage = '';
        } else {
          // Check if it's a valid image URL
          const isValidImageUrl = /\.(jpg|jpeg|png|gif|webp|svg)$/i.test(data.seoMetadata.ogImage) || 
                                /^(https?:\/\/.*\.(jpg|jpeg|png|gif|webp|svg))/i.test(data.seoMetadata.ogImage);
          
          if (!isValidImageUrl) {
            console.log(`Invalid image URL detected in form: ${data.seoMetadata.ogImage}`);
            toast.error('Invalid image URL format. URL must point to an image file (jpg, png, etc.)');
          } else {
            formattedSeoMetadata.ogImage = data.seoMetadata.ogImage;
          }
        }
      }
      
      // Replace the original SEO metadata with the formatted one
      data.seoMetadata = formattedSeoMetadata;
      
      // Helper function to format dates in ISO 8601 format
      const formatDateToISO = (dateValue: string | null | undefined): string | null => {
        if (!dateValue || dateValue === '') return null;
        
        try {
          // Handle various date formats
          const date = new Date(dateValue);
          
          // Check if the date is valid
          if (isNaN(date.getTime())) {
            console.log(`Invalid date: ${dateValue}`);
            return null;
          }
          
          // Format as ISO 8601 string with Z suffix for UTC timezone
          // This is the exact format that works with the API: YYYY-MM-DDThh:mm:ss.sssZ
          return date.toISOString(); // This returns format like: 2025-05-28T07:17:00.572Z
        } catch (error) {
          console.error(`Error formatting date ${dateValue}:`, error);
          return null;
        }
      };
      
      // Format dates in ISO 8601 format
      data.saleStartDate = formatDateToISO(data.saleStartDate);
      data.saleEndDate = formatDateToISO(data.saleEndDate);
      
      // Debug log the date values
      console.log('Formatted date values:', {
        saleStartDate: data.saleStartDate,
        saleEndDate: data.saleEndDate,
        rawStartDate: watch('saleStartDate'),
        rawEndDate: watch('saleEndDate')
      });
      
      // Additional validations before submission
      if (data.salePrice !== null && data.salePrice !== undefined && data.price !== undefined) {
        if (data.salePrice > data.price) {
          toast.error('Sale price must be less than or equal to regular price');
          return;
        }
      }
      
      if (data.saleStartDate && data.saleEndDate) {
        const startDate = new Date(data.saleStartDate);
        const endDate = new Date(data.saleEndDate);
        if (endDate < startDate) {
          toast.error('Sale end date must be after sale start date');
          return;
        }
      }
      
      // Validate brandId - if it's not a valid UUID, remove it
      if (data.brandId) {
        const isValidUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(data.brandId);
        if (!isValidUUID) {
          console.log(`Invalid brandId format: "${data.brandId}" - removing from submission`);
          data.brandId = undefined;
          toast.info('Invalid brand ID format - brand will not be associated with this product');
        }
      }
      
      // Ensure variants are properly formatted
      if (data.variants) {
        // Check for duplicate SKUs
        const skus = new Set<string>();
        const duplicateSKUs = [] as string[];
        
        data.variants.forEach(variant => {
          if (skus.has(variant.sku)) {
            duplicateSKUs.push(variant.sku);
          }
          skus.add(variant.sku);
        });
        
        if (duplicateSKUs.length > 0) {
          toast.error(`Duplicate SKUs found: ${duplicateSKUs.join(', ')}. Please ensure all variants have unique SKUs.`);
          return;
        }
        
        data.variants = productVariants.map(variant => ({
          id: variant.id,
          name: variant.name,
          sku: variant.sku,
          price: Number(variant.price),
          stock: Number(variant.stock)
        }));
      }
      
      console.log('Final submission data after formatting:', data);
      await onSubmit(data);
      toast.success(isEditing ? 'Product updated successfully' : 'Product created successfully');
    } catch (error: any) {
      console.error('Error submitting product:', error);
      
      // Provide more detailed error message if available
      if (error.message) {
        toast.error(`Failed: ${error.message}`);
      } else {
        toast.error(isEditing ? 'Failed to update product' : 'Failed to create product');
      }
    }
  };

  // Handler for adding a new variant
  const addVariant = () => {
    const newVariant = {
      name: '',
      sku: '',
      price: 0,
      stock: 0
    };
    setProductVariants([...productVariants, newVariant]);
    
    // Update the form value
    const currentVariants = watch('variants') || [];
    setValue('variants', [...currentVariants, newVariant]);
  };
  
  // Handler for removing a variant
  const removeVariant = (index: number) => {
    const updatedVariants = [...productVariants];
    updatedVariants.splice(index, 1);
    setProductVariants(updatedVariants);
    
    // Update the form value
    setValue('variants', updatedVariants);
  };
  
  // Handler for updating a variant
  const updateVariant = (index: number, field: string, value: string | number) => {
    const updatedVariants = [...productVariants];
    updatedVariants[index] = {
      ...updatedVariants[index],
      [field]: field === 'price' || field === 'stock' 
        ? Number(value) 
        : value
    };
    setProductVariants(updatedVariants);
    
    // Update the form value
    setValue('variants', updatedVariants);
  };

  return (
    <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-6">
      {/* Image Upload */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Product Image
        </label>
        <div className="mt-1 flex items-center gap-4">
          {imagePreview ? (
            <div className="relative h-32 w-32 overflow-hidden rounded-lg">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imagePreview}
                alt="Product preview"
                className="h-full w-full object-cover"
              />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview('');
                }}
                className="absolute right-1 top-1 rounded-full bg-white/80 p-1 hover:bg-white"
              >
                ×
              </button>
            </div>
          ) : (
            <div className="flex h-32 w-32 items-center justify-center rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <Upload className="mx-auto h-6 w-6 text-gray-400" />
                <div className="mt-1 text-xs text-gray-500">Upload image</div>
              </div>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="hidden"
            id="product-image"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => document.getElementById('product-image')?.click()}
          >
            {imagePreview ? 'Change Image' : 'Upload Image'}
          </Button>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Maximum file size: 5MB. Recommended size: 1000x1000px
        </p>
      </div>

      {/* Basic Information */}
      <div className="grid gap-6 md:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">
            Product Name
          </label>
          <input
            type="text"
            {...register('name')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-red-600">{String(errors.name.message || '')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            SKU
          </label>
          <input
            type="text"
            defaultValue={initialData?.sku || ''}
            {...register('sku')}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.sku && (
            <p className="mt-1 text-sm text-red-600">{String(errors.sku.message || '')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Price
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-gray-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              step="0.01"
              min="0"
              defaultValue={initialData?.price !== undefined ? initialData.price : 0}
              {...register('price', { 
                valueAsNumber: true,
                setValueAs: v => v === '' || isNaN(parseFloat(v)) ? 0 : parseFloat(v)
              })}
              className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          {errors.price && (
            <p className="mt-1 text-sm text-red-600">{String(errors.price.message || '')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Stock
          </label>
          <input
            type="number"
            min="0"
            defaultValue={initialData?.stock !== undefined ? initialData.stock : 0}
            {...register('stock', { 
              valueAsNumber: true,
              setValueAs: v => v === '' || isNaN(parseInt(v)) ? 0 : parseInt(v)
            })}
            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
          {errors.stock && (
            <p className="mt-1 text-sm text-red-600">{String(errors.stock.message || '')}</p>
          )}
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Description
        </label>
        <textarea
          {...register('description')}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{String(errors.description.message || '')}</p>
        )}
      </div>

      {/* Categories */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Category
        </label>
        {isLoadingCategories ? (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading categories...</span>
          </div>
        ) : categoryError ? (
          <div className="mt-2 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading categories</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{categoryError}</p>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={retryFetchCategories}
                    className="text-sm"
                  >
                    Retry
                  </Button>
                  
                  {/* Fallback option */}
                  <div className="flex items-center space-x-2 rounded-md border border-gray-200 p-2">
                    <select
                      {...register('categoryId')}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      value={watch('categoryId')}
                    >
                      <option value="default-category">Default Category (fallback)</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : categories.length > 0 ? (
          <div className="mt-2">
            <select
              {...register('categoryId')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={watch('categoryId')}
            >
              <option value="">Select a category</option>
              {categories.map((category) => (
                <option 
                  key={category.id} 
                  value={category.id}
                >
                  {category.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-2 rounded-md bg-amber-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">No categories found</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>Please create a category first before adding products.</p>
                </div>
                <div className="mt-4">
                  {/* Fallback option */}
                  <select
                    {...register('categoryId')}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    value="default-category"
                  >
                    <option value="default-category">Default Category (fallback)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
        {errors.categoryId && (
          <p className="mt-1 text-sm text-red-600">{String(errors.categoryId.message || '')}</p>
        )}
      </div>

      {/* Brands */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Brand
        </label>
        {isLoadingBrands ? (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading brands...</span>
          </div>
        ) : brandError ? (
          <div className="mt-2 rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error loading brands</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{brandError}</p>
                </div>
                <div className="mt-4 flex space-x-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setValue('brandId', '')}
                    className="text-sm"
                  >
                    Clear
                  </Button>
                  
                  {/* Fallback option */}
                  <div className="flex items-center space-x-2 rounded-md border border-gray-200 p-2">
                    <select
                      {...register('brandId')}
                      className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      defaultValue=""
                    >
                      <option value="">No Brand Selected</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : brands.length > 0 ? (
          <div className="mt-2">
            <select
              {...register('brandId')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              value={selectedBrandId}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedBrandId(value);
                setValue('brandId', value);
              }}
            >
              <option value="">Select a brand</option>
              {brands.map((brand) => (
                <option 
                  key={brand.id} 
                  value={brand.id}
                >
                  {brand.name}
                </option>
              ))}
            </select>
          </div>
        ) : (
          <div className="mt-2 rounded-md bg-amber-50 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-amber-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">No brands found</h3>
                <div className="mt-2 text-sm text-amber-700">
                  <p>Please create a brand first before adding products.</p>
                </div>
                <div className="mt-4">
                  {/* Fallback option */}
                  <select
                    {...register('brandId')}
                    className="block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    defaultValue=""
                  >
                    <option value="">No Brand Selected</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}
        {errors.brandId && (
          <p className="mt-1 text-sm text-red-600">{String(errors.brandId.message || '')}</p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Tags
        </label>
        {isLoadingTags ? (
          <div className="mt-2 flex items-center space-x-2 text-sm text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading tags...</span>
          </div>
        ) : tagError ? (
          <div className="mt-2 text-sm text-red-600">
            <p>Error loading tags: {tagError}</p>
          </div>
        ) : tags.length > 0 ? (
          <div className="mt-2 space-y-2">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {tags.map((tag) => (
                <div key={tag.id} className="flex items-center">
                  <input
                    type="checkbox"
                    id={`tag-${tag.id}`}
                    value={tag.id}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    onChange={(e) => {
                      const checked = e.target.checked;
                      const tagId = tag.id;
                      const currentTags = [...selectedTagIds];
                      
                      if (checked) {
                        const newTags = [...currentTags, tagId];
                        setSelectedTagIds(newTags);
                        setValue('tagIds', newTags);
                      } else {
                        const newTags = currentTags.filter(id => id !== tagId);
                        setSelectedTagIds(newTags);
                        setValue('tagIds', newTags);
                      }
                    }}
                    checked={selectedTagIds.includes(tag.id)}
                  />
                  <label
                    htmlFor={`tag-${tag.id}`}
                    className="ml-2 text-sm text-gray-700"
                  >
                    {tag.name}
                  </label>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mt-2 text-sm text-gray-500">
            <p>No tags available. Add tags in the Tag management section.</p>
          </div>
        )}
      </div>

      {/* Product Variants */}
      <div className="border rounded-md p-4 space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="font-medium text-gray-800">Product Variants</h3>
          <Button
            type="button"
            onClick={addVariant}
            variant="outline"
            className="text-sm"
          >
            Add Variant
          </Button>
        </div>
        
        {productVariants.length > 0 ? (
          <div className="space-y-4">
            {productVariants.map((variant, index) => (
              <div key={index} className="border rounded p-3 space-y-3">
                <div className="flex justify-between items-center">
                  <h4 className="text-sm font-medium">Variant #{index + 1}</h4>
                  <button
                    type="button"
                    onClick={() => removeVariant(index)}
                    className="text-red-600 hover:text-red-800"
                  >
                    Remove
                  </button>
                </div>
                
                <div className="grid gap-3 md:grid-cols-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Name
                    </label>
                    <input
                      type="text"
                      value={variant.name}
                      onChange={(e) => updateVariant(index, 'name', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g. Blue, XL, etc."
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      SKU
                    </label>
                    <input
                      type="text"
                      value={variant.sku}
                      onChange={(e) => updateVariant(index, 'sku', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="Unique SKU for this variant"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Price
                    </label>
                    <div className="relative mt-1 rounded-md shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <span className="text-gray-500 sm:text-sm">$</span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        value={variant.price}
                        onChange={(e) => updateVariant(index, 'price', e.target.value)}
                        className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Stock
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={variant.stock}
                      onChange={(e) => updateVariant(index, 'stock', e.target.value)}
                      className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-gray-50 p-4 text-center text-sm text-gray-500 rounded-md">
            <p>No variants added yet. Click "Add Variant" to create product variants.</p>
          </div>
        )}
      </div>

      {/* Sales Information */}
      <div className="border rounded-md p-4 space-y-4">
        <h3 className="font-medium text-gray-800">Sales Information</h3>
        
        <div className="grid gap-6 md:grid-cols-3">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sale Price
            </label>
            <div className="relative mt-1 rounded-md shadow-sm">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="text-gray-500 sm:text-sm">$</span>
              </div>
              <input
                type="number"
                step="0.01"
                min="0"
                defaultValue={initialData?.salePrice || ''}
                {...register('salePrice', { 
                  valueAsNumber: true,
                  setValueAs: v => v === '' || isNaN(parseFloat(v)) ? null : parseFloat(v)
                })}
                className="block w-full rounded-md border border-gray-300 pl-7 pr-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Leave empty for no sale"
              />
            </div>
            {errors.salePrice && (
              <p className="mt-1 text-sm text-red-600">{String(errors.salePrice.message || '')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sale Start Date
            </label>
            <input
              type="datetime-local"
              value={watch('saleStartDate') ? formatDateForInput(watch('saleStartDate')) : ''}
              onChange={(e) => handleDateChange('saleStartDate', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input 
              type="hidden" 
              {...register('saleStartDate')} 
            />
            {errors.saleStartDate && (
              <p className="mt-1 text-sm text-red-600">{String(errors.saleStartDate.message || '')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Sale End Date
            </label>
            <input
              type="datetime-local"
              value={watch('saleEndDate') ? formatDateForInput(watch('saleEndDate')) : ''}
              onChange={(e) => handleDateChange('saleEndDate', e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <input 
              type="hidden" 
              {...register('saleEndDate')} 
            />
            {errors.saleEndDate && (
              <p className="mt-1 text-sm text-red-600">{String(errors.saleEndDate.message || '')}</p>
            )}
          </div>
        </div>
      </div>

      {/* Inventory Management */}
      <div className="border rounded-md p-4 space-y-4">
        <h3 className="font-medium text-gray-800">Inventory Management</h3>
        
        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Stock Quantity
            </label>
            <input
              type="number"
              min="0"
              defaultValue={initialData?.stockQuantity !== undefined ? initialData.stockQuantity : 0}
              {...register('stockQuantity', { 
                valueAsNumber: true,
                setValueAs: v => v === '' || isNaN(parseInt(v)) ? 0 : parseInt(v)
              })}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            {errors.stockQuantity && (
              <p className="mt-1 text-sm text-red-600">{String(errors.stockQuantity.message || '')}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              defaultChecked={initialData?.isInStock !== undefined ? initialData.isInStock : true}
              {...register('isInStock')}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500 mr-2"
            />
            <label className="text-sm font-medium text-gray-700">
              Product is in stock
            </label>
          </div>
        </div>
      </div>

      {/* Product Specifications */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Product Specifications
        </label>
        <textarea
          {...register('specifications')}
          rows={4}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          placeholder="Enter technical specifications, features, etc."
        />
        {errors.specifications && (
          <p className="mt-1 text-sm text-red-600">{String(errors.specifications.message || '')}</p>
        )}
      </div>

      {/* SEO Metadata */}
      <div className="border rounded-md p-4 space-y-4">
        <h3 className="font-medium text-gray-800">SEO Settings</h3>
        <p className="text-sm text-gray-500">All SEO fields are optional. Leave empty if not needed.</p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              SEO Title
            </label>
            <input
              type="text"
              {...register('seoMetadata.title')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Leave empty to use product name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              SEO Description
            </label>
            <textarea
              {...register('seoMetadata.description')}
              rows={2}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Leave empty to use product description"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              SEO Keywords (comma separated)
            </label>
            <input
              type="text"
              {...register('seoMetadata.keywords')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="e.g. electronics, smartphone, accessories"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Social Media Image URL
            </label>
            <input
              type="text"
              {...register('seoMetadata.ogImage')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="URL for social media shares (optional)"
            />
            <p className="mt-1 text-xs text-gray-500">
              Optional. If provided, must be a valid image URL (e.g., https://example.com/image.jpg)
            </p>
            {errors.seoMetadata?.ogImage && watch('seoMetadata.ogImage') && watch('seoMetadata.ogImage')?.trim() !== '' && (
              <p className="mt-1 text-sm text-red-600">
                {String(errors.seoMetadata.ogImage.message || 'Please provide a valid image URL')}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Publishing Status */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('isPublished')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">
            Publish product immediately
          </label>
        </div>
        
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            {...register('isFeatured')}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label className="text-sm font-medium text-gray-700">
            Feature this product (display prominently)
          </label>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={() => window.history.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isLoadingCategories}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Product' : 'Create Product'
          )}
        </Button>
      </div>
    </form>
  );
} 