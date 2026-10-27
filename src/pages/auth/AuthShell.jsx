import { Link } from "react-router";
import { Brand } from "../../components/Brand.jsx";

export function AuthShell({ title, subtitle, children, footer }) {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Brand />
        </div>
        <div className="card">
          <h1 className="text-xl font-extrabold">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
          <div className="mt-5">{children}</div>
        </div>
        {footer && <div className="mt-5 text-center text-sm text-muted">{footer}</div>}
        <p className="mt-6 text-center text-xs">
          <Link to="/" className="font-semibold text-link hover:underline">Back to public page</Link>
        </p>
      </div>
    </main>
  );
}

export function FormMessage({ error, success }) {
  if (error) return <p role="alert" className="rounded-xl bg-full/10 px-3 py-2 text-sm font-semibold text-full">{error}</p>;
  if (success) return <p role="status" className="rounded-xl bg-open/10 px-3 py-2 text-sm font-semibold text-open">{success}</p>;
  return null;
}
