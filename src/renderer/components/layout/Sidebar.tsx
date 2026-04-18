import { useAuth } from '@contexts/AuthContext';
import {
  ChartBarIcon,
  Cog6ToothIcon,
  CubeIcon,
  DocumentTextIcon,
  HomeIcon,
  PowerIcon,
} from '@heroicons/react/24/outline';
import { useSettings } from '@hooks/useSettings';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';

import logo from '../../../../assets/icon.png';

// ── Slim sidebar ───────────────────────────────────────────────────────────────

function SlimNavLink({
  href,
  icon: Icon,
  label,
  end,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={href}
      end={end}
      className={({ isActive }) =>
        `group relative flex items-center justify-center w-11 h-11 rounded-2xl transition-all ${
          isActive
            ? 'bg-primary-600 shadow-md shadow-primary-200 dark:shadow-primary-900/50'
            : 'hover:bg-surface-muted'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`w-5 h-5 ${isActive ? 'text-white' : 'text-ink-ghost'}`}
          />
          {/* Tooltip — intentionally dark-on-dark for contrast */}
          <span className="pointer-events-none absolute start-full ms-3 z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {label}
          </span>
        </>
      )}
    </NavLink>
  );
}

function SlimSidebar() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const mainNav = [
    { href: '/', label: t('nav.dashboard'), icon: HomeIcon, end: true },
    { href: '/bills', label: t('nav.bills'), icon: DocumentTextIcon },
    { href: '/products', label: t('nav.products'), icon: CubeIcon },
    { href: '/reports', label: t('nav.reports'), icon: ChartBarIcon },
  ];

  return (
    <div className="flex flex-col items-center w-18 shrink-0 bg-surface my-3 ms-3 rounded-2xl shadow-lg shadow-slate-200/60 dark:shadow-slate-900/60 py-3 gap-3">
      {/* Logo */}
      <div className="flex items-center justify-center w-11 h-11 mb-1">
        <img src={logo} alt="Eilaf POS" className="h-8 w-8 object-contain" />
      </div>

      {/* Main nav group */}
      <div className="flex flex-col items-center gap-1 bg-surface rounded-2xl p-1.5 shadow-sm border border-edge-muted">
        {mainNav.map((item) => (
          <SlimNavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            end={item.end}
          />
        ))}
      </div>

      {/* Spacer */}
      <div className="flex-1" />

      {/* Settings + Sign out at bottom */}
      <div className="flex flex-col items-center gap-1 bg-surface rounded-2xl p-1.5 shadow-sm border border-edge-muted">
        <SlimNavLink
          href="/settings"
          icon={Cog6ToothIcon}
          label={t('nav.settings')}
        />
        <button
          type="button"
          title={t('nav.signOut')}
          onClick={signOut}
          className="group relative flex items-center justify-center w-11 h-11 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-all cursor-pointer"
        >
          <PowerIcon className="w-5 h-5 text-red-500 transition-colors" />
          <span className="pointer-events-none absolute start-full ms-3 z-50 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs font-medium text-white opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
            {t('nav.signOut')}
          </span>
        </button>
      </div>
    </div>
  );
}

// ── Full sidebar ───────────────────────────────────────────────────────────────

function FullNavLink({
  href,
  icon: Icon,
  label,
  end,
}: {
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  end?: boolean;
}) {
  return (
    <NavLink
      to={href}
      end={end}
      className={({ isActive }) =>
        `flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all cursor-pointer ${
          isActive
            ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-400'
            : 'text-ink-dim hover:bg-surface-raised hover:text-ink'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <Icon
            className={`w-5 h-5 shrink-0 ${isActive ? 'text-primary-600 dark:text-primary-400' : 'text-ink-ghost'}`}
          />
          {label}
        </>
      )}
    </NavLink>
  );
}

function FullSidebar() {
  const { t } = useTranslation();
  const { signOut } = useAuth();

  const mainNav = [
    { href: '/', label: t('nav.dashboard'), icon: HomeIcon, end: true },
    { href: '/bills', label: t('nav.bills'), icon: DocumentTextIcon },
    { href: '/products', label: t('nav.products'), icon: CubeIcon },
    { href: '/reports', label: t('nav.reports'), icon: ChartBarIcon },
  ];

  return (
    <div className="flex flex-col w-56 shrink-0 bg-surface my-3 ms-3 rounded-2xl shadow-lg shadow-slate-200/60 dark:shadow-slate-900/60 overflow-hidden">
      {/* Logo + app name */}
      <div className="flex flex-col border-b border-edge px-4 py-3 gap-0.5">
        <div className="flex items-center gap-2.5">
          <img
            src={logo}
            alt="Eilaf POS"
            className="h-7 w-auto object-contain shrink-0"
          />
          <span className="text-sm font-bold text-ink">Eilaf POS</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {mainNav.map((item) => (
          <FullNavLink
            key={item.href}
            href={item.href}
            icon={item.icon}
            label={item.label}
            end={item.end}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-edge-muted space-y-0.5">
        <FullNavLink
          href="/settings"
          icon={Cog6ToothIcon}
          label={t('nav.settings')}
        />
        <button
          type="button"
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 text-sm font-medium text-red-500 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors cursor-pointer"
        >
          <PowerIcon className="w-5 h-5 shrink-0" />
          {t('nav.signOut')}
        </button>
      </div>
    </div>
  );
}

// ── Export ─────────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const { settings } = useSettings();
  return settings.sidebar_style === 'slim' ? <SlimSidebar /> : <FullSidebar />;
}
