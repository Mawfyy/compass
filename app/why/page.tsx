import { WarmShell } from "@/ui/landing/shell";
import { FEATURES } from "@/ui/landing/content";

export default function WhyPage() {
  return (
    <WarmShell active="why">
      <main className="lw-page">
        <div className="lw-page-head">
          <span className="lw-eyebrow">Why Compass</span>
          <h1 className="lw-page-title">
            Guidance, not <em>guesswork</em>
          </h1>
          <p className="lw-page-sub">
            Most tools dump a pile of links on you. Compass turns any goal into a
            clear, ordered path with the right materials at each step.
          </p>
        </div>
        <div className="lw-feature-grid">
          {FEATURES.map((feature) => (
            <div className="lw-feature" key={feature.title}>
              <span className="lw-feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.body}</p>
            </div>
          ))}
        </div>
      </main>
    </WarmShell>
  );
}