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
} from 'react-icons/fa';
import { HiUserCircle } from 'react-icons/hi';
import LogoutButton from './Logout';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: <FaUtensils /> },
  { name: 'Orders', path: '/order-history', icon: <FaHistory /> },
  { name: 'Menu', path: '/menu', icon: <FaListAlt /> },
  { name: 'Tables', path: '/table', icon: <FaClipboardList /> },
  { name: 'Customers', path: '/customers', icon: <FaUsers /> },
  { name: 'Analytics', path: '/analytics', icon: <FaChartLine /> },
  { name: 'Staff', path: '/staff-management', icon: <FaUserCog /> },
  { name: 'Order Control', path: '/order-control', icon: <FaSlidersH /> },
  // { name: 'Printer Settings', path: '/printer-settings', icon: <FaPrint /> },
  { name: 'Support', path: '/support', icon: <FaQuestionCircle /> },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);

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
        className="fixed top-4 left-4 z-60 p-3 rounded-md bg-gradient-to-r from-amber-600 to-amber-500 text-white md:hidden "
        initial={false}
        animate={{ rotate: isOpen ? 90 : 0 }}
        transition={{ duration: 0.3 }}
        aria-label="Toggle Sidebar"
      >
        {isOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
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
            className="fixed px-0 left-0 z-40 w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-lg flex flex-col top-20 md:top-16 h-[calc(100vh-5rem)] md:h-[calc(100vh-4rem)]"
          >
            

            {/* Nav Items - flex-1 makes this take remaining space and allows scrolling */}
            <nav className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {navItems.map((item) => {
                const isActive = pathname === item.path;
                return (
                  <Link key={item.path} href={item.path} onClick={handleNavigation}>
                    <motion.div
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.97 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm md:text-base font-medium transition-colors ${
                        isActive
                          ? 'bg-gradient-to-r from-amber-700 to-amber-600 text-white shadow-md'
                          : 'text-gray-300 hover:bg-gray-700/50 hover:text-white'
                      }`}
                    >
                      <span className={`text-lg ${isActive ? 'text-white' : 'text-amber-400'}`}>
                        {item.icon}
                      </span>
                      <span className="whitespace-nowrap">{item.name}</span>
                    </motion.div>
                  </Link>
                );
              })}
            </nav>

            {/* Sticky Logout Button */}
            <div className="sticky bottom-0 bg-gradient-to-b from-gray-800 to-gray-900 border-t border-gray-700 px-4 py-4 mt-auto">
              <div className="flex items-center justify-between space-x-2">
                <div className="flex-grow">
                  <LogoutButton />
                </div>
                <Link href="/profile" title="Profile Settings" className="p-1 rounded-full text-gray-400 hover:text-amber-500 hover:bg-gray-700/50 transition-all duration-200 flex-shrink-0">
                  <HiUserCircle className="h-8 w-8" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlay for Mobile */}
      {isOpen && isMobile && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-40 z-30"
          onClick={() => setIsOpen(false)}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </>
  );
}
