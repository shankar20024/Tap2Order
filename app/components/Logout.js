"use client";

import { signOut } from "next-auth/react";

export default function LogoutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 
                 text-white px-5 py-2 rounded-lg shadow-md transition duration-200 ease-in-out 
                 text-sm md:text-base font-medium"
    >
      Logout
    </button>
  );
}
