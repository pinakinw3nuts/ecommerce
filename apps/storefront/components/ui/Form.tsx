'use client';

import * as React from 'react';
import { 
  useForm, 
  FormProvider, 
  UseFormReturn, 
  FieldValues, 
  SubmitHandler,
  UseFormProps 
} from 'react-hook-form';
import { cn } from '../../lib/utils';

interface FormProps<TFormValues extends FieldValues> 
  extends Omit<React.ComponentProps<'form'>, 'onSubmit'> {
  form: UseFormReturn<TFormValues>;
  onSubmit: SubmitHandler<TFormValues>;
}

const Form = <TFormValues extends FieldValues>({
  form,
  onSubmit,
  children,
  className,
  ...props
}: FormProps<TFormValues>) => {
  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className={cn(className)} {...props}>
        {children}
      </form>
    </FormProvider>
  );
};

type FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends string = string
> = {
  name: TName;
};

const FormFieldContext = React.createContext<FormFieldContextValue>({} as FormFieldContextValue);

const FormField = <
  TFieldValues extends FieldValues = FieldValues,
  TName extends string = string
>({
  name,
  children,
}: {
  name: TName;
  children: React.ReactNode;
}) => {
  return (
    <FormFieldContext.Provider value={{ name }}>
      {children}
    </FormFieldContext.Provider>
  );
};

const useFormField = () => {
  const fieldContext = React.useContext(FormFieldContext);
  if (!fieldContext) {
    throw new Error('useFormField should be used within FormField');
  }
  return fieldContext;
};

const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.ComponentProps<'label'>
>(({ className, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        "font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70",
        className
      )}
      style={{ fontSize: '0.875rem' }}
      {...props}
    />
  );
});
FormLabel.displayName = "FormLabel";

const FormControl = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'>
>(({ className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn("mt-2", className)}
      {...props}
    />
  );
});
FormControl.displayName = "FormControl";

const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.ComponentProps<'p'>
>(({ className, children, ...props }, ref) => {
  const { name } = useFormField();
  
  return (
    <p
      ref={ref}
      className={cn("font-medium text-error mt-1", className)}
      style={{ fontSize: '0.875rem' }}
      {...props}
    >
      {children}
    </p>
  );
});
FormMessage.displayName = "FormMessage";

export {
  useForm,
  Form,
  FormField,
  FormLabel,
  FormControl,
  FormMessage,
}; 