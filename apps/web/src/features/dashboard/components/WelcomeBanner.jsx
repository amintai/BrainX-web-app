import { Icon } from '../../../components/Icon.jsx';
import { useIdentity } from '../../auth/useIdentity.js';

/** Personalized welcome header banner (FR-015). */
export function WelcomeBanner() {
  const { firstName } = useIdentity();

  return (
    <section className="relative overflow-hidden rounded-xl bg-surface-container-lowest p-space-lg shadow-xs">
      <div className="absolute -right-16 -top-20 w-80 h-80 rounded-full bg-secondary-fixed/30 blur-3xl pointer-events-none" />
      <div className="absolute right-48 -bottom-16 w-56 h-56 rounded-full bg-tertiary-fixed/20 blur-2xl pointer-events-none" />
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-space-md">
        <div className="flex flex-col gap-space-xs max-w-2xl">
          <div className="flex items-center gap-space-xs">
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-label-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse" />
              Production Realm · us-east-1
            </span>
            <span className="text-code-md font-mono text-outline">v4.12.0</span>
          </div>
          <h1 className="text-display-lg text-on-surface tracking-tight font-display">
            Welcome back, {firstName}! <span aria-hidden="true"> 👋</span>
          </h1>
          <p className="text-body-lg text-on-surface-variant">
            Here is what is happening across your enterprise organization today.
          </p>
        </div>
        <div className="flex items-center gap-space-sm flex-wrap">
          <button
            type="button"
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-surface-container-high hover:bg-surface-container-highest text-on-surface text-label-lg transition-colors shadow-xs"
          >
            <Icon name="receipt_long" size={18} />
            <span>View Audit Log</span>
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-space-xs px-space-md py-space-sm rounded-lg bg-secondary hover:bg-secondary-container text-on-secondary text-label-lg transition-all shadow-md active:scale-95"
          >
            <Icon name="person_add" size={18} />
            <span>Invite Team Member</span>
          </button>
        </div>
      </div>
    </section>
  );
}
