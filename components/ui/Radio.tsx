import { InputHTMLAttributes, forwardRef } from "react";
import { clsx } from "clsx";

interface RadioProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

const Radio = forwardRef<HTMLInputElement, RadioProps>(
  ({ className, label, ...props }, ref) => {
    return (
      <label className={clsx("flex items-center cursor-pointer group", className)}>
        <input
          ref={ref}
          type="radio"
          className="sr-only"
          {...props}
        />
        <div
          className={clsx(
            "w-5 h-5 rounded-full border-2 mr-3 transition-all flex items-center justify-center",
            "group-hover:border-primary",
            {
              "border-primary bg-primary": props.checked,
              "border-gray-300": !props.checked,
            }
          )}
        >
          {props.checked && (
            <div className="w-2 h-2 rounded-full bg-white" />
          )}
        </div>
        <span className="text-text">{label}</span>
      </label>
    );
  }
);

Radio.displayName = "Radio";

export default Radio;


