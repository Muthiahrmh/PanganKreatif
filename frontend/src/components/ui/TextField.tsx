import { forwardRef } from "react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
    ({ label, error, className = "", ...props }, ref) => {
        return (
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">{label}</label>
                <input
                    ref={ref}
                    className={`rounded-xl border px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-brand-blue ${error ? "border-red-400" : "border-ink/15"
                        } ${className}`}
                    {...props}
                />
                {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
        );
    }
);

TextField.displayName = "TextField";
