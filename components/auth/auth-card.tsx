export function AuthCard({
    title,
    subtitle,
    children,
    footer,
}: {
    title: string;
    subtitle?: string;
    children: React.ReactNode;
    footer?: React.ReactNode;
}) {
    return (
        <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4 py-12">
            <div className="w-full max-w-md  border border-border bg-background p-8 shadow-xl">
                <div className="mb-6 text-center">
                     
                    <h1 className="font-playfair text-2xl font-bold">{title}</h1>
                    {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
                </div>
                {children}
                {footer && <div className="mt-6 text-center text-sm text-muted-foreground">{footer}</div>}
            </div>
        </div>
    );
}