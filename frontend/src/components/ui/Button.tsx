interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    variant?: "primary" | "outline";
}

export function Button({
    loading,
    variant = "primary",
    className = "",
    children,
    disabled,
    ...props
}: ButtonProps) {
    const base =
        "flex items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed";
    const variants = {
        primary:
            "bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white hover:scale-[1.02] shadow-md shadow-brand-blue/20",
        outline: "border border-ink/15 text-ink hover:border-brand-blue hover:text-brand-blue",
    };

    return (
        <button
            className={`${base} ${variants[variant]} ${className}`}
            disabled={disabled || loading}
            {...props}
        >
            {loading && (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            )}
            {children}
        </button>
    );
}
