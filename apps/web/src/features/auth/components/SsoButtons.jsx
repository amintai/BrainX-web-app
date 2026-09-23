/** Decorative "Or continue with" divider + two non-functional SSO buttons (FR-006). */
export function SsoButtons() {
  return (
    <>
      <div className="relative my-space-lg flex items-center justify-center">
        <div className="w-full h-px bg-surface-container-high" />
        <span className="absolute px-3 bg-surface-container-lowest text-outline text-label-sm uppercase tracking-wider">
          Or continue with
        </span>
      </div>
      <div className="grid grid-cols-2 gap-space-sm">
        <button
          type="button"
          className="flex items-center justify-center gap-2 h-10 px-3 bg-surface-container-low hover:bg-surface-container hover:shadow-xs text-on-surface rounded-lg transition-all text-label-md cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.67v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.16z"
              fill="#4285F4"
            />
            <path
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.15C3.25 21.31 7.31 24 12 24z"
              fill="#34A853"
            />
            <path
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.27C.46 8.2.01 10.05.01 12s.45 3.8 1.26 5.42l4.01-3.15z"
              fill="#FBBC05"
            />
            <path
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.25 2.69 1.27 6.58l4.01 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
              fill="#EA4335"
            />
          </svg>
          <span className="truncate">Google SSO</span>
        </button>
        <button
          type="button"
          className="flex items-center justify-center gap-2 h-10 px-3 bg-surface-container-low hover:bg-surface-container hover:shadow-xs text-on-surface rounded-lg transition-all text-label-md cursor-pointer"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 23 23" aria-hidden="true">
            <path d="M1 1h10v10H1z" fill="#f35325" />
            <path d="M12 1h10v10H12z" fill="#81bc06" />
            <path d="M1 12h10v10H1z" fill="#05a6f0" />
            <path d="M12 12h10v10H12z" fill="#ffba08" />
          </svg>
          <span className="truncate">Microsoft</span>
        </button>
      </div>
    </>
  );
}
