import {
  Cog6ToothIcon,
  HomeIcon,
  ArrowLeftStartOnRectangleIcon as LogoutIcon,
} from '@heroicons/react/24/outline';
import { NavLink } from 'react-router-dom';

import logo from '../../../../assets/icon.png';

const screens = [
  { name: 'Dashboard', href: '/', icon: HomeIcon },
  // Add more static navigation items here as needed
];

const navItemClassName = ({ isActive }: { isActive: boolean }) =>
  `w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors cursor-pointer ${
    isActive
      ? 'bg-blue-50 text-blue-700'
      : 'text-slate-700 hover:bg-slate-50 hover:text-slate-900'
  }`;

const navIconClassName = (isActive: boolean) =>
  `mr-3 h-5 w-5 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`;

export default function Sidebar() {
  return (
    <div className="flex flex-col w-64 bg-white border-r border-slate-200">
      {/* Logo/Brand */}
      <div className="flex h-16 items-center border-b border-slate-200 px-4">
        <img
          src={logo}
          alt="Eilaf pos Consultancy"
          className="h-full w-auto object-contain"
        />
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {/* Static nav items */}
        {screens.map((item) => (
          <NavLink
            key={item.name}
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
              Settings
            </>
          )}
        </NavLink>
        <button
          type="button"
          className="flex items-center w-full px-3 py-2 text-sm font-medium text-red-600 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
        >
          <LogoutIcon className="mr-3 h-5 w-5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}
