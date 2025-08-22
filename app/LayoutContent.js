'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './components/Sidebar';

export default function LayoutContent({ children }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/' || pathname === '/login';
  
  // Define the routes where sidebar should be visible
  const showSidebar = [
    '/dashboard',
    '/menu',
    '/table',
    '/order-history',
    '/order-control'
  ].some(route => pathname.startsWith(route));

  if (isLoginPage) {
    return (
      <div className="min-h-screen w-full overflow-x-hidden">
        {children}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      {showSidebar && <Sidebar />}
      <main className={`flex-1 overflow-y-auto ${showSidebar ? 'md:ml-64' : ''}`}>
        {children}
      </main>
    </div>
  );
}
