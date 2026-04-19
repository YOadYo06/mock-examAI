import React from "react";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = "", ...props }, ref) => {
    const baseStyles =
      "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";
    const finalClassName = `${baseStyles} ${className}`.trim();

    return <input ref={ref} className={finalClassName} {...props} />;
  }
);

Input.displayName = "Input";
