export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-muted/20 p-0 sm:p-6">
      <div className="w-full max-w-130 bg-background px-6 py-12 sm:rounded-3xl sm:px-10 sm:shadow-xl sm:border lg:px-14">
        <div className="flex items-center justify-center">
          {children}
        </div>
      </div>
    </div>
  );
}

export function FormShell({ children }: { children: React.ReactNode }) {
  return <div className="w-full max-w-100 animate-in fade-in slide-in-from-bottom-2 duration-500">{children}</div>;
}

export function Divider() {
  return (
    <div className="flex items-center gap-4 py-1 text-muted-foreground">
      <span className="h-px flex-1 bg-border" />
      <span className="text-xs font-medium tracking-wide">OR</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  );
}

export function Heading({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="mb-7">
      <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
    </div>
  );
}
