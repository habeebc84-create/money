import Link from "next/link";

export default function NotFound() {
  return (
    <div className="grid place-items-center py-20 text-center">
      <p className="figures text-5xl font-semibold text-muted">404</p>
      <h1 className="mt-3 text-2xl font-extrabold">This page isn&apos;t in the passbook</h1>
      <Link href="/" className="mt-6 inline-flex h-11 items-center rounded-xl bg-brand px-4 font-semibold text-on-brand">Back to home</Link>
    </div>
  );
}
