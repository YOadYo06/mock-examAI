import React from "react";
import {
  Controller,
  FieldPath,
  FieldValues,
  FormProvider,
  useFormContext,
} from "react-hook-form";

export const Form = FormProvider;

interface FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> {
  name: TName;
  render: (props: {
    field: any;
    fieldState: any;
    formState: any;
  }) => React.ReactElement;
}

export const FormField = Controller as any;

export const FormControl = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ ...props }, ref) => <div ref={ref} {...props} />);
FormControl.displayName = "FormControl";

export const FormItem = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = "", ...props }, ref) => (
  <div ref={ref} className={`space-y-2 ${className}`.trim()} {...props} />
));
FormItem.displayName = "FormItem";

export const FormLabel = React.forwardRef<
  HTMLLabelElement,
  React.LabelHTMLAttributes<HTMLLabelElement>
>(({ className = "", ...props }, ref) => (
  <label
    ref={ref}
    className={`block text-sm font-medium text-gray-700 ${className}`.trim()}
    {...props}
  />
));
FormLabel.displayName = "FormLabel";

export const FormMessage = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = "", ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm font-medium text-red-500 ${className}`.trim()}
    {...props}
  />
));
FormMessage.displayName = "FormMessage";

export function useFormField() {
  const fieldContext = React.useContext(FormFieldContext);

  if (!fieldContext) {
    throw new Error("useFormField should be used within <FormField>");
  }

  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  const fieldState = getFieldState(fieldContext.name, formState);

  return {
    ...fieldContext,
    formItemId: itemContext?.formItemId,
    formDescriptionId: itemContext?.formDescriptionId,
    formMessageId: itemContext?.formMessageId,
    ...fieldState,
  };
}

const FormFieldContext = React.createContext<{
  name: FieldPath<FieldValues>;
}>(
  { name: "" } as any
);

const FormItemContext = React.createContext<{
  formItemId: string;
  formDescriptionId: string;
  formMessageId: string;
}>(
  {
    formItemId: "",
    formDescriptionId: "",
    formMessageId: "",
  }
);
