import Link from "next/link";
import { WarmShell } from "@/ui/landing/shell";

export function Landing() {
  return (
    <WarmShell>
      <main className="lw-main">
        <section className="lw-hero">
          <h1 className="lw-headline">
            A personalized <em>Study Guide</em>
            <br />
            tailored to your goals
          </h1>
          <p className="lw-subtitle">
            Describe your destination, and let Compass write a clear, ordered plan to get there.
          </p>

          <Link href="/guide" className="lw-cta">
            Get started
            <span aria-hidden="true">→</span>
          </Link>
        </section>
      </main>
    </WarmShell>
  );
}
