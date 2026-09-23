import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, User, Users, ChevronLeft, ChevronRight, LogOut } from 'lucide-react';
import { ROUTES } from '../routes/routePaths';
import { useAuth } from '../hooks/useAuth';
import { useAppSelector } from '../store/hooks';
import { useOnboardingGuard } from '../hooks/useOnboardingGuard';
import { ROLE_ADMIN } from '@brainx/shared';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
}

const baseNavItems: NavItem[] = [
  { path: ROUTES.dashboard, label: 'Dashboard', icon: <LayoutDashboard size={18} /> },
  { path: ROUTES.profile, label: 'Profile', icon: <User size={18} /> },
  { path: ROUTES.users, label: 'Users', icon: <Users size={18} />, adminOnly: true },
];

interface SidebarLayoutProps {
  children: React.ReactNode;
}

const SidebarLayout = ({ children }: SidebarLayoutProps) => {
  useOnboardingGuard();
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const role = useAppSelector((state) => state.auth.user?.app_metadata?.role as string | undefined);

  const navItems = baseNavItems.filter((item) => !item.adminOnly || role === ROLE_ADMIN);

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.login);
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-gray-950">
      {/* Sidebar */}
      <aside
        className={`flex flex-col bg-gray-900 text-white transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        {/* Logo / toggle */}
        <div className="flex items-center justify-between px-4 py-5 border-b border-gray-700">
          {!collapsed && <span className="text-lg font-bold tracking-tight">BrainX</span>}
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="p-1 rounded hover:bg-gray-700 transition-colors"
          >
            {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4">
          {navItems.map(({ path, label, icon }) => (
            <NavLink
              key={path}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                  isActive
                    ? 'bg-brand-600 text-white'
                    : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                }`
              }
            >
              {icon}
              {!collapsed && <span>{label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User / logout */}
        <div className="border-t border-gray-700 p-4">
          {!collapsed && <p className="mb-2 truncate text-xs text-gray-400">{user?.email}</p>}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors"
          >
            <LogOut size={16} />
            {!collapsed && <span>Sign out</span>}
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto p-6 dark:bg-gray-900 dark:text-gray-100">
        {children}
      </main>
    </div>
  );
};

export default SidebarLayout;
