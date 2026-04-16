import {
  Cog6ToothIcon,
  HomeIcon,
  ArrowLeftStartOnRectangleIcon as LogoutIcon,
} from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import logo from '../../../../assets/icon.png';

const navItemClassName = ({ isActive }: { isActive: boolean }) =>
  `w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
    isActive
      ? 'bg-blue-50 text-blue-700'
      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
  }`;

const navIconClassName = (isActive: boolean) =>
  `me-3 h-5 w-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`;

export default function Sidebar() {
  const { t } = useTranslation();

  const screens = [
    { name: t('nav.dashboard'), href: '/', icon: HomeIcon },
  ];

  return (
    <div className="flex flex-col w-64 bg-white border-e border-slate-200">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b border-slate-200 px-4">
        <img
          src={logo}
          alt="Eilaf POS"
          className="h-full w-auto object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {screens.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            end={item.href === '/'}
            className={navItemClassName}
          >
            {({ isActive }) => (
              <>
                <item.icon className={navIconClassName(isActive)} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-slate-200 space-y-1">
        <NavLink to="/settings" className={navItemClassName}>
          {({ isActive }) => (
            <>
              <Cog6ToothIcon className={navIconClassName(isActive)} />
              {t('nav.settings')}
            </>
          )}
        </NavLink>
        <button
          type="button"
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogoutIcon className="me-3 h-5 w-5" />
          {t('nav.signOut')}
        </button>
      </div>
    </div>
  );
}
