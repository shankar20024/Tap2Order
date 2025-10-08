'use client';

import { usePathname } from 'next/navigation';
import Sidebar from './components/Sidebar';
import { SidebarProvider, useSidebar } from './contexts/SidebarContext';
import { useSession } from 'next-auth/react';

function LayoutContentInner({ children }) {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const isLoginPage = pathname === '/' || pathname === '/login';
  const { isCollapsed } = useSidebar();
  
  // Define the routes where sidebar should be visible
  const showSidebar = status === 'authenticated' && [
    '/dashboard',
    '/menu',
    '/table',
    '/order-history',
    '/order-control',
    '/customers',
    '/analytics',
    '/takeaway',
    '/billing',
    '/support'

  ].some(route => pathname.startsWith(route));

  if (status === 'loading') {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-amber-500"></div>
      </div>
    );
  }

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
      <main className={`flex-1 overflow-y-auto transition-all duration-300 ${
        showSidebar 
          ? isCollapsed 
            ? 'md:ml-16' 
            : 'md:ml-64' 
          : ''
      }`}>
        {children}
      </main>
    </div>
  );
}

export default function LayoutContent({ children }) {
  return (
    <SidebarProvider>
      <LayoutContentInner>{children}</LayoutContentInner>
    </SidebarProvider>
  );
}
