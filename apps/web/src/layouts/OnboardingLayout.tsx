interface OnboardingLayoutProps {
  children: React.ReactNode;
}

const OnboardingLayout = ({ children }: OnboardingLayoutProps) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">{children}</div>
);

export default OnboardingLayout;
