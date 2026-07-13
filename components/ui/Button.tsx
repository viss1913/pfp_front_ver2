import { ButtonHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost";
  isLoading?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", isLoading, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={clsx(
          "px-6 py-3 rounded-8 font-semibold transition-all min-h-[44px] flex items-center justify-center",
          {
            "bg-primary text-dark hover:opacity-90": variant === "primary",
            "bg-secondary text-white hover:opacity-90": variant === "secondary",
            "bg-transparent border border-gray-300 hover:bg-gray-100": variant === "ghost",
            "opacity-50 cursor-not-allowed": disabled || isLoading,
          },
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading ? "Загрузка..." : children}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;


