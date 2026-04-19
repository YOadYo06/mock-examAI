import React from "react";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "outline";
  size?: "sm" | "md" | "lg";
  children: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "default", size = "md", className = "", ...props }, ref) => {
    const baseStyles =
      "font-semibold rounded-lg transition-colors duration-200 inline-flex items-center justify-center";

    const variantStyles = {
      default: "bg-indigo-600 text-white hover:bg-indigo-700 active:bg-indigo-800",
      outline:
        "border-2 border-indigo-600 text-indigo-600 hover:bg-indigo-50 active:bg-indigo-100",
    };

    const sizeStyles = {
      sm: "px-3 py-1 text-sm",
      md: "px-4 py-2 text-base",
      lg: "px-6 py-3 text-lg",
    };

    const finalClassName = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${className}`.trim();

    return (
      <button ref={ref} className={finalClassName} {...props} />
    );
  }
);

Button.displayName = "Button";
