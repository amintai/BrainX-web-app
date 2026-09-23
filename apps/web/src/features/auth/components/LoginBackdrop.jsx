/** Two blurred gradient decoration elements behind the login card (FR-002). */
export function LoginBackdrop() {
  return (
    <>
      <div
        aria-hidden="true"
        className="absolute -top-12 -left-12 w-48 h-48 bg-primary-fixed-dim/20 rounded-full blur-3xl pointer-events-none"
      />
      <div
        aria-hidden="true"
        className="absolute -bottom-10 -right-10 w-44 h-44 bg-secondary-fixed/40 rounded-full blur-3xl pointer-events-none"
      />
    </>
  );
}
