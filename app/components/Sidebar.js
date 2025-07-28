'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FaUtensils,
  FaCog,
  FaBars,
  FaTimes,
  FaHistory,
  FaListAlt,
  FaClipboardList,
} from 'react-icons/fa';
import LogoutButton from './Logout';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: <FaUtensils /> },
  { name: 'Orders', path: '/order-history', icon: <FaHistory /> },
  { name: 'Menu', path: '/menu', icon: <FaListAlt /> },
  { name: 'Tables', path: '/table', icon: <FaClipboardList /> },
  { name: 'Settings', path: '/settings', icon: <FaCog /> },
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
    console.log('Logging out...');
    // Example: signOut();
  };

  return (
    <>
      {/* Mobile Hamburger */}
      <motion.button
        onClick={() => setIsOpen((prev) => !prev)}
        className="fixed top-4 left-4 z-70 p-3 rounded-md bg-gradient-to-r from-amber-600 to-amber-500 text-white md:hidden "
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
            className="fixed px-0 md:pt-16 pt-20  left-0 z-40 h-screen w-64 bg-gradient-to-b from-gray-800 to-gray-900 text-white shadow-lg flex flex-col"
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

            {/* Logout */}
            <div className="px-4 py-4 border-t  border-gray-700">
              <LogoutButton />
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
