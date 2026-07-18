import { Suspense } from "react";
import { FiscalShell } from "./shell";

function Fallback() {
  return (
    <div className="mx-auto max-w-7xl px-6 py-6">
      <div className="skeleton h-10 w-48" />
      <div className="mt-5 skeleton h-9 w-full max-w-2xl" />
      <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="skeleton h-36" />
        ))}
      </div>
    </div>
  );
}

export default function FiscalLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<Fallback />}>
      <FiscalShell>{children}</FiscalShell>
    </Suspense>
  );
}
