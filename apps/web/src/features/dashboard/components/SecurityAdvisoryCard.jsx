import { Icon } from '../../../components/Icon.jsx';

/** Static enterprise security advisory (FR-021). No hook, no data fetch. */
export function SecurityAdvisoryCard() {
  return (
    <section className="rounded-xl bg-primary text-on-primary p-space-md relative overflow-hidden shadow-md">
      <div className="absolute right-0 top-0 w-32 h-32 bg-secondary/30 rounded-full blur-xl pointer-events-none" />
      <div className="relative z-10 flex items-start gap-space-sm">
        <Icon name="verified" size={24} className="text-secondary-fixed shrink-0 mt-0.5" />
        <div className="flex flex-col gap-1">
          <span className="text-label-lg text-on-primary font-semibold">
            Enterprise Security Guarantee
          </span>
          <p className="text-body-sm text-primary-fixed-dim">
            All 2,845 user sessions enforce hardware-backed FIDO2 and biometric 2FA. No credential
            anomalies detected in the last 30 days.
          </p>
        </div>
      </div>
    </section>
  );
}
