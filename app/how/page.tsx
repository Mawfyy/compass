import { WarmShell } from "@/ui/landing/shell";
import { STEPS } from "@/ui/landing/content";

export default function HowPage() {
  return (
    <WarmShell active="how">
      <main className="lw-page">
        <div className="lw-page-head">
          <span className="lw-eyebrow">How it works</span>
          <h1 className="lw-page-title">
            Three steps to <em>clarity</em>
          </h1>
          <p className="lw-page-sub">
            From a rough idea to a working plan — Compass guides you the whole way.
          </p>
        </div>
        <ol className="lw-steps">
          {STEPS.map((step, i) => (
            <li key={step.title}>
              <span className="lw-step-num">{i + 1}</span>
              <div>
                <h4>{step.title}</h4>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </main>
    </WarmShell>
  );
}