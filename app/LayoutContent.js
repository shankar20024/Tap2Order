'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './components/Sidebar';

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';
  const isLandingPage = pathname === '/';

  if (isLoginPage || isLandingPage) {
    return (
      <div className="min-h-screen bg-gray-50">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />
      <main className="flex-1 overflow-y-auto md:ml-64 p-4 md:p-6">
        {children}
      </main>
    </div>
  );
}
