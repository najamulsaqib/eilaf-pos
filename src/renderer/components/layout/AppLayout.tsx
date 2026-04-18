import { ReactNode } from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

interface AppLayoutProps {
  children: ReactNode;
  fullscreen?: boolean;
}

export default function AppLayout({
  children,
  fullscreen = false,
}: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-surface-raised border border-edge">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main
          className={
            fullscreen ? 'flex-1 overflow-hidden' : 'flex-1 overflow-auto'
          }
        >
          <div
            className={
              fullscreen
                ? 'w-full h-full'
                : 'w-full min-h-full mx-auto px-4 sm:px-6 lg:px-8 py-8'
            }
          >
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
