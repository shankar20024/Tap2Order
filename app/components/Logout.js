"use client";
import { FaSignOutAlt } from "react-icons/fa";
import { signOut } from "next-auth/react";

export default function LogoutButton({ collapsed = false }) {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className={`bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 
                 text-white rounded-lg shadow-md transition duration-200 ease-in-out 
                 text-sm md:text-base font-medium ${
                   collapsed ? 'p-2 w-full flex justify-center' : 'px-5 py-2'
                 }`}
      title={collapsed ? 'Logout' : ''}
    >
     <div className={`flex items-center ${collapsed ? '' : 'gap-2'}`}>
       <FaSignOutAlt />
       {!collapsed && <span className="ml-2">Logout</span>}
     </div>
    </button>
  );
}
