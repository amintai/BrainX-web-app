interface PublicLayoutProps {
  children: React.ReactNode;
}

const PublicLayout = ({ children }: PublicLayoutProps) => (
  <div className="flex min-h-screen items-center justify-center bg-gray-50">{children}</div>
);

export default PublicLayout;
