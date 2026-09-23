import { Icon } from '../../../components/Icon.jsx';

const BRAND_LABEL = 'Team BrainX';

/**
 * Logo, brand label, hackathon badge pill, heading, and subtext (FR-002).
 * No local logo asset is committed (see notes.md, 2026-09-23: no
 * image-resizing tool available in this environment) — the circular frame
 * falls back to an `Icon`, exactly the R-10 fallback path the plan already
 * designs for.
 */
export function LoginBrandHeader() {
  return (
    <div className="flex flex-col items-center text-center mb-space-lg">
      <div className="flex items-center gap-space-sm mb-space-sm">
        <div className="w-10 h-10 rounded-full overflow-hidden border border-cyan-500/40 bg-slate-950/80 shadow-xs p-0.5 flex items-center justify-center">
          <Icon name="hub" size={20} className="text-cyan-400" label="BrainX Logo" />
        </div>
        <span className="text-headline-md text-primary tracking-tight font-semibold">
          {BRAND_LABEL}
        </span>
      </div>
      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-surface-container text-on-surface-variant text-code-md font-mono tracking-wider uppercase mb-space-md">
        <span className="w-1.5 h-1.5 rounded-full bg-secondary-container animate-pulse" />
        TNTRA AI HACKATHON 2026
      </span>
      <h1 className="text-headline-lg text-on-surface font-display">Welcome back</h1>
      <p className="text-body-md text-on-surface-variant mt-space-xs">
        Sign in to access your hackathon workspace &amp; projects
      </p>
    </div>
  );
}
