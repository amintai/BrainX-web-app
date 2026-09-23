/** Static "BrainX Cloud Portal · Hackathon ready" strip (design parity). */
export function PortalStatusStrip() {
  return (
    <div className="mt-space-lg p-space-sm bg-surface-container-low rounded-lg flex items-center justify-between">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-on-tertiary-container animate-pulse" />
        <span className="text-body-sm text-on-surface-variant">BrainX Cloud Portal</span>
      </div>
      <span className="text-code-md font-mono text-on-surface-variant font-medium">
        Hackathon ready
      </span>
    </div>
  );
}
