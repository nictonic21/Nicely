// Soft, colourful glowing shapes behind the page. Purely decorative.
export default function Glow({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`pointer-events-none absolute inset-x-0 top-0 -z-10 h-[640px] overflow-hidden ${className}`}>
      <div className="absolute -left-24 -top-32 h-[420px] w-[420px] animate-float rounded-full bg-violet-500/25 blur-3xl" />
      <div className="absolute -right-20 top-10 h-[380px] w-[380px] animate-float rounded-full bg-pink-500/20 blur-3xl [animation-delay:-4s]" />
      <div className="absolute left-1/3 top-64 h-[320px] w-[320px] animate-float rounded-full bg-amber-400/20 blur-3xl [animation-delay:-8s]" />
    </div>
  );
}
