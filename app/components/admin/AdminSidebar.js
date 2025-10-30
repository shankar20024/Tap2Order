"use client";
import React from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaHome, 
  FaUsers, 
  FaUserShield, 
  FaChartLine, 
  FaHistory, 
  FaCog, 
  FaSignOutAlt,
  FaTimes,
  FaBars,
  FaHeadset,
  FaBuilding,
  FaUtensils
} from 'react-icons/fa';
import { signOut } from 'next-auth/react';

export default function AdminSidebar({ 
  activeSection, 
  setActiveSection, 
  userCount, 
  adminCount,
  isMobileMenuOpen,
  setIsMobileMenuOpen 
}) {
  const router = useRouter();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FaHome, badge: null },
    { id: 'users', label: 'Hotel Owners', icon: FaBuilding, badge: userCount },
    { id: 'admins', label: 'Admins', icon: FaUserShield, badge: adminCount },
    { id: 'analytics', label: 'Analytics', icon: FaChartLine, badge: null },
    { id: 'support', label: 'Support Tickets', icon: FaHeadset, badge: null },
    { id: 'activity', label: 'Activity Log', icon: FaHistory, badge: null },
    { id: 'settings', label: 'Settings', icon: FaCog, badge: null },
  ];

  const handleNavigation = (sectionId) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  const handleLogout = async () => {
    await signOut({ redirect: true, callbackUrl: '/login' });
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 bg-gradient-to-br from-amber-500 to-orange-600 text-white p-3 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
      >
        {isMobileMenuOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 h-screen w-72 bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
        shadow-2xl z-40 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo Section */}
        <div className="p-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaUtensils className="text-white text-xl" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Tap2Order</h1>
              <p className="text-xs text-slate-400">Admin Panel</p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            
            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`
                  w-full flex items-center justify-between px-4 py-3 rounded-xl
                  transition-all duration-300 group relative overflow-hidden
                  ${isActive 
                    ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow-lg shadow-amber-500/30' 
                    : 'text-slate-300 hover:bg-slate-800/50 hover:text-white'
                  }
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`text-lg ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-amber-400'}`} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge !== null && (
                  <span className={`
                    px-2.5 py-0.5 rounded-full text-xs font-semibold
                    ${isActive 
                      ? 'bg-white/20 text-white' 
                      : 'bg-amber-500/10 text-amber-400 group-hover:bg-amber-500/20'
                    }
                  `}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Quick Actions */}
        <div className="p-4 border-t border-slate-700/50 space-y-2">
          <button
            onClick={() => router.push('/customer-support')}
            className="w-full px-4 py-2.5 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-lg transition-all duration-300 flex items-center gap-2 text-sm font-medium"
          >
            <FaHeadset />
            <span>Support Center</span>
          </button>
        </div>

        {/* Logout Button */}
        <div className="p-4 border-t border-slate-700/50">
          <button
            onClick={handleLogout}
            className="w-full px-4 py-3 bg-red-600/10 hover:bg-red-600/20 text-red-400 hover:text-red-300 rounded-xl transition-all duration-300 flex items-center gap-3 font-medium"
          >
            <FaSignOutAlt />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
