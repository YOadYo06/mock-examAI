import React from "react";

interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className = "", ...props }, ref) => {
    const baseStyles =
      "w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none";
    const finalClassName = `${baseStyles} ${className}`.trim();

    return <textarea ref={ref} className={finalClassName} {...props} />;
  }
);

Textarea.displayName = "Textarea";
