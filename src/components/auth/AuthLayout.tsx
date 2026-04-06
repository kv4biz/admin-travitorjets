import { Plane } from "lucide-react";
import { Testimonials } from "./testimonials";

interface AuthLayoutProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthLayout({ children, title, subtitle }: AuthLayoutProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x">
      <div className="flex h-screen items-center justify-center">
        <div className="mx-auto w-full max-w-lg px-10 py-14 sm:rounded-xl sm:border shadow-sm">
          <Plane className="mx-auto size-8" />
          <h1 className="mt-3 text-center font-semibold text-2xl">{title}</h1>
          {subtitle && (
            <p className="mt-2 text-center text-muted-foreground text-sm">
              {subtitle}
            </p>
          )}

          <div className="mt-10">{children}</div>
        </div>
      </div>

      <div className="relative flex h-full w-full flex-col overflow-hidden bg-muted/50 dark:bg-muted/30">
        <img
          alt="TraviatorJets Admin"
          className="absolute inset-0 size-full object-cover"
          src="/images/ascii-art.svg"
        />

        <Testimonials />
      </div>
    </div>
  );
}
