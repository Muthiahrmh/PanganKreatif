interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    loading?: boolean;
    variant?: "primary" | "tani" | "outline";
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

    /**
     * Warna diatur lewat varian, bukan lewat className dari luar.
     *
     * Tailwind menentukan kelas mana yang menang dari urutannya di
     * berkas CSS, bukan dari urutan penulisan di atribut class. Jadi
     * menimpa warna lewat className tidak bisa diandalkan — bisa
     * menang, bisa juga kalah, tergantung urutan di hasil build.
     */
    const variants = {
        primary:
            "bg-gradient-to-r from-brand-blue to-brand-blue-dark text-white hover:scale-[1.02] shadow-md shadow-brand-blue/20",
        tani:
            "bg-gradient-to-r from-leaf to-leaf-dark text-white hover:scale-[1.02] shadow-md shadow-leaf/20",
        outline:
            "border border-ink/15 text-ink hover:border-brand-blue hover:text-brand-blue",
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