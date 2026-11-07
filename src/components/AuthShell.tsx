export default function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-10rem)] max-w-md flex-col justify-center px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-extrabold tracking-tight">{title}</h1>
      {subtitle ? <p className="mt-2 text-ink/70">{subtitle}</p> : null}
      <div className="mt-8">{children}</div>
    </main>
  );
}
