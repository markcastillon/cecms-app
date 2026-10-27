import { Link } from "react-router";
import { BARANGAY } from "../config.js";

export function Brand({ to = "/" }) {
  return (
    <Link to={to} className="flex items-center gap-2.5" aria-label="CECMS home">
      <svg viewBox="0 0 32 32" className="size-9" aria-hidden="true">
        <rect width="32" height="32" rx="8" fill="var(--brand)" />
        <path d="M16 5 5 13.5V16h2.5v10h17V16H27v-2.5L16 5Z" fill="var(--brand-ink)" />
        <path d="M13 26v-6.5h6V26" fill="var(--accent)" />
      </svg>
      <span className="leading-tight">
        <strong className="block text-base font-extrabold">CECMS</strong>
        <small className="block text-xs whitespace-nowrap text-muted">{BARANGAY}</small>
      </span>
    </Link>
  );
}
