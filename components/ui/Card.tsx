import { HTMLAttributes, ReactNode } from "react";
import { clsx } from "clsx";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
}

export default function Card({ className, children, ...props }: CardProps) {
  return (
    <div
      className={clsx(
        "bg-white rounded-12 p-6 shadow-sm border border-gray-200",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}


