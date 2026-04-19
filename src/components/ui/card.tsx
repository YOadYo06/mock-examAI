import React from "react";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = "", ...props }, ref) => {
    const baseStyles = "bg-white rounded-lg shadow-md border border-gray-200";
    const finalClassName = `${baseStyles} ${className}`.trim();

    return <div ref={ref} className={finalClassName} {...props} />;
  }
);

Card.displayName = "Card";
