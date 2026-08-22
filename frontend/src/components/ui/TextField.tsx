"use client";

import { forwardRef, useState } from "react";
import { Eye, EyeOff } from "lucide-react";

interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(
    ({ label, error, className = "", type = "text", ...props }, ref) => {
        const [terlihat, setTerlihat] = useState(false);

        // Tombol mata hanya untuk isian kata sandi
        const isPassword = type === "password";
        const tipeAktif = isPassword && terlihat ? "text" : type;

        return (
            <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-ink">{label}</label>

                <div className="relative">
                    <input
                        ref={ref}
                        type={tipeAktif}
                        className={`w-full rounded-xl border px-4 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-ink-soft/50 focus:border-brand-blue ${isPassword ? "pr-11" : ""
                            } ${error ? "border-red-400" : "border-ink/15"} ${className}`}
                        {...props}
                    />

                    {isPassword && (
                        <button
                            type="button"
                            onClick={() => setTerlihat((v) => !v)}
                            // tabIndex -1 supaya Tab langsung lompat ke isian
                            // berikutnya, bukan mampir ke tombol ini
                            tabIndex={-1}
                            aria-label={terlihat ? "Sembunyikan kata sandi" : "Tampilkan kata sandi"}
                            className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-soft transition-colors hover:text-ink"
                        >
                            {terlihat ? <EyeOff size={17} /> : <Eye size={17} />}
                        </button>
                    )}
                </div>

                {error && <span className="text-xs text-red-500">{error}</span>}
            </div>
        );
    }
);

TextField.displayName = "TextField";