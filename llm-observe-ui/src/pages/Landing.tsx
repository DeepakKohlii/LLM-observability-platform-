interface Props {
  onTryGuest: () => void;
  onUseOwnKey: () => void;
}

const FEATURES = [
  {
    title: "Trace every call",
    desc: "Prompts, responses, latency, tokens, and cost — logged automatically.",
  },
  {
    title: "Live dashboards",
    desc: "Cost-per-day and calls-per-day charts update as you chat.",
  },
  {
    title: "Multi-provider",
    desc: "OpenAI, OpenRouter, Groq, Anthropic, or any OpenAI-compatible API.",
  },
  {
    title: "Self-hosted",
    desc: "Run the backend and dashboard locally. Your trace data stays on your machine.",
  },
];

function Landing({ onTryGuest, onUseOwnKey }: Props) {
  return (
    <div className="landing">
      <div className="landing-grid-bg" />

      <header className="landing-nav">
        <div className="landing-logo">
          llm<span>_observe</span>
        </div>
        <div className="landing-nav-actions">
          <button type="button" className="landing-btn landing-btn-ghost" onClick={onUseOwnKey}>
            sign in with API key
          </button>
          <span className="landing-btn landing-btn-outline landing-btn-disabled" title="Mac app not released yet">
            Mac app — coming soon
          </span>
        </div>
      </header>

      <section className="landing-hero">
        <div className="landing-hero-badge">open-source LLM observability</div>
        <h1 className="landing-hero-title">
          See what your
          <br />
          LLM calls <span>actually cost</span>
        </h1>
        <p className="landing-hero-sub">
          llm_observe tracks every prompt, response, latency spike, and dollar
          spent — then turns it into a developer dashboard you can share with
          your team.
        </p>

        <div className="landing-hero-cta">
          <button
            type="button"
            className="landing-btn landing-btn-primary landing-btn-lg"
            onClick={onTryGuest}
          >
            try it free — 5 calls →
          </button>
          <button
            type="button"
            className="landing-btn landing-btn-outline landing-btn-lg"
            onClick={onUseOwnKey}
          >
            use your API key
          </button>
        </div>

        <p className="landing-hero-note">
          No signup required for guest demo · API key stays in your browser
        </p>
      </section>

      <section className="landing-features">
        {FEATURES.map((f) => (
          <div key={f.title} className="landing-feature-card">
            <div className="landing-feature-title">{f.title}</div>
            <p className="landing-feature-desc">{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="landing-download">
        <div className="landing-download-inner">
          <div>
            <div className="landing-download-label">desktop app</div>
            <h2 className="landing-download-title">Native Mac app</h2>
            <p className="landing-download-desc">
              A packaged .dmg is planned for one-click install (backend +
              dashboard bundled). It is not available yet — use the web app or
              run from source today.
            </p>
          </div>
          <span
            className="landing-btn landing-btn-primary landing-btn-lg landing-btn-disabled"
            title="Not released yet — placeholder was causing corrupted downloads"
          >
            coming soon
          </span>
        </div>
      </section>

      <footer className="landing-footer">
        <span>llm_observe · platform v1.0</span>
        <button type="button" className="landing-link-btn" onClick={onTryGuest}>
          try guest demo
        </button>
      </footer>
    </div>
  );
}

export default Landing;
