'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUtensils,
  FaBars,
  FaTimes,
  FaHistory,
  FaListAlt,
  FaClipboardList,
  FaUsers,
  FaQuestionCircle,
  FaSlidersH,
  FaUserCog,
  FaChartLine,
  FaPrint,
  FaShoppingBag,
  FaReceipt,
} from 'react-icons/fa';
import { HiUserCircle } from 'react-icons/hi';
import LogoutButton from './Logout';
import { useSidebar } from '../contexts/SidebarContext';
import { useSession } from 'next-auth/react';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: <FaUtensils /> },
  { name: 'Orders', path: '/order-history', icon: <FaHistory /> },
  { name: 'Menu', path: '/menu', icon: <FaListAlt /> },
  { name: 'Tables', path: '/table', icon: <FaClipboardList /> },
  { name: 'Takeaway', path: '/takeaway', icon: <FaShoppingBag /> },
  { name: 'Billing', path: '/billing', icon: <FaReceipt /> },
  { name: 'Customers', path: '/customers', icon: <FaUsers /> },
  { name: 'Analytics', path: '/analytics', icon: <FaChartLine /> },
  { name: 'Staff', path: '/staff-management', icon: <FaUserCog /> },
  { name: 'Order Control', path: '/order-control', icon: <FaSlidersH /> },
  // { name: 'Printer Settings', path: '/printer-settings', icon: <FaPrint /> },
  { name: 'Support', path: '/support', icon: <FaQuestionCircle /> },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const { isCollapsed, setIsCollapsed } = useSidebar();
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const { data: session, status } = useSession();

  const publicPaths = ['/login', '/', '/support', '/qr', '/customer-bill'];

  if (status !== 'authenticated' && publicPaths.some(path => pathname.startsWith(path))) {
    return null;
  }

  if (status === 'loading') {
    return null; // Or a loading spinner
  }

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleNavigation = () => {
    if (isMobile) setIsOpen(false);
  };

  const sidebarVariants = {
    open: { x: 0 },
    closed: { x: '-100%' },
  };

  const handleLogout = () => {
    // Add your logout logic here
    // Example: signOut();
  };

  return (
    <>
      {/* Mobile Hamburger */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed top-8 left-4 z-[60] p-2 rounded-md bg-gradient-to-r from-amber-600 to-amber-500 text-white md:hidden "
        initial={false}
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.3 }}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <FaTimes size={18} /> : <FaBars size={18} />}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {(isOpen || !isMobile) && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={sidebarVariants}
            transition={{ type: 'tween', ease: 'easeInOut', duration: 0.3 }}
            className={`fixed px-0 left-0 z-[45] ${isCollapsed && !isMobile ? 'w-16' : 'w-64'} bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-lg flex flex-col top-20 md:top-16 h-[calc(100vh-5rem)] md:h-[calc(100vh-4rem)] transition-all duration-300`}
          >
            {/* Collapse/Expand Button - Desktop Only */}
            {!isMobile && (
              <div className="flex justify-end p-2 border-b border-gray-700">
                <button
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-gray-700/50 transition-colors"
                  title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
                >
                  {isCollapsed ? <FaBars size={16} /> : <FaTimes size={16} />}
                </button>
              </div>
            )}
            

            {/* Nav Items - flex-1 makes this take remaining space and allows scrolling */}
            <nav className={`flex-1 overflow-y-auto scrollbar-hide py-4 space-y-2 ${isCollapsed && !isMobile ? 'px-2' : 'px-4'}`} 
                 style={{scrollbarWidth: 'none', msOverflowStyle: 'none'}}>
              <style jsx>{`
                nav::-webkit-scrollbar {
                  display: none;
                }
              `}</style>
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={handleNavigation}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center rounded-lg text-sm md:text-base font-medium transition-colors ${
                        isCollapsed && !isMobile 
                          ? 'justify-center p-2.5' 
                          : 'gap-3 px-3 py-2.5'
                      } ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }`}
                      title={isCollapsed && !isMobile ? item.name : ''}
                    >
                      <span className={`text-lg ${isActive ? 'text-white' : 'text-amber-400'}`}>
                        {item.icon}
                      </span>
                      {(!isCollapsed || isMobile) && (
                        <span className="whitespace-nowrap">{item.name}</span>
                      )}
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* Sticky Logout Button */}
            <div className={`sticky bottom-0 bg-gradient-to-b from-gray-800 to-gray-900 border-t border-gray-700 py-4 mt-auto ${isCollapsed && !isMobile ? 'px-2' : 'px-4'}`}>
              {isCollapsed && !isMobile ? (
                <div className="flex flex-col items-center space-y-2">
                  <Link href="/profile" title="Profile Settings" className="p-2 rounded-full text-gray-400 hover:text-amber-500 hover:bg-gray-700/50 transition-all duration-200">
                    <HiUserCircle className="h-6 w-6" />
                  </Link>
                  <div className="w-full">
                    <LogoutButton collapsed={true} />
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between space-x-2">
                  <div className="flex-grow">
                    <LogoutButton />
                  </div>
                  <Link href="/profile" title="Profile Settings" className="p-1 rounded-full text-gray-400 hover:text-amber-500 hover:bg-gray-700/50 transition-all duration-200 flex-shrink-0">
                    <HiUserCircle className="h-8 w-8" />
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for Mobile */}
      {isOpen && isMobile && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 z-[40]"
          onClick={() => setIsOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </>
  );
}
