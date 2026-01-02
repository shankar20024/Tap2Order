"use client";
import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  FaHome,
  FaUserShield,
  FaChartLine,
  FaHistory,
  FaCog,
  FaSignOutAlt,
  FaBars,
  FaHeadset,
  FaBuilding,
  FaUtensils,
  FaQuestionCircle,
  FaBell,
  FaChevronLeft,
  FaChevronRight,
} from "react-icons/fa";
import { signOut } from "next-auth/react";

export default function AdminSidebar({
  activeSection,
  setActiveSection,
  userCount,
  adminCount,
  unreadNotificationCount = 0,
  isMobileMenuOpen,
  setIsMobileMenuOpen,
  isCollapsed,
  onToggleCollapse,
}) {
  const router = useRouter();

  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: FaHome, badge: null },
    { id: "users", label: "Hotel Owners", icon: FaBuilding, badge: userCount },
    { id: "admins", label: "Admins", icon: FaUserShield, badge: adminCount },
    {
      id: "notifications",
      label: "Notifications",
      icon: FaBell,
      badge: unreadNotificationCount,
    },
    { id: "contacts", label: "Customer Contacts", icon: FaQuestionCircle },
    { id: "analytics", label: "Analytics", icon: FaChartLine },
    { id: "support", label: "Support Tickets", icon: FaHeadset },
    { id: "activity", label: "Activity Log", icon: FaHistory },
    { id: "settings", label: "Settings", icon: FaCog },
  ];

  const handleNavigation = (sectionId) => {
    setActiveSection(sectionId);
    setIsMobileMenuOpen(false);
  };

  
  return (
    <>
      {/* MOBILE HAMBURGER */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className={`lg:hidden fixed top-4 left-4 z-50 bg-amber-600 text-white p-3 rounded-xl shadow-lg`}
      >
        <FaBars size={20} />
      </button>

      {/* SIDEBAR */}
      <aside
        className={`
          fixed top-0 left-0 h-screen bg-slate-900 shadow-2xl z-40 
          flex flex-col transition-all duration-300
          ${isMobileMenuOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${isCollapsed ? "w-20" : "w-72"}
        `}
      >
        {/* HEADER */}
        <div className="p-6 border-b border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-amber-600 rounded-xl flex items-center justify-center shadow-lg">
              <FaUtensils className="text-white text-xl" />
            </div>

            {!isCollapsed && (
              <div>
                <h1 className="text-xl font-bold text-white">Tap2Order</h1>
                <p className="text-xs text-slate-400">Admin Panel</p>
              </div>
            )}
          </div>
        </div>

        {/* NAVIGATION - Scrollbar Hidden */}
        <nav
          className="
            flex-1 px-3 py-6 space-y-2 
            overflow-y-auto overflow-x-hidden
            [scrollbar-width:none] [-ms-overflow-style:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavigation(item.id)}
                className={`
                  w-full flex items-center 
                  ${isCollapsed ? "justify-center" : "justify-between"}
                  px-4 py-3 rounded-xl transition-all duration-300
                  ${isActive ? "bg-amber-600/20 text-white" : "text-slate-300 hover:bg-slate-800/40"}
                `}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`text-lg ${isActive ? "text-amber-400" : ""}`} />

                  {!isCollapsed && <span>{item.label}</span>}
                </div>

                {!isCollapsed && item.badge > 0 && (
                  <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* LOGOUT */}
        <div className="p-4 border-t border-slate-700/40">
          <button
            onClick={() => signOut({ redirect: true, callbackUrl: "/login" })}
            className={`
              w-full px-4 py-3 rounded-xl flex items-center gap-3 text-red-400 
              hover:bg-red-600/20 transition
              ${isCollapsed ? "justify-center" : ""}
            `}
          >
            <FaSignOutAlt />
            {!isCollapsed && <span>Logout</span>}
          </button>
        </div>

        {/* COLLAPSE/EXPAND BUTTON */}
        <button
          onClick={onToggleCollapse}
          className="hidden lg:flex items-center justify-center w-8 h-8 rounded-full bg-black hover:bg-slate-700 absolute -right-4 top-8 text-slate-300 hover:text-white shadow-lg"
        >
          {isCollapsed ? <FaChevronRight size={14} /> : <FaChevronLeft size={14} />}
        </button>
      </aside>
    </>
  );
}
