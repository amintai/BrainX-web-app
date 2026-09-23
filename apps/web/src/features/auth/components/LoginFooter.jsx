/** Footer links + TLS/SOC2 static line (FR-007). Links are inert (out of scope). */
export function LoginFooter() {
  return (
    <div className="mt-space-lg flex flex-col items-center gap-space-xs text-center">
      <div className="flex items-center gap-space-md text-body-sm text-on-surface-variant">
        <button type="button" className="hover:text-primary transition-colors">
          Terms of Service
        </button>
        <span>•</span>
        <button type="button" className="hover:text-primary transition-colors">
          Privacy Policy
        </button>
        <span>•</span>
        <button type="button" className="hover:text-primary transition-colors">
          Enterprise Support
        </button>
      </div>
      <p className="text-code-md font-mono text-outline">
        Encrypted via TLS 1.3 &amp; SOC2 Type II Certified
      </p>
    </div>
  );
}
