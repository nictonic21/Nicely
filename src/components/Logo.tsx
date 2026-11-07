// Text wordmark until the owner's own logo artwork is supplied.
export default function Logo({ light = false }: { light?: boolean }) {
  return (
    <span className={`text-2xl font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}>
      nicely
      <span className="ml-0.5 inline-block h-2.5 w-2.5 rounded-full bg-brand align-baseline" />
    </span>
  );
}
